# Codebase Explanation for Beginners

This document explains your entire project as if you are new to coding. We'll break down the structure, what each file does, and how they talk to each other.

---

## 🏗️ The Big Picture

Your application is like a **Restaurant**:

1.  **The Frontend (The Dining Area)**: This is what customers (users) see. They look at the menu (Dashboard), place orders (Predictions), and see the food (Charts/Stats).
    *   *Files live in:* `frontend/`
2.  **The Backend (The Kitchen)**: This is where the work happens. It cooks the food (processes data), follows recipes (Machine Learning Model), and hands it to the waiters.
    *   *Files live in:* `backend/`
3.  **The API (The Waiter)**: This connects the two. The Frontend asks for "Doctor Visit Stats," and the API runs to the Kitchen, gets it, and brings it back.

---

## 🧠 The Backend (The Kitchen)

This is the "Brain" of your application. It uses Python, which is great for data science.

### 1. `backend/main.py` (The Head Chef)
This file runs the server. It listens for requests from the frontend and decides what to do.

*   **Lines 1-14 (Setup)**: Imports tools like `FastAPI` (a fast web server framework) and `pandas` (for Excel data).
*   **Lines 16-24 (The Door)**: Sets up `CORSMiddleware`. This acts like a bouncer, allowing your Frontend (website) to talk to this Backend.
*   **Lines 32-51 (The Pantry)**: Loads your data (`data.xlsx`). It checks different locations (local file vs. cloud secrets) to find the ingredients.
*   **Lines 77-82 (The Recipe Book)**: `load_model()` loads the saved Machine Learning model (`model.pkl`). This is the "brain" that knows how to predict health risks.
*   **Lines 94-169 (Prep Work)**: `compute_dashboard_stats()` does all the heavy lifting *once* when the server starts. It calculates all the charts and percentages so they are ready instantly when a user asks.
    *   *Analogy*: Chopping all vegetables before the dinner rush so service is fast.
*   **Lines 182-187 (The Main Dish)**: `@app.get("/api/dashboard")`. When the frontend asks for the dashboard, this function just hands over the pre-calculated data.
*   **Lines 261-313 (The Special Order)**: `@app.get("/api/predict")`. This handles the Risk Prediction.
    *   It takes the user's specific inputs (Age, Housing, etc.).
    *   It converts them into numbers (encoding).
    *   It asks the AI model: "What is the risk for this person?"
    *   It applies our **Custom Thresholds** (<20% Low, >35% High) and sends the result back.

### 2. `backend/train_model.py` (The Cooking School)
This script doesn't run on the website. You run it *once* on your computer to "teach" the AI model.

*   **Lines 47-52 (Reading Textbooks)**: Loads the data (`data.xlsx`).
*   **Lines 57-60 (Translation)**: Computers don't understand text like "Chawl" or "Summer". It uses `LabelEncoder` to turn them into numbers (e.g., Chawl = 1, Apartment = 2).
*   **Lines 71-78 (Creating the Student)**: Initializes a `RandomForestClassifier`. Imagine a forest of 200 decision trees that all vote on the answer.
*   **Lines 80-100 (The Lesson Plan)**: **Random Oversampling**.
    *   *Problem*: There were too few "Disease" cases, so the model was lazy and guessed "Normal" too often.
    *   *Fix*: We deliberately duplicate the "Disease" cases so the model sees them more often and learns to recognize them better.
*   **Lines 102-103 (Final Exam)**: `.fit(X, y)` trains the model. The model is now ready.
*   **Lines 107-113 (Graduation)**: Saves the trained model to `model.pkl` so `main.py` can use it later.

---

## 🎨 The Frontend (The Dining Area)

This is the "Face" of your application. It uses **Next.js** (React), which builds modern, fast websites.

### 3. `frontend/lib/api.ts` (The Phone Line)
This file defines how the Frontend calls the Backend.

*   **Lines 3-25 (The Menu)**: Defines "Types" (Interfaces). It tells code exactly what `Stats`, `ChartItem`, and `PredictionResult` look like, so we don't make mistakes.
*   **Lines 27-31 (The Call)**: `fetchJson` is a helper that sends a message to the backend and waits for the answer.
*   **Lines 33-50 (The Speed Dial)**: The `api` object holds all our shortcuts.
    *   `getDashboardData()`: Calls `/api/dashboard`.
    *   `predict()`: Calls `/api/predict`.

### 4. `frontend/app/page.tsx` (The Dining Room)
This is the main page your users see.

*   **Lines 58-74 (Memory)**: `useState` hooks are like the waiter's notepad. They hold the current state of the page:
    *   `stats`: The numbers at the top.
    *   `doctorVisits`: Data for the bar chart.
    *   `loading`: A true/false flag. "Are we still waiting for food?"
*   **Lines 76-105 (The Order)**: `useEffect` runs once when the page loads.
    *   It calls `api.getDashboardData()`.
    *   When data arrives, it fills all the state variables (`setStats`, `setDoctorVisits`, etc.).
    *   This makes the charts pop up.
*   **Lines 107-118 (Prediction Button)**: `handlePredict`. When the user clicks "Run Risk Prediction":
    *   It gathers their inputs.
    *   It calls the API.
    *   It shows the Red/Yellow/Green risk card.
*   **Lines 135-end (The Decor)**: This is the **JSX** (HTML mixed with JavaScript). It describes how things *look*.
    *   `<Card>`: The white boxes.
    *   `<BarChart>` / `<PieChart>`: The visualizations.
    *   `<Tabs>`: The switcher between "Analytics" and "Prediction Tool".

### 5. `frontend/app/layout.tsx` (The Building Structure)
This file wraps every page on your site.

*   **Lines 1-5 (Foundations)**: Imports global styles (`globals.css`) and fonts (Geist).
*   **Line 16 (Signage)**: `metadata` sets the tab title and description for Google.
*   **Line 31 (The Walls)**: `<html>` and `<body>` tags.
*   **Line 43 (Security Camera)**: `<Analytics />`. This is the **Vercel Analytics** tracker we just added. It silently counts visitors without affecting the page look.

---

## 🚀 How It Flows

1.  **User** opens the website.
2.  **`page.tsx`** loads and sees `loading = true`. It shows skeletons (gray loading bars).
3.  **`page.tsx`** calls `api.getDashboardData()`.
4.  **`main.py`** gets the call. It checks its cache (`DASHBOARD_DATA`). It's already there! It sends it back instantly.
5.  **`page.tsx`** receives data. It sets `loading = false` and fills in the Charts and Stats.
6.  **User** clicks "Prediction Tool", selects options, and hits "Run".
7.  **`page.tsx`** calls `api.predict()`.
8.  **`main.py`** runs the inputs through the `model.pkl`. It sees a high probability (e.g., 42%).
9.  **`main.py`** checks logic: `42% > 35%`, so it says "High Risk".
10. **`page.tsx`** gets "High Risk" and shows the **Red Card**.

I hope this helps map out your digital empire! 🏛️
