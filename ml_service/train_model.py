from __future__ import annotations

import pickle
from pathlib import Path
from typing import Dict, List

import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error
from sklearn.preprocessing import LabelEncoder

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
DATASET_PATH = PROJECT_ROOT / "data" / "hyderabad_household_expenses_2023_2025.csv"
MODEL_PATH = BASE_DIR / "model.pkl"

CATEGORY_COLUMNS: List[str] = [
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

FEATURE_COLUMNS: List[str] = [
    *CATEGORY_COLUMNS,
    "Income",
    "Area",
]
TARGET_COLUMN = "Total_Expense"


def _build_area_profiles(df: pd.DataFrame, encoder: LabelEncoder) -> Dict[str, Dict[str, float]]:
    profiles: Dict[str, Dict[str, float]] = {}
    by_area = df.groupby("Area")
    for area_id, g in by_area:
        area_name = str(encoder.inverse_transform([int(area_id)])[0])
        profiles[area_name] = {
            "avg_income": float(g["Income"].mean()),
            "avg_total_expense": float(g["Total_Expense"].mean()),
            "avg_savings": float((g["Income"] - g["Total_Expense"]).mean()),
            "category_means": {c: float(g[c].mean()) for c in CATEGORY_COLUMNS},
        }
    return profiles


def load_and_prepare_data(path: Path) -> tuple[pd.DataFrame, pd.Series, LabelEncoder, pd.DataFrame]:
    df = pd.read_csv(path)
    df["Month"] = pd.to_datetime(df["Month"])

    encoder = LabelEncoder()
    df["Area"] = encoder.fit_transform(df["Area"])

    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]
    return X, y, encoder, df


def train_and_save_model() -> None:
    X, y, area_encoder, df_encoded = load_and_prepare_data(DATASET_PATH)
    df_encoded = df_encoded.sort_values("Month").reset_index(drop=True)
    X = X.loc[df_encoded.index].reset_index(drop=True)
    y = y.loc[df_encoded.index].reset_index(drop=True)

    split_index = max(1, int(len(df_encoded) * 0.8))
    if split_index >= len(df_encoded):
        split_index = len(df_encoded) - 1

    X_train = X.iloc[:split_index]
    X_test = X.iloc[split_index:]
    y_train = y.iloc[:split_index]
    y_test = y.iloc[split_index:]

    total_model = RandomForestRegressor(
        n_estimators=400,
        random_state=42,
        n_jobs=-1,
        min_samples_leaf=2,
    )
    total_model.fit(X_train, y_train)

    y_pred = total_model.predict(X_test)
    total_mae = mean_absolute_error(y_test, y_pred)
    total_rmse = root_mean_squared_error(y_test, y_pred)

    # Train one model per category for richer analytics/reporting.
    category_models: Dict[str, RandomForestRegressor] = {}
    category_metrics: Dict[str, Dict[str, float]] = {}
    for col in CATEGORY_COLUMNS:
        y_cat = df_encoded[col]
        Xc_train = X.iloc[:split_index]
        Xc_test = X.iloc[split_index:]
        yc_train = y_cat.iloc[:split_index]
        yc_test = y_cat.iloc[split_index:]
        cat_model = RandomForestRegressor(
            n_estimators=300,
            random_state=42,
            n_jobs=-1,
            min_samples_leaf=2,
        )
        cat_model.fit(Xc_train, yc_train)
        pred_cat = cat_model.predict(Xc_test)
        category_models[col] = cat_model
        category_metrics[col] = {
            "mae": float(mean_absolute_error(yc_test, pred_cat)),
            "rmse": float(root_mean_squared_error(yc_test, pred_cat)),
        }

    area_profiles = _build_area_profiles(df_encoded, area_encoder)

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    with MODEL_PATH.open("wb") as f:
        pickle.dump(
            {
                # Backward-compatible keys
                "model": total_model,
                "area_encoder": area_encoder,
                "feature_columns": FEATURE_COLUMNS,
                # Rich model payload
                "model_total": total_model,
                "category_models": category_models,
                "category_columns": CATEGORY_COLUMNS,
                "area_profiles": area_profiles,
                "metrics": {
                    "total": {"mae": float(total_mae), "rmse": float(total_rmse)},
                    "category": category_metrics,
                },
                "dataset_rows": int(len(df_encoded)),
                "train_rows": int(len(X_train)),
                "test_rows": int(len(X_test)),
                "test_period": {
                    "from": str(df_encoded.iloc[split_index]["Month"].date()),
                    "to": str(df_encoded.iloc[-1]["Month"].date()),
                },
            },
            f,
        )

    print(f"Rows in dataset: {len(df_encoded)}")
    print(f"Total MAE: {total_mae:.2f}")
    print(f"Total RMSE: {total_rmse:.2f}")
    print("Category metrics:")
    for col in CATEGORY_COLUMNS:
        m = category_metrics[col]
        print(f"  {col}: MAE={m['mae']:.2f}, RMSE={m['rmse']:.2f}")
    print(f"Saved model to: {MODEL_PATH}")


if __name__ == "__main__":
    train_and_save_model()
