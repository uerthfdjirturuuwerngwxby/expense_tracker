# Flask Analytics Backend

## Endpoints

### `GET /api/export-expenses?months=6`
Returns aggregated monthly expenses by category for the authenticated user (JWT cookie).

Single-month response (`months=1`, default):
```json
{
  "area": "Madhapur",
  "month": "2025-03",
  "Food_Dining": 8500,
  "Transportation": 2800,
  "Entertainment": 2000,
  "Shopping": 4200,
  "Utilities": 2500,
  "Housing": 18000,
  "Healthcare": 1000,
  "Education": 2500,
  "Travel": 1500,
  "Personal_Care": 900,
  "Other": 600,
  "Income": 80000,
  "Total_Expense": 44500
}
```

### `GET /api/analytics/prediction`
Returns forecast for next 3 months + advice + chart payload.

```json
{
  "area": "Madhapur",
  "forecast": [
    {"month": "2026-01", "expense": 46000},
    {"month": "2026-02", "expense": 47500},
    {"month": "2026-03", "expense": 49000}
  ],
  "advice": [
    "Reduce Shopping by 10% to improve savings."
  ],
  "recommended_spending": {
    "Food_Dining": 9000,
    "Transportation": 3000
  },
  "charts": {
    "line": [],
    "pie": [],
    "bar": []
  }
}
```

## Run

```bash
pip install -r ml_pipeline/flask_backend/requirements.txt
python ml_pipeline/flask_backend/app.py
```

Required env vars:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`

Optional:
- `MODEL_PATH` (default: `ml_pipeline/model.pkl`)
- `REFERENCE_DATA_PATH` (default: `data/hyderabad_household_expenses_2023_2025.csv`)
- `AUTH_COOKIE_NAME` (default: `auth_token`)
