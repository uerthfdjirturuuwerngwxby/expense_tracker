export async function analyticsApiFetch(path) {
  const response = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || "Request failed");
  }
  return data;
}

export async function fetchExportExpenses(months = 6) {
  return analyticsApiFetch(`/api/export-expenses?months=${months}`);
}

export async function fetchPredictionAnalytics() {
  return analyticsApiFetch("/ml-api/analytics/prediction");
}
