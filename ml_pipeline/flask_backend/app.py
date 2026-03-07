from __future__ import annotations

import os
import pickle
import time
from dataclasses import dataclass
from datetime import datetime
from functools import wraps
from pathlib import Path
from typing import Any, Dict, List, Tuple

import jwt
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS
from supabase import Client, create_client

app = Flask(__name__)
CORS(app, supports_credentials=True)

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret")
JWT_ALGO = "HS256"
COOKIE_NAME = os.getenv("AUTH_COOKIE_NAME", "auth_token")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
supabase: Client | None = None
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

MODEL_PATH = Path(os.getenv("MODEL_PATH", "ml_pipeline/model.pkl"))
REFERENCE_DATA_PATH = Path(
    os.getenv("REFERENCE_DATA_PATH", "data/hyderabad_household_expenses_2023_2025.csv")
)

MODEL_BUNDLE: Dict[str, Any] | None = None
REFERENCE_DF: pd.DataFrame = pd.DataFrame()

CATEGORIES_UI = [
    "Food & Dining",
    "Transportation",
    "Entertainment",
    "Shopping",
    "Utilities",
    "Housing",
    "Healthcare",
    "Education",
    "Travel",
    "Personal Care",
    "Other",
]

UI_TO_MODEL_COL = {
    "Food & Dining": "Food_Dining",
    "Transportation": "Transportation",
    "Entertainment": "Entertainment",
    "Shopping": "Shopping",
    "Utilities": "Utilities",
    "Housing": "Housing",
    "Healthcare": "Healthcare",
    "Education": "Education",
    "Travel": "Travel",
    "Personal Care": "Personal_Care",
    "Other": "Other",
}

HIGH_INCOME_AREAS = {
    "Banjara Hills",
    "Jubilee Hills",
    "Hitech City",
    "Madhapur",
    "Gachibowli",
    "Kondapur",
}

PREDICTION_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_SECONDS = 24 * 60 * 60


@dataclass
class AuthUser:
    id: str
    email: str | None


def load_model_bundle() -> Dict[str, Any]:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
    with MODEL_PATH.open("rb") as f:
        return pickle.load(f)


def load_reference_df() -> pd.DataFrame:
    if not REFERENCE_DATA_PATH.exists():
        return pd.DataFrame()
    df = pd.read_csv(REFERENCE_DATA_PATH)
    if "Month" in df.columns:
        df["Month"] = pd.to_datetime(df["Month"])
    return df


def _decode_user_from_cookie() -> AuthUser:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise PermissionError("Missing auth cookie")

    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    user_id = payload.get("id")
    if not user_id:
        raise PermissionError("Invalid token payload")

    return AuthUser(id=user_id, email=payload.get("email"))


def require_auth(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            request.user = _decode_user_from_cookie()
        except Exception:
            return jsonify({"message": "Not authenticated"}), 401
        return fn(*args, **kwargs)

    return wrapper


def _safe_float(v: Any) -> float:
    try:
        return float(v or 0)
    except Exception:
        return 0.0


def fetch_user_area(user_id: str) -> str:
    if supabase is None:
        return "Madhapur"

    prof = (
        supabase.table("profiles")
        .select("area,location")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )

    if not prof.data:
        return "Madhapur"

    row = prof.data[0]
    return row.get("area") or row.get("location") or "Madhapur"


def fetch_user_expenses_df(user_id: str, months: int = 12) -> pd.DataFrame:
    if supabase is None:
        return pd.DataFrame()

    data = (
        supabase.table("expenses")
        .select("category,amount,type,expense_date")
        .eq("user_id", user_id)
        .order("expense_date", desc=False)
        .execute()
    )

    rows = data.data or []
    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(rows)
    if "expense_date" not in df.columns:
        return pd.DataFrame()

    df["expense_date"] = pd.to_datetime(df["expense_date"], errors="coerce")
    df = df.dropna(subset=["expense_date"])
    if df.empty:
        return df

    max_date = df["expense_date"].max()
    min_date = max_date - pd.DateOffset(months=max(months, 1) - 1)
    df = df[df["expense_date"] >= min_date]
    return df


def aggregate_monthly_expenses(df: pd.DataFrame, area: str) -> List[Dict[str, Any]]:
    if df.empty:
        return []

    work = df.copy()
    work["month"] = work["expense_date"].dt.strftime("%Y-%m")

    records: List[Dict[str, Any]] = []
    for month, month_df in work.groupby("month"):
        row: Dict[str, Any] = {"area": area, "month": month}

        for ui_cat in CATEGORIES_UI:
            model_col = UI_TO_MODEL_COL[ui_cat]
            value = month_df.loc[
                (month_df["category"] == ui_cat) & (month_df["type"] != "income"), "amount"
            ].sum()
            row[model_col] = round(_safe_float(value), 2)

        income_sum = month_df.loc[
            (month_df["type"] == "income") | (month_df["category"] == "Income"), "amount"
        ].sum()
        row["Income"] = round(_safe_float(income_sum), 2)
        row["Total_Expense"] = round(sum(row[UI_TO_MODEL_COL[c]] for c in CATEGORIES_UI), 2)
        records.append(row)

    records.sort(key=lambda r: r["month"])
    return records


def seasonal_multiplier_for_model(month: int) -> Dict[str, float]:
    return {
        "Travel": 1.25 if month in {5, 12} else 1.0,
        "Shopping": 1.20 if month in {10, 11} else 1.0,
        "Utilities": 1.15 if month in {4, 5, 6} else 1.0,
        "Education": 1.20 if month == 6 else 1.0,
    }


def predict_future_expense(area: str, category_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not category_data:
        raise ValueError("No monthly expense data found for prediction.")

    bundle = MODEL_BUNDLE
    if bundle is None:
        raise RuntimeError("Model not loaded")

    model = bundle["model"]
    area_encoder = bundle["area_encoder"]
    feature_columns = bundle["feature_columns"]

    if area not in area_encoder.classes_:
        area = area_encoder.classes_[0]

    recent = category_data[-6:]
    baseline = {
        col: float(pd.Series([m.get(col, 0) for m in recent]).mean())
        for col in [*UI_TO_MODEL_COL.values(), "Income"]
    }

    latest_month = pd.to_datetime(f"{category_data[-1]['month']}-01")
    forecast: List[Dict[str, Any]] = []

    for step in range(1, 4):
        future_month = (latest_month + pd.DateOffset(months=step)).replace(day=1)
        growth = 1.0 + (0.015 * step)
        seasonal = seasonal_multiplier_for_model(int(future_month.month))

        feature_row = {}
        for col in feature_columns:
            if col == "Area":
                feature_row[col] = int(area_encoder.transform([area])[0])
            elif col in seasonal:
                feature_row[col] = baseline[col] * growth * seasonal[col]
            else:
                feature_row[col] = baseline[col] * growth

        pred = float(model.predict(pd.DataFrame([feature_row], columns=feature_columns))[0])
        forecast.append({"month": future_month.strftime("%Y-%m"), "expense": round(pred, 2)})

    latest = category_data[-1]
    recommended_spending = area_recommended_spending(area, latest)
    advice = build_advice(area, latest, recommended_spending)

    return {
        "area": area,
        "forecast": forecast,
        "advice": advice,
        "recommended_spending": recommended_spending,
    }


def area_recommended_spending(area: str, latest: Dict[str, Any]) -> Dict[str, float]:
    cols = list(UI_TO_MODEL_COL.values())

    if not REFERENCE_DF.empty and area in REFERENCE_DF["Area"].unique():
        area_rows = REFERENCE_DF[REFERENCE_DF["Area"] == area]
        base = {c: float(area_rows[c].mean()) for c in cols}
    else:
        base = {c: _safe_float(latest.get(c, 0)) for c in cols}

    income = _safe_float(latest.get("Income", 0))
    if income > 0:
        baseline_income = 80000.0 if area in HIGH_INCOME_AREAS else 55000.0
        ratio = max(0.75, min(1.35, income / baseline_income))
        base = {k: round(v * ratio, 2) for k, v in base.items()}

    return {k: round(v, 2) for k, v in base.items()}


def build_advice(area: str, latest: Dict[str, Any], recommended: Dict[str, float]) -> List[str]:
    advice: List[str] = []

    for cat in ["Shopping", "Food_Dining", "Transportation", "Travel"]:
        actual = _safe_float(latest.get(cat, 0))
        target = _safe_float(recommended.get(cat, 0))
        if target <= 0:
            continue

        ratio = actual / target
        if ratio > 1.15:
            reduction = max(5, min(20, int(round((ratio - 1.0) * 100))))
            advice.append(f"Reduce {cat.replace('_', ' ')} by {reduction}% to improve savings.")
        elif 0.9 <= ratio <= 1.1:
            advice.append(f"{cat.replace('_', ' ')} spending is optimal for your area profile.")

    if area in HIGH_INCOME_AREAS:
        advice.append("High-income area benchmark: keep lifestyle inflation under control to protect long-term savings.")

    if not advice:
        advice.append("Spending pattern looks balanced. Track trends monthly and keep emergency savings above 20% of income.")

    return advice[:5]


def build_area_comparison(area: str, latest: Dict[str, Any]) -> List[Dict[str, Any]]:
    if REFERENCE_DF.empty:
        return [
            {
                "area": area,
                "your_total": round(_safe_float(latest.get("Total_Expense", 0)), 2),
                "area_average": round(_safe_float(latest.get("Total_Expense", 0)), 2),
            }
        ]

    rows = []
    area_avg_map = REFERENCE_DF.groupby("Area")["Total_Expense"].mean().to_dict()
    your_total = _safe_float(latest.get("Total_Expense", 0))

    for a, avg in area_avg_map.items():
        rows.append(
            {
                "area": a,
                "your_total": round(your_total if a == area else 0.0, 2),
                "area_average": round(float(avg), 2),
            }
        )

    rows.sort(key=lambda x: x["area_average"], reverse=True)
    return rows


def get_cached_prediction(cache_key: str) -> Dict[str, Any] | None:
    entry = PREDICTION_CACHE.get(cache_key)
    if not entry:
        return None
    if entry["expires_at"] < time.time():
        PREDICTION_CACHE.pop(cache_key, None)
        return None
    return entry["value"]


def set_cached_prediction(cache_key: str, value: Dict[str, Any]) -> None:
    PREDICTION_CACHE[cache_key] = {
        "expires_at": time.time() + CACHE_TTL_SECONDS,
        "value": value,
    }


@app.get("/api/export-expenses")
@require_auth
def export_expenses():
    user_id = request.user.id
    months = int(request.args.get("months", 1))
    months = max(1, min(months, 24))

    area = fetch_user_area(user_id)
    df = fetch_user_expenses_df(user_id, months=months)
    monthly_data = aggregate_monthly_expenses(df, area)

    if not monthly_data:
        empty = {
            "area": area,
            "month": datetime.utcnow().strftime("%Y-%m"),
            **{v: 0 for v in UI_TO_MODEL_COL.values()},
            "Income": 0,
            "Total_Expense": 0,
        }
        return jsonify(empty)

    if months == 1:
        return jsonify(monthly_data[-1])

    return jsonify({"area": area, "monthly_data": monthly_data})


@app.get("/api/analytics/prediction")
@require_auth
def analytics_prediction():
    user_id = request.user.id
    area = fetch_user_area(user_id)
    df = fetch_user_expenses_df(user_id, months=9)
    monthly_data = aggregate_monthly_expenses(df, area)

    if not monthly_data:
        return jsonify({"message": "Not enough expense data to generate predictions."}), 400

    latest_month = monthly_data[-1]["month"]
    cache_key = f"{user_id}:{area}:{latest_month}"
    cached = get_cached_prediction(cache_key)
    if cached:
        return jsonify(cached)

    pred_result = predict_future_expense(area, monthly_data)

    last6 = monthly_data[-6:]
    line_actual = [{"month": m["month"], "expense": m["Total_Expense"], "type": "actual"} for m in last6]
    line_forecast = [
        {"month": f["month"], "expense": f["expense"], "type": "predicted"}
        for f in pred_result["forecast"]
    ]

    latest = monthly_data[-1]
    pie = [
        {"category": col, "value": round(_safe_float(latest.get(col, 0)), 2)}
        for col in UI_TO_MODEL_COL.values()
    ]

    area_bar = build_area_comparison(area, latest)

    response_payload = {
        "area": area,
        "forecast": pred_result["forecast"],
        "advice": pred_result["advice"],
        "recommended_spending": pred_result["recommended_spending"],
        "charts": {
            "line": line_actual + line_forecast,
            "pie": pie,
            "bar": area_bar,
        },
    }

    set_cached_prediction(cache_key, response_payload)
    return jsonify(response_payload)


@app.get("/api/health")
def health():
    return jsonify({"ok": True})


def initialize() -> None:
    global MODEL_BUNDLE, REFERENCE_DF
    MODEL_BUNDLE = load_model_bundle()
    REFERENCE_DF = load_reference_df()


initialize()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

