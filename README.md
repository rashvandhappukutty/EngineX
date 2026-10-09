# EngineX — Smart Campus Crisis Coordination Engine

![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-green)
![SQLite](https://img.shields.io/badge/Database-SQLite-lightgrey)
![Status](https://img.shields.io/badge/Status-Prototype-orange)

EngineX is a reliable, modular, real-time crisis coordination and intelligent campus helpdesk backend built for hackathon demonstration.

It addresses **Problem Statement 1 (Smart Campus Crisis Coordination Engine)** and integrates **Problem Statement 14 (Multi-Agent Campus Helpdesk Resolution System)**.

---

## 🌟 Key Features

* **Incident Reporting & History**: Create, track, filter, and transition emergency incidents (`Reported` -> `Investigating` -> `Responding` -> `Resolved`) with complete audit trails.
* **Deterministic Prioritization & AI Integration Contract**: Calculates multi-factor priority scores (0.0 to 150.0). Provides a clean HTTP interface for AI category/severity classification with immediate deterministic fallbacks if AI services are unavailable.
* **Campus Navigation & Evacuation Graph**: Dijkstra shortest-path routing algorithm that dynamically excludes active hazards and blocked locations/edges.
* **Response Team & Mission Assignment**: Coordinate emergency teams (`Available`, `On_Mission`, `Off_Duty`), prevent double assignments, and track response dispatches.
* **Campus Helpdesk (PS 14 Integration)**: Handle ordinary campus service tickets (IT, Facilities, Maintenance, Security, Administration) with automatic department routing and emergency escalation checks.
* **Real-time Notifications**: Single-process WebSocket event broadcasting for immediate UI updates.
* **Dashboard Analytics**: Aggregated crisis metrics, team availability, active assignments, and helpdesk summaries.

---

## 🛠️ Technology Stack

* **Language**: Python 3.10+
* **API Framework**: FastAPI
* **Database**: SQLite
* **ORM**: SQLAlchemy 2.x
* **Validation**: Pydantic 2.x
* **Configuration**: `pydantic-settings`
* **Testing**: `pytest`, `httpx`, FastAPI `TestClient`
* **Real-time**: FastAPI WebSockets

---

## 🚀 Quickstart & Setup (Windows PowerShell)

### 1. Clone & Setup Virtual Environment

```powershell
# Navigate to repository
cd C:\Users\karan\EngineX

# Create Python virtual environment if not present
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Upgrade pip and install dependencies
python -m pip install -r requirements.txt
```

### 2. Environment Configuration

Copy `.env.example` to create your local `.env` configuration:

```powershell
Copy-Item .env.example .env
```

### 3. Run the Backend Server

Start the server using `uvicorn`:

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

* **Interactive API Documentation (Swagger UI)**: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
* **OpenAPI Schema**: [http://localhost:8000/api/v1/openapi.json](http://localhost:8000/api/v1/openapi.json)

---

## 🧪 Running Automated Tests

Run the full isolated test suite using `pytest`:

```powershell
.\.venv\Scripts\python.exe -m pytest -v
```

All 27 automated tests use an isolated, temporary SQLite database (`test_enginex.db`) that is automatically cleaned up after test execution.

---

## 📍 API Endpoint Summary (Prefix: `/api/v1`)

| Category | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Health** | `GET` | `/api/v1/health` | System health & status check |
| **Incidents** | `POST` | `/api/v1/reports` | Report a new campus emergency incident |
| **Incidents** | `GET` | `/api/v1/reports` | List & filter incidents with pagination |
| **Incidents** | `GET` | `/api/v1/reports/{report_id}` | Get incident details |
| **Incidents** | `PATCH`| `/api/v1/reports/{report_id}/status` | Transition incident status with audit log |
| **Incidents** | `GET` | `/api/v1/reports/{report_id}/history` | Get audit trail history for incident |
| **Teams** | `POST` | `/api/v1/teams` | Register a response team |
| **Teams** | `GET` | `/api/v1/teams` | List & filter response teams |
| **Teams** | `PATCH`| `/api/v1/teams/{team_id}/availability` | Update team availability status |
| **Assignments**| `POST` | `/api/v1/assignments` | Assign a response team to an incident |
| **Assignments**| `PATCH`| `/api/v1/assignments/{assignment_id}/status`| Update assignment mission status |
| **Campus** | `POST` | `/api/v1/campus/locations` | Add campus location node |
| **Campus** | `POST` | `/api/v1/campus/hazards` | Report active hazard |
| **Campus** | `GET` | `/api/v1/campus/graph` | Get full campus graph & hazard state |
| **Campus** | `POST` | `/api/v1/campus/seed-demo-data` | Seed prototype campus graph & teams |
| **Routing** | `POST` | `/api/v1/routing/calculate-route` | Compute shortest route excluding hazards |
| **Helpdesk** | `POST` | `/api/v1/helpdesk/requests` | Submit service request (PS 14) |
| **Helpdesk** | `PATCH`| `/api/v1/helpdesk/requests/{id}/assign` | Reassign responsible department |
| **Dashboard** | `GET` | `/api/v1/dashboard/metrics` | Get aggregated dashboard metrics |
| **Real-time** | `WS` | `/api/v1/ws` | WebSocket event notifications |

---

## 🤖 AI Teammate Integration Contract

The backend integrates seamlessly with AI services via `ClassificationService` (`app/services/classification_service.py`).

If an AI service is running at `http://localhost:8001/ai`, the backend can post requests:

```json
POST /ai/classify-incident
{
  "title": "Water Leak near electrical outlet",
  "description": "Pipe dripping directly onto main breaker."
}
```

Expected AI response format:

```json
{
  "category": "Infrastructure",
  "severity": "High",
  "confidence": 0.92
}
```

If the AI service is disabled or unreachable, the system automatically uses a deterministic keyword classifier so the backend **never breaks or fails**.

---

## ⚠️ Prototype Limitations & Safety Notice

1. **Safety Disclaimer**: Computed evacuation routes and priority scores rely strictly on recorded database graph data and logged hazards. They are prototype recommendations requiring physical verification.
2. **In-Memory WebSockets**: The WebSocket manager handles real-time broadcasting for single-process prototype servers.
3. **Database Auto-Migration**: Tables are created automatically on application startup using SQLAlchemy `create_all()`. For production scaling, Alembic migrations should be integrated.

---

## 🌿 Git Collaboration Guidelines

* **Branch**: `feature/backend`
* Do not delete user changes or overwrite unrelated team work.
* Do not commit `.env`, `.venv`, or `.db` files.
