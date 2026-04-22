from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd


AREAS = [
    "Madhapur",
    "Gachibowli",
    "Hitech City",
    "Kukatpally",
    "Ameerpet",
    "Banjara Hills",
    "Jubilee Hills",
    "Secunderabad",
    "Begumpet",
    "Kondapur",
    "Manikonda",
    "Miyapur",
    "Chandanagar",
    "Lingampally",
    "Dilsukhnagar",
    "Uppal",
    "LB Nagar",
    "Mehdipatnam",
    "Tarnaka",
    "Kompally",
    "Nallagandla",
    "Attapur",
    "Alwal",
    "Bachupally",
    "Bowenpally",
    "Nizampet",
    "Somajiguda",
    "Masab Tank",
    "Khairatabad",
    "Nagole",
]

HIGH_INCOME_AREAS = {
    "Banjara Hills",
    "Jubilee Hills",
    "Hitech City",
    "Madhapur",
    "Gachibowli",
    "Kondapur",
}
MID_INCOME_AREAS = {
    "Manikonda",
    "Begumpet",
    "Somajiguda",
    "Khairatabad",
    "Nallagandla",
    "Kompally",
}
MODERATE_INCOME_AREAS = {
    "Kukatpally",
    "Miyapur",
    "Bachupally",
    "Nizampet",
    "Chandanagar",
    "Lingampally",
    "Ameerpet",
    "Secunderabad",
    "Mehdipatnam",
    "Attapur",
    "Bowenpally",
    "Masab Tank",
}
LOWER_INCOME_AREAS = {"Dilsukhnagar", "Uppal", "LB Nagar", "Tarnaka", "Nagole", "Alwal"}

EXPENSE_RANGES: Dict[str, Tuple[int, int]] = {
    "Food_Dining": (6000, 12000),
    "Transportation": (2000, 5000),
    "Entertainment": (1500, 5000),
    "Shopping": (2000, 7000),
    "Utilities": (1500, 4000),
    "Housing": (8000, 35000),
    "Healthcare": (500, 2000),
    "Education": (1000, 6000),
    "Travel": (1000, 8000),
    "Personal_Care": (800, 2500),
    "Other": (500, 2000),
}

INCOME_RANGES: Dict[str, Tuple[int, int]] = {
    "high": (80000, 150000),
    "mid": (55000, 100000),
    "moderate": (40000, 75000),
    "lower": (30000, 50000),
}

AREA_FACTOR = {
    "Madhapur": 1.30,
    "Gachibowli": 1.32,
    "Hitech City": 1.35,
    "Kukatpally": 0.98,
    "Ameerpet": 0.95,
    "Banjara Hills": 1.42,
    "Jubilee Hills": 1.45,
    "Secunderabad": 0.96,
    "Begumpet": 1.10,
    "Kondapur": 1.26,
    "Manikonda": 1.06,
    "Miyapur": 0.93,
    "Chandanagar": 0.89,
    "Lingampally": 0.91,
    "Dilsukhnagar": 0.80,
    "Uppal": 0.82,
    "LB Nagar": 0.81,
    "Mehdipatnam": 0.90,
    "Tarnaka": 0.83,
    "Kompally": 1.03,
    "Nallagandla": 1.08,
    "Attapur": 0.92,
    "Alwal": 0.79,
    "Bachupally": 0.94,
    "Bowenpally": 0.92,
    "Nizampet": 0.90,
    "Somajiguda": 1.12,
    "Masab Tank": 0.97,
    "Khairatabad": 1.11,
    "Nagole": 0.82,
}

GROUP_FACTOR = {"high": 1.18, "mid": 1.03, "moderate": 0.92, "lower": 0.80}


def get_income_group(area: str) -> str:
    if area in HIGH_INCOME_AREAS:
        return "high"
    if area in MID_INCOME_AREAS:
        return "mid"
    if area in MODERATE_INCOME_AREAS:
        return "moderate"
    return "lower"


@dataclass
class SeasonalMultipliers:
    travel: float
    shopping: float
    utilities: float
    education: float


def seasonal_multipliers(month: int) -> SeasonalMultipliers:
    return SeasonalMultipliers(
        travel=1.35 if month in {5, 12} else 1.0,
        shopping=1.30 if month in {10, 11} else 1.0,
        utilities=1.25 if month in {4, 5, 6} else 1.0,
        education=1.40 if month == 6 else 1.0,
    )


def generate_dataset(seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    months = pd.date_range("2023-01-01", "2025-12-01", freq="MS")
    rows: List[dict] = []

    for month_idx, dt in enumerate(months):
        season = seasonal_multipliers(dt.month)
        trend = 1.0 + (month_idx * 0.003)

        for area in AREAS:
            group = get_income_group(area)
            group_factor = GROUP_FACTOR[group]
            area_factor = AREA_FACTOR[area]
            category_values: Dict[str, int] = {}

            for category, (low, high) in EXPENSE_RANGES.items():
                base = rng.uniform(low, high)
                seasonal = 1.0
                if category == "Travel":
                    seasonal = season.travel
                elif category == "Shopping":
                    seasonal = season.shopping
                elif category == "Utilities":
                    seasonal = season.utilities
                elif category == "Education":
                    seasonal = season.education

                value = int(round(base * group_factor * area_factor * seasonal * trend))
                value = max(low, min(high, value))
                category_values[category] = value

            total_expense = int(sum(category_values.values()))
            income_low, income_high = INCOME_RANGES[group]

            if total_expense >= income_high - 1500:
                scale = (income_high - 1500) / total_expense
                for category, (low, _high) in EXPENSE_RANGES.items():
                    category_values[category] = max(low, int(round(category_values[category] * scale)))
                total_expense = int(sum(category_values.values()))

            min_income = max(income_low, total_expense + 1200)
            min_income = min(min_income, income_high - 500)
            income = int(rng.integers(min_income, income_high + 1))
            savings = income - total_expense

            rows.append(
                {
                    "Month": dt.strftime("%Y-%m-01"),
                    "Area": area,
                    **category_values,
                    "Income": income,
                    "Savings": savings,
                    "Total_Expense": total_expense,
                }
            )

    return pd.DataFrame(rows)


if __name__ == "__main__":
    output_path = Path("data/hyderabad_household_expenses_2023_2025.csv")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df = generate_dataset(seed=42)
    df.to_csv(output_path, index=False)
    print(f"Saved {len(df)} rows to {output_path}")
