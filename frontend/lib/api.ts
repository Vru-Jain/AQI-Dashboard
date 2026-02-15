const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Stats {
    total_responses: number;
    healthcare_utilization: number;
    construction_pollution_belief: string;
    aqi_awareness: number;
    wheezing_prevalence: number;
    doctor_visits_yes: number;
}

export interface ChartItem {
    name: string;
    value: number;
}

export interface PredictionResult {
    probability: number;
    risk_level: string;
    inputs: Record<string, string>;
}

export interface Filters {
    [key: string]: string[];
}

async function fetchJson<T>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

export const api = {
    getStats: () => fetchJson<Stats>("/api/stats"),
    getFilters: () => fetchJson<Filters>("/api/filters"),
    getDoctorVisits: () => fetchJson<ChartItem[]>("/api/charts/doctor-visits"),
    getSeason: () => fetchJson<ChartItem[]>("/api/charts/season"),
    getHousing: () => fetchJson<ChartItem[]>("/api/charts/housing"),
    getSymptoms: () => fetchJson<ChartItem[]>("/api/charts/symptoms"),
    getDustEntry: () => fetchJson<ChartItem[]>("/api/charts/dust-entry"),
    getAgeDistribution: () => fetchJson<ChartItem[]>("/api/charts/age-distribution"),
    getGender: () => fetchJson<ChartItem[]>("/api/charts/gender"),
    getEyeIrritation: () => fetchJson<ChartItem[]>("/api/charts/eye-irritation"),
    getChestHeaviness: () => fetchJson<ChartItem[]>("/api/charts/chest-heaviness"),
    predict: (params: Record<string, string>) => {
        const qs = new URLSearchParams(params).toString();
        return fetchJson<PredictionResult>(`/api/predict?${qs}`);
    },
};
