# PolySelect
An AI-Based Plastic Identification and Enzyme/Catalyst Recommendation System

Batch-12, CSE, JNTUHUCES. Guide: Dr. B. Sangeetha.

## Pipeline
Image -> Plastic type -> Enzyme ranking -> Degradation conditions -> Evidence

| Module | Folder | Objective |
|---|---|---|
| Plastic identification (OpenCV + CNN) | `ml/plastic_classification` | 1 |
| Enzyme recommendation (PLM + ML) | `ml/enzyme_recommendation` | 2 |
| Condition prediction (RF / XGBoost) | `ml/condition_prediction` | 3 |
| Evidence retrieval (NLP + knowledge DB) | `ml/evidence_retrieval` | 4 |
| Enzyme-condition ranking | `ml/ranking` | 5 |
| REST API | `backend/` | - |
| Web UI | `frontend/` | - |

## Setup (Windows)
```
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn backend.app.main:app --reload
```

## Team workflow
- Never commit directly to `main`. Work on `feature/<module>-<name>` branches and open a pull request.
- Large data and trained models are git-ignored; share them via a shared drive.
