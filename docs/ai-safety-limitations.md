# CampusOne AI — Safety Constraints, Oversight & Known Limitations

## 1. Safety Principles & Non-Negotiable Constraints

### 1.1 Non-Automated Real-World Action Policy
**CampusOne AI is an advisory decision-support system.**
- It **never** triggers real-world actuators, locks/unlocks access-controlled doors, trips physical building sirens, or contacts municipal emergency services (e.g. 911/police/fire department) autonomously.
- All high-consequence actions must be reviewed, verified, and executed by authorized campus emergency coordinators in accordance with institutional standard operating procedures.

### 1.2 Safety Floor Enforcement
A critical safety hazard report (e.g., active fire, toxic chemical spill, electrical arcing, unconscious casualty, physical violence/ragging) triggers an automated **Safety Floor**:
- The numerical risk score is guaranteed $\ge 85$ (`Critical` priority tier).
- `requires_human_review` is strictly forced to `True`.
- Sparse text or low overall word counts can never suppress a life-safety hazard.

### 1.3 Uncertainty Dynamics
- **Uncertainty Never Suppresses Priority**: A poorly understood or vague report containing critical threat indicators is assigned `UncertaintyLevel.HIGH` and immediately routed for on-scene human investigation.

---

## 2. Evacuation Safety Boundaries

- The evacuation routing engine calculates shortest paths exclusively based on verified campus topology graphs.
- If all exits or corridors are compromised by active hazards, the engine flags `"NO SAFE ROUTE VERIFIED"`, refuses to generate arbitrary paths, and issues immediate shelter-in-place instructions.
- The engine explicitly disclaims that software routing is not an authoritative emergency evacuation broadcast.

---

## 3. Known Limitations

1. **Context & Sarcasm**: Keyword rules and lightweight NLP adapters cannot reliably detect complex double entendres or sarcasm.
2. **Dynamic On-Scene Changes**: The AI engine cannot know real-time physical conditions (e.g., smoke filling a hallway) unless an updated report or sensor hazard update is explicitly provided to `reassess_situation`.
3. **Campus Map Dependencies**: Evacuation routes are only as accurate as the building floorplan graph supplied to `map_data`. The system will not invent rooms or exits.
4. **Model Provider Independence**: When using external LLMs, network timeouts or malformed JSON payloads trigger transparent fallbacks to the deterministic rule-based core, preserving uptime and safety.
