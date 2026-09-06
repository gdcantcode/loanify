from pydantic import BaseModel, Field
from fastapi import FastAPI
import joblib
import pandas as pd
import shap

app = FastAPI()

model = joblib.load("model/loan_model.joblib")
scaler = joblib.load("model/scaler.joblib")

explainer = shap.TreeExplainer(model)

class LoanApplication(BaseModel):
    no_of_dependents: int = Field(ge=0, description="Number of dependents")
    education: int = Field(ge=0, le=1, description="1 = Graduate, 0 = Not Graduate")
    self_employed: int = Field(ge=0, le=1, description="1 = Yes, 0 = No")
    income_annum: int = Field(gt=0)
    loan_amount: int = Field(gt=0)
    loan_term: int = Field(gt=0)
    cibil_score: int = Field(ge=300, le=900)
    total_assets: int = Field(ge=0)

@app.post("/predict")
def predict_loan(application: LoanApplication):
    input_df = pd.DataFrame([{
        "no_of_dependents": application.no_of_dependents,
        "education": application.education,
        "self_employed": application.self_employed,
        "income_annum": application.income_annum,
        "loan_amount": application.loan_amount,
        "loan_term": application.loan_term,
        "cibil_score": application.cibil_score,
        "total_assets": application.total_assets,
    }])

    input_scaled = scaler.transform(input_df)
    prediction = model.predict(input_scaled)
    result = "Approved" if prediction[0] == 1 else "Rejected"

    shap_values = explainer.shap_values(input_scaled)

    if isinstance(shap_values, list):
        values_for_class_1 = shap_values[1][0]
    else:
        values_for_class_1 = shap_values[0, :, 1]

    explanation = [
        {"feature": name, "impact": float(val)}
        for name, val in zip(FEATURE_NAMES, values_for_class_1)
    ]
    explanation.sort(key=lambda x: abs(x["impact"]), reverse=True)

    return {"prediction": result, "explanation": explanation}

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

FEATURE_NAMES = [
    "no_of_dependents", "education", "self_employed", "income_annum",
    "loan_amount", "loan_term", "cibil_score", "total_assets",
]

@app.get("/feature-importance")
def feature_importance():
    importances = model.feature_importances_
    data = [
        {"feature": name, "importance": float(score)}
        for name, score in zip(FEATURE_NAMES, importances)
    ]
    data.sort(key=lambda x: x["importance"], reverse=True)
    return data
