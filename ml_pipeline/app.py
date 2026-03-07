from __future__ import annotations

import pickle
from pathlib import Path

import numpy as np
import pandas as pd
from flask import Flask, jsonify, request

DATASET_PATH = Path("data/hyderabad_household_expenses_2023_2025.csv")
MODEL_PATH = Path("ml_pipeline/model.pkl")

EXPENSE_COLUMNS = [
    "Food_Dining",
    "Transportation",
    "Entertainment",
    "Shopping",
    "Utilities",
    "Housing",
    "Healthcare",
    "Education",
    "Travel",
    "Personal_Care",
    "Other",
]

app = Flask(__name__)

with MODEL_PATH.open("rb") as f:
    model_bundle = pickle.load(f)

MODEL = model_bundle["model"]
AREA_ENCODER = model_bundle["area_encoder"]
FEATURE_COLUMNS = model_bundle["feature_columns"]

REFERENCE_DF = pd.read_csv(DATASET_PATH)
REFERENCE_DF["Month"] = pd.to_datetime(REFERENCE_DF["Month"])


def encode_area(area: str) -> int:
    if area not in AREA_ENCODER.classes_:
        raise ValueError(f"Unknown area '{area}'.")
    return int(AREA_ENCODER.transform([area])[0])


def seasonal_adjustment_for_month(dt: pd.Timestamp) -> dict[str, float]:
    return {
        "Travel": 1.25 if dt.month in {5, 12} else 1.0,
        "Shopping": 1.20 if dt.month in {10, 11} else 1.0,
        "Utilities": 1.15 if dt.month in {4, 5, 6} else 1.0,
        "Education": 1.25 if dt.month == 6 else 1.0,
    }


def build_feature_vector(payload: dict) -> pd.DataFrame:
    row = {}
    for col in FEATURE_COLUMNS:
        if col == "Area":
            row[col] = encode_area(payload["area"])
        else:
            if col not in payload:
                raise KeyError(col)
            row[col] = float(payload[col])
    return pd.DataFrame([row], columns=FEATURE_COLUMNS)


@app.post("/predict-expense")
def predict_expense():
    payload = request.get_json(silent=True) or {}

    try:
        X_input = build_feature_vector(payload)
    except KeyError as missing:
        return jsonify({"error": f"Missing field: {missing}"}), 400
    except ValueError as err:
        return jsonify({"error": str(err)}), 400

    pred = float(MODEL.predict(X_input)[0])
    return jsonify({"predicted_expense": round(pred, 2)})


@app.get("/expense-forecast")
def expense_forecast():
    area = request.args.get("area", type=str)
    if not area:
        return jsonify({"error": "Query param 'area' is required."}), 400

    try:
        area_code = encode_area(area)
    except ValueError as err:
        return jsonify({"error": str(err)}), 400

    area_history = REFERENCE_DF[REFERENCE_DF["Area"] == area].sort_values("Month")
    if area_history.empty:
        return jsonify({"error": f"No records found for area '{area}'"}), 404

    baseline = area_history.tail(6)
    baseline_features = baseline[EXPENSE_COLUMNS + ["Income"]].mean().to_dict()

    last_month = REFERENCE_DF["Month"].max()
    forecast_rows = []

    for step in range(1, 4):
        future_month = (last_month + pd.DateOffset(months=step)).replace(day=1)
        growth = 1.0 + (0.015 * step)
        seasonal = seasonal_adjustment_for_month(future_month)

        features = {}
        for col in FEATURE_COLUMNS:
            if col == "Area":
                features[col] = area_code
            elif col in seasonal:
                features[col] = baseline_features[col] * growth * seasonal[col]
            else:
                features[col] = baseline_features[col] * growth

        X_future = pd.DataFrame([features], columns=FEATURE_COLUMNS)
        predicted = float(MODEL.predict(X_future)[0])

        forecast_rows.append(
            {
                "month": future_month.strftime("%Y-%m"),
                "expense": round(predicted, 2),
            }
        )

    pie_source = area_history.tail(3)
    category_distribution = [
        {"category": col, "value": round(float(pie_source[col].mean()), 2)} for col in EXPENSE_COLUMNS
    ]

    area_comparison = []
    for comp_area in sorted(REFERENCE_DF["Area"].unique()):
        comp_hist = REFERENCE_DF[REFERENCE_DF["Area"] == comp_area].sort_values("Month").tail(6)
        comp_base = comp_hist[EXPENSE_COLUMNS + ["Income"]].mean().to_dict()
        first_forecast_month = (last_month + pd.DateOffset(months=1)).replace(day=1)
        comp_season = seasonal_adjustment_for_month(first_forecast_month)

        comp_features = {}
        for col in FEATURE_COLUMNS:
            if col == "Area":
                comp_features[col] = int(AREA_ENCODER.transform([comp_area])[0])
            elif col in comp_season:
                comp_features[col] = comp_base[col] * 1.015 * comp_season[col]
            else:
                comp_features[col] = comp_base[col] * 1.015

        comp_pred = float(MODEL.predict(pd.DataFrame([comp_features], columns=FEATURE_COLUMNS))[0])
        area_comparison.append({"area": comp_area, "expense": round(comp_pred, 2)})

    area_comparison.sort(key=lambda x: x["expense"], reverse=True)

    return jsonify(
        {
            "area": area,
            "forecast": forecast_rows,
            "charts": {
                "line": forecast_rows,
                "pie": category_distribution,
                "bar": area_comparison,
            },
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
