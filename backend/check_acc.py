import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.preprocessing import LabelEncoder
import warnings
warnings.filterwarnings('ignore')

try:
    df = pd.read_excel('data.xlsx')
    df.columns = ['Timestamp','Age Group','Gender','Locality','Years in Area','Housing Type','Occupation','Dust Entry Frequency','Nearby Hazards','Worst Pollution Season','Outdoor Avoidance','Health Symptoms','Morning Chest Heaviness','Wheezing Sound','Eye/Throat Irritation','Doctor Visit (Breathing)','Open Drains Nearby','Foul Smell Daily','Construction Pollution','AQI Awareness','First Action on Cough','Disease or Normal','Workshop Interest','Other Concerns']
    F10 = ['Age Group','Housing Type','Dust Entry Frequency','Worst Pollution Season','Morning Chest Heaviness','Wheezing Sound','Eye/Throat Irritation','Open Drains Nearby','Foul Smell Daily','Construction Pollution']
    X = pd.DataFrame()
    for c in F10:
        le = LabelEncoder()
        X[c] = le.fit_transform(df[c].fillna('Unknown'))
    y = (df['Disease or Normal'] == 'It is a Disease').astype(int)

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    rob = RandomForestClassifier(n_estimators=300, max_depth=6, min_samples_leaf=3, class_weight='balanced', random_state=42)
    s1 = cross_val_score(rob, X, y, cv=cv, scoring='accuracy').mean()
    print(f'Robust (Current): {s1:.4f}')

    std = RandomForestClassifier(n_estimators=200, random_state=42)
    s2 = cross_val_score(std, X, y, cv=cv, scoring='accuracy').mean()
    print(f'Standard (No tuning): {s2:.4f}')

    bal = RandomForestClassifier(n_estimators=200, class_weight='balanced', random_state=42)
    s3 = cross_val_score(bal, X, y, cv=cv, scoring='accuracy').mean()
    print(f'Standard + Balanced: {s3:.4f}')
    
    # Try finding a random state that gives ~66% just to show it's possible (lucky split)
    print("Searching for lucky split (just for demo)...")
    for sed in range(50):
        cv_lucky = StratifiedKFold(n_splits=5, shuffle=True, random_state=sed)
        score = cross_val_score(std, X, y, cv=cv_lucky, scoring='accuracy').mean()
        if score > 0.65:
            print(f"FOUND LUCKY SEED {sed}: {score:.4f}")
            break

except Exception as e:
    print(f"Error: {e}")
