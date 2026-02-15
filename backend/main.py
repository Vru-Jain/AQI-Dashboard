"""
FastAPI backend for Community Health & Air Quality Dashboard.
Serves data from Excel + ML predictions from trained model.
"""

import os
import pickle
from typing import Optional

import numpy as np
import pandas as pd
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

# ── App Setup ──
app = FastAPI(title="Community Health API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load Data ──
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "Climate Skills Questionnaire (Responses).xlsx")

COLUMN_NAMES = [
    "Timestamp", "Age Group", "Gender", "Locality", "Years in Area",
    "Housing Type", "Occupation", "Dust Entry Frequency", "Nearby Hazards",
    "Worst Pollution Season", "Outdoor Avoidance", "Health Symptoms",
    "Morning Chest Heaviness", "Wheezing Sound", "Eye/Throat Irritation",
    "Doctor Visit (Breathing)", "Open Drains Nearby", "Foul Smell Daily",
    "Construction Pollution", "AQI Awareness", "First Action on Cough",
    "Disease or Normal", "Workshop Interest", "Other Concerns",
]

FEATURE_COLS = [
    "Age Group", "Housing Type", "Dust Entry Frequency",
    "Worst Pollution Season", "Morning Chest Heaviness",
    "Wheezing Sound", "Eye/Throat Irritation",
    "Open Drains Nearby", "Foul Smell Daily", "Construction Pollution",
]


def load_data() -> pd.DataFrame:
    df = pd.read_excel(DATA_PATH)
    df.columns = COLUMN_NAMES
    return df


def load_model():
    with open(os.path.join(BASE_DIR, "model.pkl"), "rb") as f:
        model = pickle.load(f)
    with open(os.path.join(BASE_DIR, "encoders.pkl"), "rb") as f:
        encoders = pickle.load(f)
    return model, encoders


df = load_data()
model, encoders = load_model()


# ── Endpoints ──

@app.get("/")
def root():
    return {"status": "ok", "message": "Community Health API"}


@app.get("/api/stats")
def get_stats():
    """KPI statistics computed from survey data."""
    total = len(df)
    doctor_yes = int((df["Doctor Visit (Breathing)"] == "Yes").sum())
    healthcare_pct = round(doctor_yes / total * 100, 1)
    top_pollution = df["Construction Pollution"].value_counts().idxmax()
    aqi_not_aware = (df["AQI Awareness"].str.contains("No", case=False, na=False)).sum()
    aqi_aware = round((total - int(aqi_not_aware)) / total * 100, 1)
    wheezing_pct = round((df["Wheezing Sound"] == "Yes").sum() / total * 100, 1)

    return {
        "total_responses": total,
        "healthcare_utilization": healthcare_pct,
        "construction_pollution_belief": top_pollution,
        "aqi_awareness": aqi_aware,
        "wheezing_prevalence": wheezing_pct,
        "doctor_visits_yes": doctor_yes,
    }


@app.get("/api/charts/doctor-visits")
def chart_doctor_visits():
    """Doctor visits by age group."""
    data = (
        df.groupby("Age Group")["Doctor Visit (Breathing)"]
        .apply(lambda x: int((x == "Yes").sum()))
        .reset_index()
    )
    data.columns = ["name", "value"]
    return data.to_dict(orient="records")


@app.get("/api/charts/season")
def chart_season():
    """Worst pollution season distribution."""
    data = df["Worst Pollution Season"].value_counts().reset_index()
    data.columns = ["name", "value"]
    data["value"] = data["value"].astype(int)
    return data.to_dict(orient="records")


@app.get("/api/charts/housing")
def chart_housing():
    """Housing type distribution."""
    data = df["Housing Type"].value_counts().reset_index()
    data.columns = ["name", "value"]
    data["value"] = data["value"].astype(int)
    return data.to_dict(orient="records")


@app.get("/api/charts/symptoms")
def chart_symptoms():
    """Health symptoms breakdown (exploded for multi-select answers)."""
    symptoms = df["Health Symptoms"].dropna().str.split(", ").explode()
    data = symptoms.value_counts().reset_index()
    data.columns = ["name", "value"]
    data["value"] = data["value"].astype(int)
    return data.to_dict(orient="records")


@app.get("/api/charts/dust-entry")
def chart_dust_entry():
    """Dust entry frequency distribution."""
    data = df["Dust Entry Frequency"].value_counts().reset_index()
    data.columns = ["name", "value"]
    data["value"] = data["value"].astype(int)
    return data.to_dict(orient="records")


@app.get("/api/charts/age-distribution")
def chart_age_distribution():
    """Age group distribution."""
    data = df["Age Group"].value_counts().reset_index()
    data.columns = ["name", "value"]
    data["value"] = data["value"].astype(int)
    return data.to_dict(orient="records")


@app.get("/api/charts/gender")
def chart_gender():
    """Gender distribution."""
    data = df["Gender"].value_counts().reset_index()
    data.columns = ["name", "value"]
    data["value"] = data["value"].astype(int)
    return data.to_dict(orient="records")


@app.get("/api/charts/eye-irritation")
def chart_eye_irritation():
    """Eye/throat irritation frequency."""
    data = df["Eye/Throat Irritation"].value_counts().reset_index()
    data.columns = ["name", "value"]
    data["value"] = data["value"].astype(int)
    return data.to_dict(orient="records")


@app.get("/api/charts/chest-heaviness")
def chart_chest_heaviness():
    """Morning chest heaviness distribution."""
    data = df["Morning Chest Heaviness"].value_counts().reset_index()
    data.columns = ["name", "value"]
    data["value"] = data["value"].astype(int)
    return data.to_dict(orient="records")


@app.get("/api/filters")
def get_filters():
    """Unique values for all prediction input fields."""
    filters = {}
    for col in FEATURE_COLS:
        filters[col] = sorted(df[col].dropna().unique().tolist())
    return filters


@app.get("/api/predict")
def predict(
    age_group: str = Query(..., alias="age_group"),
    housing_type: str = Query(..., alias="housing_type"),
    dust_entry: str = Query(..., alias="dust_entry"),
    season: str = Query(..., alias="season"),
    chest_heaviness: str = Query(..., alias="chest_heaviness"),
    wheezing: str = Query(..., alias="wheezing"),
    eye_irritation: str = Query(..., alias="eye_irritation"),
    open_drains: str = Query(..., alias="open_drains"),
    foul_smell: str = Query(..., alias="foul_smell"),
    construction: str = Query(..., alias="construction"),
):
    """Run respiratory risk prediction using trained Random Forest model."""
    user_inputs = {
        "Age Group": age_group,
        "Housing Type": housing_type,
        "Dust Entry Frequency": dust_entry,
        "Worst Pollution Season": season,
        "Morning Chest Heaviness": chest_heaviness,
        "Wheezing Sound": wheezing,
        "Eye/Throat Irritation": eye_irritation,
        "Open Drains Nearby": open_drains,
        "Foul Smell Daily": foul_smell,
        "Construction Pollution": construction,
    }

    encoded_values = []
    for col in FEATURE_COLS:
        le = encoders[col]
        val = user_inputs[col]
        if val in le.classes_:
            encoded_values.append(int(le.transform([val])[0]))
        else:
            encoded_values.append(0)

    X_input = np.array(encoded_values).reshape(1, -1)
    proba = model.predict_proba(X_input)[0]
    risk_pct = round(float(proba[1]) * 100, 1)

    if risk_pct < 35:
        risk_level = "Low Risk"
    elif risk_pct < 55:
        risk_level = "Moderate Risk"
    else:
        risk_level = "High Risk"

    return {
        "probability": risk_pct,
        "risk_level": risk_level,
        "inputs": user_inputs,
    }
