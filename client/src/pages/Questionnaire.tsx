import { useState } from "react";
import { useLocation } from "wouter";

export default function Questionnaire() {
  const [yesorno, setYesorno] = useState("");
  const [diagnosis, setDiagnosis] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();
  const [symptoms, setSymptoms] = useState({
    hallucinations: 5,
    anxiety: 5,
    delusions: 5,
    suspiciousness: 5,
    anger: 5,
  });
  const [sleepqual, setSleep] = useState({
    sleep: 5,
  });

  // Options for questions
  const yesnoOptions = ["yes", "no"];
  const diagnosisOptions = [
    "Bipolar Disorder",
    "Depression",
    "Anxiety",
    "Schizophrenia",
  ];

  // Update diagnosis selection
  const handleFeatureChange = (option: string) => {
    setDiagnosis((prev) =>
      prev.includes(option)
        ? prev.filter((f) => f !== option)
        : [...prev, option]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yesorno) {
      setError("Please select yes or no.");
      return;
    }
    // Build CSV string
    const csvData =
      `YesorNo,${yesorno}\n` +
      `Diagnosis,${diagnosis.join(";")}\n` +
      `Sleep Quality,${sleepqual.sleep}\n` +
      `Hallucinations,${symptoms.hallucinations}\n` +
      `Anxiety,${symptoms.anxiety}\n` +
      `Delusions,${symptoms.delusions}\n` +
      `Suspiciousness,${symptoms.suspiciousness}\n` +
      `Anger,${symptoms.anger}\n`;

    // Retrieve the token (prolific ID is determined on the backend via JWT)
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://localhost:3000/api/upload-questionnaire", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          responses: csvData,
          // File name will be generated on the backend
        }),
      });
      if (response.ok) {
        setLocation("/");
      } else {
        setError("Failed to submit questionnaire.");
      }
    } catch (err) {
      setError("Error submitting questionnaire.");
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Questionnaire</h2>
      <h3>General</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginTop: "20px" }}>
          <label>
            Have you ever been clinically diagnosed with any of the following? (Select all that apply)
          </label>
          <div>
            {diagnosisOptions.map((option) => (
              <label key={option} style={{ marginRight: "10px" }}>
                <input
                  type="checkbox"
                  value={option}
                  checked={diagnosis.includes(option)}
                  onChange={() => handleFeatureChange(option)}
                />
                {option}
              </label>
            ))}
          </div>
        </div>
        <br />
        <div>
          <label>Have you changed medications in the past week?</label>
          <div>
            {yesnoOptions.map((option) => (
              <label key={option} style={{ marginRight: "10px" }}>
                <input
                  type="radio"
                  name="yesorno"
                  value={option}
                  checked={yesorno === option}
                  onChange={(e) => setYesorno(e.target.value)}
                />
                {option}
              </label>
            ))}
          </div>
        </div>
        <br />
        <div>
          <label>Please rate your quality of sleep this week?</label>
          <div>
            <input
              type="range"
              min="0"
              max="10"
              value={sleepqual.sleep}
              onChange={(e) =>
                setSleep({ ...sleepqual, sleep: Number(e.target.value) })
              }
            />
            <span>{sleepqual.sleep}</span>
          </div>
        </div>
        <div style={{ marginTop: "20px" }}>
          <h3>Weekly Symptoms</h3>
          <p>
            The following questions are meant to gauge your weekly symptoms. On a scale of 0-10, please rank the frequency of the below experiences during the past week.
          </p>
          <div>
            <label>
              Hallucinations (0-10):
              <input
                type="range"
                min="0"
                max="10"
                value={symptoms.hallucinations}
                onChange={(e) =>
                  setSymptoms({ ...symptoms, hallucinations: Number(e.target.value) })
                }
              />
              <span>{symptoms.hallucinations}</span>
            </label>
          </div>
          <div>
            <label>
              Anxiety (0-10):
              <input
                type="range"
                min="0"
                max="10"
                value={symptoms.anxiety}
                onChange={(e) =>
                  setSymptoms({ ...symptoms, anxiety: Number(e.target.value) })
                }
              />
              <span>{symptoms.anxiety}</span>
            </label>
          </div>
          <div>
            <label>
              Delusions (0-10):
              <input
                type="range"
                min="0"
                max="10"
                value={symptoms.delusions}
                onChange={(e) =>
                  setSymptoms({ ...symptoms, delusions: Number(e.target.value) })
                }
              />
              <span>{symptoms.delusions}</span>
            </label>
          </div>
          <div>
            <label>
              Suspiciousness (0-10):
              <input
                type="range"
                min="0"
                max="10"
                value={symptoms.suspiciousness}
                onChange={(e) =>
                  setSymptoms({ ...symptoms, suspiciousness: Number(e.target.value) })
                }
              />
              <span>{symptoms.suspiciousness}</span>
            </label>
          </div>
          <div>
            <label>
              Anger (0-10):
              <input
                type="range"
                min="0"
                max="10"
                value={symptoms.anger}
                onChange={(e) =>
                  setSymptoms({ ...symptoms, anger: Number(e.target.value) })
                }
              />
              <span>{symptoms.anger}</span>
            </label>
          </div>
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" style={{ marginTop: "20px" }}>
          Submit Questionnaire
        </button>
      </form>
    </div>
  );
}