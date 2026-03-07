from __future__ import annotations

import pickle
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

DATASET_PATH = Path("data/hyderabad_household_expenses_2023_2025.csv")
MODEL_PATH = Path("ml_pipeline/model.pkl")

FEATURE_COLUMNS = [
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
    "Income",
    "Area",
]
TARGET_COLUMN = "Total_Expense"


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

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
    )

    model = RandomForestRegressor(
        n_estimators=300,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = root_mean_squared_error(y_test, y_pred)

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    with MODEL_PATH.open("wb") as f:
        pickle.dump(
            {
                "model": model,
                "area_encoder": area_encoder,
                "feature_columns": FEATURE_COLUMNS,
            },
            f,
        )

    print(f"Rows in dataset: {len(df_encoded)}")
    print(f"MAE: {mae:.2f}")
    print(f"RMSE: {rmse:.2f}")
    print(f"Saved model to: {MODEL_PATH}")


if __name__ == "__main__":
    train_and_save_model()
