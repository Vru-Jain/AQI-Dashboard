"""
Training script for Respiratory Risk Prediction Model.
Uses Random Forest — produces intuitive, proportional risk scores for small survey data (161 samples).
Manually tuned for robustness: 300 estimators, max_depth=6, min_samples_leaf=3.

Usage: python train_model.py
Output: model.pkl, encoders.pkl
"""

import os
import pickle
import warnings

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import RepeatedStratifiedKFold, cross_val_score
from sklearn.preprocessing import LabelEncoder

warnings.filterwarnings("ignore")

# ── Config ──
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data.xlsx")

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

TARGET_COL = "Disease or Normal"
POSITIVE_CLASS = "It is a Disease"


def main():
    # Load data
    print(f"Loading data from: {DATA_PATH}")
    df = pd.read_excel(DATA_PATH)
    df.columns = COLUMN_NAMES
    print(f"  Rows: {len(df)}, Features: {len(FEATURE_COLS)}")

    # Encode features
    encoders = {}
    X = pd.DataFrame()
    for col in FEATURE_COLS:
        le = LabelEncoder()
        X[col] = le.fit_transform(df[col].fillna("Unknown"))
        encoders[col] = le

    # Binary target: Disease vs Not Disease
    le_target = LabelEncoder()
    y_raw = df[TARGET_COL].apply(lambda x: "Yes" if x == POSITIVE_CLASS else "No")
    y = le_target.fit_transform(y_raw)
    encoders["__target__"] = le_target
    print(f"  Target distribution: {dict(zip(le_target.classes_, np.bincount(y)))}")

    # Random Forest — tuned for small dataset robustness
    model = RandomForestClassifier(
        n_estimators=300,        # Increased from 200 for stability
        max_depth=6,             # Limit depth to prevent overfitting
        min_samples_leaf=3,      # Require 3 samples per leaf
        min_samples_split=5,
        class_weight="balanced", # Handle class imbalance
        random_state=42,
    )

    # Cross-validate
    cv = RepeatedStratifiedKFold(n_splits=5, n_repeats=10, random_state=42)
    acc_scores = cross_val_score(model, X, y, cv=cv, scoring="accuracy")
    f1_scores = cross_val_score(model, X, y, cv=cv, scoring="f1")
    print(f"\n  Cross-Validation Results (5-fold x 10 repeats):")
    print(f"    Accuracy: {acc_scores.mean():.1%} (+/- {acc_scores.std():.1%})")
    print(f"    F1 Score: {f1_scores.mean():.4f} (+/- {f1_scores.std():.4f})")

    # Train final model on full data
    model.fit(X, y)
    print(f"\n  Final model trained on all {len(y)} samples.")

    # Save
    model_path = os.path.join(BASE_DIR, "model.pkl")
    encoders_path = os.path.join(BASE_DIR, "encoders.pkl")

    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    with open(encoders_path, "wb") as f:
        pickle.dump(encoders, f)

    print(f"\n  Saved: {model_path}")
    print(f"  Saved: {encoders_path}")
    print("\nDone!")


if __name__ == "__main__":
    main()
