import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Rectangle } from "recharts"
import './App.css'


interface BarShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: { feature: string; impact: number };
}


function App() {
  const [formData, setFormData] = useState({
    no_of_dependents: 0,
    education: 0,
    self_employed: 0,
    income_annum: 0,
    loan_amount: 0,
    loan_term: 0,
    cibil_score: 0,
    total_assets: 0,
  });

  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [importance, setImportance] = useState<{ feature: string; importance: number }[]>([]);
  const [explanation, setExplanation] = useState<{ feature: string; impact: number }[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/feature-importance")
      .then((res) => res.json())
      .then((data) => setImportance(data))
      .catch(() => setImportance([]));
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: Number(value),
    });
    if (fieldErrors[field]) {
      setFieldErrors({ ...fieldErrors, [field]: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setFieldErrors({});

    try {
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.status === 422) {
        const body = await response.json();
        const errors: Record<string, string> = {};
        body.detail.forEach((d: { loc: string[]; msg: string }) => {
          const field = d.loc[d.loc.length - 1];
          errors[field] = d.msg;
        });
        setFieldErrors(errors);
        return;
      }

      if (!response.ok) {
        throw new Error("Prediction failed.");
      }

      const data = await response.json();
      setResult(data.prediction);
      setExplanation(data.explanation);
    } catch (err) {
      setError("Something went wrong. Is the backend running?");
    }
  };

  return (
    <div className="page">
      <div className="card">
        <header>
          <h1>Loanify</h1>
          <p className="subtitle">Estimate loan eligibility from applicant details.</p>
        </header>

        <form onSubmit={handleSubmit} className="form">
          <div className="grid">
            <div className="field">
              <label htmlFor="no_of_dependents">Number of Dependents</label>
              <input
                id="no_of_dependents"
                type="number"
                className={fieldErrors.no_of_dependents ? "invalid" : ""}
                value={formData.no_of_dependents}
                onChange={(e) => handleChange("no_of_dependents", e.target.value)}
              />
              {fieldErrors.no_of_dependents && (
                <span className="field-error">{fieldErrors.no_of_dependents}</span>
              )}
            </div>

            <div className="field">
              <label htmlFor="education">Education</label>
              <select
                id="education"
                className={fieldErrors.education ? "invalid" : ""}
                value={formData.education}
                onChange={(e) => handleChange("education", e.target.value)}
              >
                <option value={1}>Graduate</option>
                <option value={0}>Not Graduate</option>
              </select>
              {fieldErrors.education && (
                <span className="field-error">{fieldErrors.education}</span>
              )}
            </div>

            <div className="field">
              <label htmlFor="self_employed">Self Employed</label>
              <select
                id="self_employed"
                className={fieldErrors.self_employed ? "invalid" : ""}
                value={formData.self_employed}
                onChange={(e) => handleChange("self_employed", e.target.value)}
              >
                <option value={1}>Yes</option>
                <option value={0}>No</option>
              </select>
              {fieldErrors.self_employed && (
                <span className="field-error">{fieldErrors.self_employed}</span>
              )}
            </div>

            <div className="field">
              <label htmlFor="income_annum">Annual Income</label>
              <input
                id="income_annum"
                type="number"
                className={fieldErrors.income_annum ? "invalid" : ""}
                value={formData.income_annum}
                onChange={(e) => handleChange("income_annum", e.target.value)}
              />
              {fieldErrors.income_annum && (
                <span className="field-error">{fieldErrors.income_annum}</span>
              )}
            </div>

            <div className="field">
              <label htmlFor="loan_amount">Loan Amount</label>
              <input
                id="loan_amount"
                type="number"
                className={fieldErrors.loan_amount ? "invalid" : ""}
                value={formData.loan_amount}
                onChange={(e) => handleChange("loan_amount", e.target.value)}
              />
              {fieldErrors.loan_amount && (
                <span className="field-error">{fieldErrors.loan_amount}</span>
              )}
            </div>

            <div className="field">
              <label htmlFor="loan_term">Loan Term (months)</label>
              <input
                id="loan_term"
                type="number"
                className={fieldErrors.loan_term ? "invalid" : ""}
                value={formData.loan_term}
                onChange={(e) => handleChange("loan_term", e.target.value)}
              />
              {fieldErrors.loan_term && (
                <span className="field-error">{fieldErrors.loan_term}</span>
              )}
            </div>

            <div className="field">
              <label htmlFor="cibil_score">CIBIL Score</label>
              <input
                id="cibil_score"
                type="number"
                className={fieldErrors.cibil_score ? "invalid" : ""}
                value={formData.cibil_score}
                onChange={(e) => handleChange("cibil_score", e.target.value)}
              />
              {fieldErrors.cibil_score && (
                <span className="field-error">{fieldErrors.cibil_score}</span>
              )}
            </div>

            <div className="field">
              <label htmlFor="total_assets">Total Assets</label>
              <input
                id="total_assets"
                type="number"
                className={fieldErrors.total_assets ? "invalid" : ""}
                value={formData.total_assets}
                onChange={(e) => handleChange("total_assets", e.target.value)}
              />
              {fieldErrors.total_assets && (
                <span className="field-error">{fieldErrors.total_assets}</span>
              )}
            </div>
          </div>

          <button type="submit" className="submit-btn">Predict</button>
        </form>

        {result && (
          <div className={`result-banner ${result === "Approved" ? "approved" : "rejected"}`}>
            Prediction: {result}
          </div>
        )}
        {error && <div className="result-banner error">{error}</div>}

        <button
          type="button"
          className="toggle-btn"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? "Hide details" : "Show model details"}
        </button>
        {showDetails && (
          <>
          {explanation.length > 0 && (
            <section className="explanation-section">

  
  

                {explanation.length > 0 && (
          <section className="explanation-section">
            <h2>Why this result?</h2>
            <p className="subtitle">
              How each of your inputs pushed this specific prediction toward
              Approved (green) or Rejected (red).
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={explanation} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" />
                <YAxis type="category" dataKey="feature" width={120} />
                <Tooltip formatter={(v: number) => v.toFixed(4)} />
                  <Bar
                  dataKey="impact"
                  radius={[0, 4, 4, 0]}
                      shape={(props: BarShapeProps) => {
                      const { payload, x, y, width, height } = props;
                      const color = (payload?.impact ?? 0) >= 0 ? "#1F4B3F" : "#B3402F";
                      return <Rectangle x={x} y={y} width={width} height={height} fill={color} />;
                    }}
                />
              </BarChart>
            </ResponsiveContainer>
          </section>
        )}
         </section>
          )}
          <section className="importance-section">
      
        <section className="importance-section">
          <h2>What drives this model's decisions?</h2>
          <p className="subtitle">
            Feature importance from the trained RandomForest. Higher meaning the
            model relies on it more heavily when predicting final approval
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={importance} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
              <YAxis type="category" dataKey="feature" width={120} />
              <Tooltip formatter={(v: number) => `${(v * 100).toFixed(1)}%`} />
              <Bar dataKey="importance" fill="#1F4B3F" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
          </section>
          </>
        )}
      </div>
    </div>
  );
}

export default App;