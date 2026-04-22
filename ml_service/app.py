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

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent

MODEL_PATH = Path(os.getenv("MODEL_PATH", str(BASE_DIR / "model.pkl")))
REFERENCE_DATA_PATH = Path(
    os.getenv(
        "REFERENCE_DATA_PATH",
        str(PROJECT_ROOT / "data" / "hyderabad_household_expenses_2023_2025.csv"),
    )
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


def fetch_user_expenses_df(user_id: str, months: int | None = 12) -> pd.DataFrame:
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

    if months and months > 0:
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


def filter_monthly_data_by_base_month(
    monthly_data: List[Dict[str, Any]], base_month: str | None
) -> List[Dict[str, Any]]:
    if not base_month or base_month == "ALL":
        return monthly_data
    return [row for row in monthly_data if str(row.get("month", "")) <= base_month]


def month_diff(a: str, b: str) -> int:
    try:
        ay, am = [int(x) for x in str(a).split("-", 1)]
        by, bm = [int(x) for x in str(b).split("-", 1)]
    except Exception:
        return 0
    return ((ay - by) * 12) + (am - bm)


def next_month_key(month: str) -> str:
    base = pd.to_datetime(f"{month}-01")
    next_month = (base + pd.DateOffset(months=1)).replace(day=1)
    return next_month.strftime("%Y-%m")


def normalize_prediction_target_month(last_actual_month: str, requested_month: str | None) -> str:
    fallback = next_month_key(last_actual_month)
    if not requested_month:
        return fallback
    return requested_month if month_diff(requested_month, last_actual_month) > 0 else fallback


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

    total_model = bundle.get("model_total") or bundle.get("model")
    if total_model is None:
        raise RuntimeError("Total prediction model not found in model bundle")

    area_encoder = bundle["area_encoder"]
    feature_columns = bundle["feature_columns"]

    if area not in area_encoder.classes_:
        area = str(area_encoder.classes_[0])

    latest = category_data[-1]
    latest_month = pd.to_datetime(f"{latest['month']}-01")
    history = category_data

    # Seed with all available actual history from the database, while giving
    # more weight to the most recent months near the selected base month.
    seed: Dict[str, float] = {}
    encoded_area = int(area_encoder.transform([area])[0])
    history_count = len(history)
    recency_weights = [idx + 1 for idx in range(history_count)]

    for col in feature_columns:
        if col == "Area":
            seed[col] = encoded_area
            continue
        vals = [float(m.get(col, 0) or 0) for m in history]
        if vals:
            weighted_sum = sum(v * w for v, w in zip(vals, recency_weights))
            weight_total = sum(recency_weights[: len(vals)]) or 1.0
            v = weighted_sum / weight_total
        else:
            v = float(latest.get(col, 0) or 0)
        if col == "Income" and v <= 0:
            v = float(latest.get("Income", 0) or 0)
        seed[col] = max(0.0, v)

    state = dict(seed)
    forecast: List[Dict[str, Any]] = []
    category_forecast_monthly: List[Dict[str, Any]] = []

    for step in range(1, 4):
        future_month = (latest_month + pd.DateOffset(months=step)).replace(day=1)
        row_state = dict(state)
        seasonal = seasonal_multiplier_for_model(int(future_month.month))
        for seasonal_col, multiplier in seasonal.items():
            if seasonal_col in row_state:
                row_state[seasonal_col] = max(0.0, float(row_state[seasonal_col]) * float(multiplier))

        row_df = pd.DataFrame([row_state], columns=feature_columns)
        total_pred = max(0.0, float(total_model.predict(row_df)[0]))
        cat_pred = predict_category_next_month(bundle, feature_columns, row_state, total_pred)

        seasonal_adjusted = dict(cat_pred)
        seasonal_sum = 0.0
        for col, value in seasonal_adjusted.items():
            adjusted_val = float(value) * float(seasonal.get(col, 1.0))
            seasonal_adjusted[col] = max(0.0, adjusted_val)
            seasonal_sum += seasonal_adjusted[col]
        if seasonal_sum > 0 and total_pred > 0:
            scale = total_pred / seasonal_sum
            cat_pred = {k: round(v * scale, 2) for k, v in seasonal_adjusted.items()}
        else:
            cat_pred = {k: round(v, 2) for k, v in seasonal_adjusted.items()}

        forecast.append({"month": future_month.strftime("%Y-%m"), "expense": round(total_pred, 2)})
        category_forecast_monthly.append({
            "month": future_month.strftime("%Y-%m"),
            "categories": {k: round(float(v), 2) for k, v in cat_pred.items()},
        })

        # Recursive roll-forward using predicted categories.
        for col in UI_TO_MODEL_COL.values():
            state[col] = float(cat_pred.get(col, 0.0))
        state["Income"] = float(seed.get("Income", state.get("Income", 0.0)))
        state["Area"] = float(encoded_area)

    next_category_forecast = (
        category_forecast_monthly[0]["categories"] if category_forecast_monthly else {k: 0.0 for k in UI_TO_MODEL_COL.values()}
    )
    recommended_spending = {k: round(float(v), 2) for k, v in next_category_forecast.items()}

    advice = build_advice(area, latest, recommended_spending)
    deep_report = build_deep_report(area, latest, recommended_spending, next_category_forecast, forecast, bundle)

    category_actual_vs_predicted = [
        {
            "category": col,
            "actual": round(_safe_float(latest.get(col, 0)), 2),
            "predicted": round(_safe_float(next_category_forecast.get(col, 0)), 2),
            "delta": round(_safe_float(latest.get(col, 0)) - _safe_float(next_category_forecast.get(col, 0)), 2),
        }
        for col in UI_TO_MODEL_COL.values()
    ]

    return {
        "area": area,
        "forecast": forecast,
        "advice": advice,
        "recommended_spending": recommended_spending,
        "category_forecast": next_category_forecast,
        "category_forecast_monthly": category_forecast_monthly,
        "category_actual_vs_predicted": category_actual_vs_predicted,
        "deep_report": deep_report,
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

    rows = []
    for col in UI_TO_MODEL_COL.values():
        actual = _safe_float(latest.get(col, 0))
        target = _safe_float(recommended.get(col, 0))
        if target <= 0:
            continue
        delta = actual - target
        ratio = (actual / target) if target > 0 else 1.0
        rows.append((col, actual, target, delta, ratio))

    if not rows:
        return ["Not enough category data for model-based advice."]

    over = sorted([r for r in rows if r[3] > 0], key=lambda x: x[3], reverse=True)
    under = sorted([r for r in rows if r[3] < 0], key=lambda x: x[3])

    if over:
        c, a, t, d, ratio = over[0]
        pct = max(1, int(round((d / a) * 100))) if a > 0 else 0
        advice.append(f"Model indicates {c.replace('_', ' ')} is high: actual INR {a:,.0f} vs predicted INR {t:,.0f}. Reduce by ~{pct}%.")
    if len(over) > 1:
        c, a, t, d, _ = over[1]
        advice.append(f"Second high category: {c.replace('_', ' ')} is INR {d:,.0f} above model target.")
    if under:
        c, a, t, d, _ = under[0]
        advice.append(f"You can allocate more to {c.replace('_', ' ')} if needed: actual INR {a:,.0f}, model target INR {t:,.0f}.")

    total_actual = _safe_float(latest.get("Total_Expense", 0))
    total_target = sum(_safe_float(recommended.get(c, 0)) for c in UI_TO_MODEL_COL.values())
    diff = total_actual - total_target
    if diff > 0:
        advice.append(f"Total actual is INR {diff:,.0f} above next-month model target. Focus on discretionary cuts.")
    else:
        advice.append(f"Total actual is INR {abs(diff):,.0f} below next-month model target. Current pace is controlled.")

    return advice[:6]


def predict_category_next_month(
    bundle: Dict[str, Any],
    feature_columns: List[str],
    feature_row: Dict[str, float],
    target_total: float,
) -> Dict[str, float]:
    category_models: Dict[str, Any] = bundle.get("category_models", {})
    category_cols = list(UI_TO_MODEL_COL.values())

    row_df = pd.DataFrame([feature_row], columns=feature_columns)
    raw: Dict[str, float] = {}
    for col in category_cols:
        model = category_models.get(col)
        if model is None:
            raw[col] = max(0.0, _safe_float(feature_row.get(col, 0)))
        else:
            raw[col] = max(0.0, float(model.predict(row_df)[0]))

    s = sum(raw.values())
    if s <= 0:
        return {c: 0.0 for c in category_cols}

    scale = target_total / s if target_total > 0 else 1.0
    return {k: round(v * scale, 2) for k, v in raw.items()}


def build_deep_report(
    area: str,
    latest: Dict[str, Any],
    recommended: Dict[str, float],
    category_forecast: Dict[str, float],
    forecast: List[Dict[str, Any]],
    bundle: Dict[str, Any],
) -> List[str]:
    latest_total = _safe_float(latest.get("Total_Expense", 0))
    next_total = _safe_float(forecast[0]["expense"]) if forecast else latest_total

    lines: List[str] = []
    lines.append(f"Model report for {area}: current month actual is INR {latest_total:,.0f} and next month prediction is INR {next_total:,.0f}.")

    total_gap = latest_total - next_total
    if total_gap > 0:
        lines.append(f"You are currently INR {abs(total_gap):,.0f} above model next-month baseline; reduce discretionary categories.")
    else:
        lines.append(f"You are INR {abs(total_gap):,.0f} below model next-month baseline; spending is controlled.")

    comparisons = []
    for col in UI_TO_MODEL_COL.values():
        actual = _safe_float(latest.get(col, 0))
        pred = _safe_float(category_forecast.get(col, 0))
        comparisons.append((col, actual, pred, actual - pred))

    over = sorted([x for x in comparisons if x[3] > 0], key=lambda x: x[3], reverse=True)
    under = sorted([x for x in comparisons if x[3] < 0], key=lambda x: x[3])

    if over:
        c, a, p, d = over[0]
        lines.append(f"Top reduction category from model: {c.replace('_', ' ')} (actual INR {a:,.0f} vs predicted INR {p:,.0f}; cut INR {d:,.0f}).")
    if len(over) > 1:
        c, a, p, d = over[1]
        lines.append(f"Second reduction category: {c.replace('_', ' ')} is INR {d:,.0f} above model level.")
    if under:
        c, a, p, d = under[0]
        lines.append(f"Safe increase category: {c.replace('_', ' ')} can move from INR {a:,.0f} toward INR {p:,.0f}.")

    if category_forecast:
        top_next = sorted(category_forecast.items(), key=lambda kv: kv[1], reverse=True)[:3]
        top_text = ", ".join([f"{k.replace('_', ' ')} INR {v:,.0f}" for k, v in top_next])
        lines.append(f"Next-month model category mix: {top_text}.")

    lines.append("This report is generated from trained RandomForest models for total and category prediction.")
    return lines[:8]


def build_area_comparison(area: str, latest: Dict[str, Any]) -> List[Dict[str, Any]]:
    bundle = MODEL_BUNDLE
    if bundle is None:
        current = round(_safe_float(latest.get("Total_Expense", 0)), 2)
        return [{"area": area, "your_total": current, "area_average": current, "predicted_total": current}]

    total_model = bundle.get("model_total") or bundle.get("model")
    area_encoder = bundle.get("area_encoder")
    feature_columns = bundle.get("feature_columns")
    if total_model is None or area_encoder is None or not feature_columns:
        current = round(_safe_float(latest.get("Total_Expense", 0)), 2)
        return [{"area": area, "your_total": current, "area_average": current, "predicted_total": current}]

    seed: Dict[str, float] = {}
    for col in feature_columns:
        if col == "Area":
            seed[col] = 0.0
        elif col == "Income":
            income = _safe_float(latest.get("Income", 0))
            seed[col] = income if income > 0 else max(_safe_float(latest.get("Total_Expense", 0)) * 1.3, 1.0)
        else:
            seed[col] = max(0.0, _safe_float(latest.get(col, 0)))

    rows: List[Dict[str, Any]] = []
    actual_total = round(_safe_float(latest.get("Total_Expense", 0)), 2)

    for area_name in area_encoder.classes_:
        row = dict(seed)
        row["Area"] = int(area_encoder.transform([area_name])[0])
        pred_total = max(0.0, float(total_model.predict(pd.DataFrame([row], columns=feature_columns))[0]))
        rows.append(
            {
                "area": str(area_name),
                "your_total": actual_total if str(area_name) == area else 0.0,
                "area_average": round(pred_total, 2),
                "predicted_total": round(pred_total, 2),
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
    area = (request.args.get("area") or fetch_user_area(user_id) or "Madhapur").strip()
    base_month = (request.args.get("base_month") or "ALL").strip()
    predict_for_month = (request.args.get("predict_for_month") or "").strip()
    df = fetch_user_expenses_df(user_id, months=None)
    monthly_data = aggregate_monthly_expenses(df, area)
    monthly_data = filter_monthly_data_by_base_month(monthly_data, base_month)

    if not monthly_data:
        return jsonify({"message": "Not enough expense data to generate predictions."}), 400

    latest_month = monthly_data[-1]["month"]
    prediction_target_month = normalize_prediction_target_month(latest_month, predict_for_month)
    target_distance = max(1, month_diff(prediction_target_month, latest_month))
    forecast_start_index = max(0, target_distance - 1)
    cache_key = f"{user_id}:{area}:{base_month}:{prediction_target_month}:{latest_month}"
    cached = get_cached_prediction(cache_key)
    if cached:
        return jsonify(cached)

    pred_result = predict_future_expense(area, monthly_data)
    forecast_series = pred_result["forecast"]
    category_forecast_series = pred_result.get("category_forecast_monthly", [])
    forecast = forecast_series[forecast_start_index:forecast_start_index + 3]
    category_forecast_monthly = category_forecast_series[forecast_start_index:forecast_start_index + 3]
    category_forecast = (
        category_forecast_monthly[0]["categories"]
        if category_forecast_monthly else pred_result.get("category_forecast", {})
    )
    category_actual_vs_predicted = [
        {
            "category": col,
            "actual": round(_safe_float(latest.get(col, 0)), 2),
            "predicted": round(_safe_float(category_forecast.get(col, 0)), 2),
            "delta": round(_safe_float(latest.get(col, 0)) - _safe_float(category_forecast.get(col, 0)), 2),
        }
        for col in UI_TO_MODEL_COL.values()
    ]

    last6 = monthly_data[-6:]
    line_actual = [{"month": m["month"], "expense": m["Total_Expense"], "type": "actual"} for m in last6]
    line_forecast = [
        {"month": f["month"], "expense": f["expense"], "type": "predicted"}
        for f in forecast
    ]

    latest = monthly_data[-1]
    pie = [
        {"category": col, "value": round(_safe_float(latest.get(col, 0)), 2)}
        for col in UI_TO_MODEL_COL.values()
    ]

    area_bar = build_area_comparison(area, latest)

    response_payload = {
        "area": area,
        "base_month": base_month,
        "prediction_target_month": prediction_target_month,
        "forecast": forecast,
        "advice": pred_result["advice"],
        "recommended_spending": pred_result["recommended_spending"],
        "category_forecast": category_forecast,
        "category_forecast_monthly": category_forecast_monthly,
        "category_actual_vs_predicted": category_actual_vs_predicted,
        "deep_report": pred_result.get("deep_report", []),
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








