# Hyderabad Household Expense ML Pipeline

## Files
- `data/hyderabad_household_expenses_2023_2025.csv` (1080 rows)
- `ml_pipeline/generate_dataset.py`
- `ml_pipeline/train_model.py`
- `ml_pipeline/app.py`
- `ml_pipeline/requirements.txt`

## 1) Dataset generation
```bash
python ml_pipeline/generate_dataset.py
```

## 2) Model training + pickle save
```bash
python ml_pipeline/train_model.py
```
This saves `ml_pipeline/model.pkl`.

## 3) Run Flask API
```bash
python ml_pipeline/app.py
```

## API examples

### POST /predict-expense
Request:
```json
{
  "area": "Madhapur",
  "Food_Dining": 9000,
  "Transportation": 3000,
  "Entertainment": 2500,
  "Shopping": 4500,
  "Utilities": 2500,
  "Housing": 20000,
  "Healthcare": 1200,
  "Education": 3000,
  "Travel": 2500,
  "Personal_Care": 1200,
  "Other": 900,
  "Income": 85000
}
```

cURL:
```bash
curl -X POST http://127.0.0.1:5000/predict-expense \
  -H "Content-Type: application/json" \
  -d "{\"area\":\"Madhapur\",\"Food_Dining\":9000,\"Transportation\":3000,\"Entertainment\":2500,\"Shopping\":4500,\"Utilities\":2500,\"Housing\":20000,\"Healthcare\":1200,\"Education\":3000,\"Travel\":2500,\"Personal_Care\":1200,\"Other\":900,\"Income\":85000}"
```

### GET /expense-forecast?area=Madhapur
cURL:
```bash
curl "http://127.0.0.1:5000/expense-forecast?area=Madhapur"
```

Response shape:
```json
{
  "area": "Madhapur",
  "forecast": [
    {"month": "2026-01", "expense": 46000},
    {"month": "2026-02", "expense": 47000},
    {"month": "2026-03", "expense": 48500}
  ],
  "charts": {
    "line": [
      {"month": "2026-01", "expense": 46000},
      {"month": "2026-02", "expense": 47000},
      {"month": "2026-03", "expense": 48500}
    ],
    "pie": [
      {"category": "Food_Dining", "value": 9000}
    ],
    "bar": [
      {"area": "Madhapur", "expense": 46850}
    ]
  }
}
```
