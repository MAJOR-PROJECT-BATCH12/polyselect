# PolySelect
An AI-Based Plastic Identification and Enzyme/Catalyst Recommendation System

Batch-12, CSE, JNTUHUCES. Guide: Dr. B. Sangeetha.

## Pipeline
Image -> Plastic type -> Enzyme ranking -> Degradation conditions -> Evidence

| Module | Folder | Objective |
|---|---|---|
| Plastic identification (OpenCV + CNN) | `ml/plastic_classification` | 1 |
| Enzyme recommendation | `ml/enzyme_recommendation` | 2 |
| Condition prediction | `ml/condition_prediction` | 3 |
| Evidence retrieval (NLP + knowledge DB) | `ml/evidence_retrieval` | 4 |
| Enzyme-condition ranking | `ml/ranking` | 5 |
| REST API | `backend/` | - |
| Web interface (HTML/CSS/JS) | `frontend/` | - |

## Run the frontend
Open `frontend/index.html` with the VS Code Live Server extension.
Results are sample values until the backend is connected.

## Run the backend