"""Configurable rules, keyword registries, and weighting parameters for CampusOne AI."""

from __future__ import annotations

from typing import Dict, List, Set
from ai.schemas import ComplaintCategory, PriorityLevel

# ---------------------------------------------------------------------------
# Category Keyword Dictionaries & Weightings (Canonical Keywords)
# ---------------------------------------------------------------------------

CATEGORY_KEYWORDS: Dict[ComplaintCategory, Dict[str, float]] = {
    ComplaintCategory.IT_AND_NETWORK: {
        "wifi": 3.5, "wi fi": 3.5, "internet": 3.5, "ethernet": 3.0, "lan": 2.5,
        "router": 3.5, "network": 3.0, "bandwidth": 2.5, "firewall": 2.5,
        "server": 2.5, "vpn": 2.5, "portal": 2.0, "lms": 2.5, "moodle": 2.5,
        "canvas": 2.5, "login": 2.0, "password": 2.0, "printer": 2.5,
        "projector": 2.5, "hdmi": 2.0, "desktop": 2.0, "laptop": 2.0,
        "antivirus": 2.0, "dns": 2.5, "ip address": 3.0, "smartboard": 2.5,
        "smart board": 2.5, "audio visual": 2.0, "av setup": 2.5,
        "microphone": 2.0, "software crash": 2.5, "email": 2.0, "outlook": 2.0,
        "teams": 2.0, "slow internet": 3.5, "no connectivity": 3.5, "offline": 2.0,
    },
    ComplaintCategory.MAINTENANCE_AND_ELECTRICAL: {
        "ceiling fan": 3.5, "fan": 2.5, "air conditioner": 3.5, "ac": 2.0, "hvac": 3.0,
        "light": 2.0, "tube light": 3.0, "bulb": 2.0, "flickering": 2.5,
        "switch": 2.0, "switchboard": 3.0, "socket": 2.5, "plug": 2.0,
        "wiring": 2.5, "spark": 3.5, "sparking": 3.5, "short circuit": 4.0,
        "power cut": 3.5, "power failure": 3.5, "blackout": 3.5, "generator": 2.5,
        "ups": 2.0, "fuse": 2.5, "breaker": 2.5, "mcb": 2.5, "pipe": 2.0,
        "leakage": 2.5, "leaking pipe": 3.5, "plumbing": 3.5, "tap": 2.0, "faucet": 2.0,
        "door": 2.0, "window": 2.0, "lock": 2.0, "broken chair": 3.0, "bench": 2.0,
        "desk": 2.0, "furniture": 2.0, "elevator": 3.5, "lift": 3.0, "carpentry": 2.5,
        "civil work": 2.5, "seepage": 2.5, "drainage": 2.5, "water cooler": 2.5,
    },
    ComplaintCategory.HOUSEKEEPING_AND_SANITATION: {
        "cleaning": 3.0, "unclean": 3.0, "dirty": 3.0, "sweeping": 2.5,
        "dust": 2.0, "dusty": 2.0, "mopping": 2.5, "trash": 3.0,
        "garbage": 3.0, "dustbin": 3.0, "waste": 2.0, "overflowing": 2.5,
        "toilet": 3.5, "restroom": 3.5, "washroom": 3.5, "bathroom": 3.5, "urinal": 3.5,
        "stench": 3.0, "foul odor": 3.5, "bad smell": 3.0,
        "soap": 2.0, "handwash": 2.5, "toilet paper": 2.5, "tissue": 2.0,
        "hygiene": 3.0, "sanitation": 3.5, "sanitary": 3.0, "pest": 2.5,
        "cockroach": 3.0, "mosquito": 2.5, "rodent": 3.0, "rat": 2.5,
        "litter": 2.5, "housekeeping": 3.5, "janitor": 3.5,
    },
    ComplaintCategory.TRANSPORT: {
        "college bus": 4.0, "bus": 3.0, "shuttle": 3.5, "van": 2.5, "driver": 2.5,
        "route": 2.5, "bus stop": 3.5, "pickup": 2.5, "transport": 3.5,
        "commute": 2.5, "bus delay": 4.0, "late bus": 4.0, "breakdown": 3.0,
        "flat tyre": 3.5, "flat tire": 3.5, "parking": 2.5, "parking slot": 2.5,
        "bus pass": 3.5, "transport fee": 3.0, "bus schedule": 3.5,
        "overcrowded bus": 3.5, "rash driving": 4.0,
    },
    ComplaintCategory.SECURITY: {
        "security guard": 3.5, "security": 2.5, "watchman": 2.5,
        "main gate": 2.5, "id card": 3.0, "identity card": 3.0,
        "trespassing": 4.0, "intruder": 4.0, "unauthorized": 3.0,
        "theft": 4.0, "stolen": 4.0, "stealing": 3.5, "lost and found": 3.0,
        "cctv": 3.5, "surveillance": 3.0, "harassment": 4.0, "ragging": 4.5,
        "brawl": 4.0, "vandalism": 3.5, "curfew": 2.5, "hostel entry": 2.5,
        "suspicious person": 4.0, "weapon": 4.5, "suspicious package": 4.5,
    },
    ComplaintCategory.ACADEMIC_ADMINISTRATION: {
        "marksheet": 3.5, "transcript": 3.5, "grade card": 3.5, "grade": 2.5,
        "certificate": 3.0, "bonafide": 3.5, "degree": 3.0, "diploma": 2.5,
        "examination": 3.0, "exam": 2.5, "hall ticket": 3.5, "admit card": 3.5,
        "timetable": 3.0, "attendance": 3.5, "curriculum": 2.5, "syllabus": 2.5,
        "registration": 3.0, "enrollment": 3.0, "tuition fee": 3.5, "fee": 2.5,
        "scholarship": 3.5, "faculty": 2.0, "professor": 2.5, "lecturer": 2.0,
        "revaluation": 3.5, "backlog": 3.0, "admission": 3.0,
        "transfer certificate": 3.5,
    },
    ComplaintCategory.LABORATORY: {
        "chemistry lab": 4.0, "physics lab": 4.0, "computer lab": 3.5,
        "bio lab": 4.0, "mechanical lab": 4.0, "cad lab": 3.5,
        "laboratory": 3.5, "lab": 2.5, "apparatus": 3.0,
        "microscope": 3.5, "oscilloscope": 3.5, "bunsen burner": 3.5, "burner": 2.0,
        "chemical": 3.0, "chemicals": 3.0, "reagent": 3.5, "acid": 3.0,
        "pipette": 3.5, "burette": 3.5, "beaker": 3.0, "test tube": 3.0,
        "fume hood": 4.0, "specimen": 3.0, "spectrophotometer": 4.0,
        "multimeter": 3.0, "soldering": 3.0, "autoclave": 3.5,
        "centrifuge": 3.5, "titration": 3.5, "lab manual": 3.0,
    },
    ComplaintCategory.MEDICAL_AND_SAFETY: {
        "dispensary": 3.5, "clinic": 3.5, "first aid": 4.0, "ambulance": 4.5,
        "injury": 4.0, "injured": 4.0, "wound": 3.5, "bleeding": 4.0,
        "fracture": 4.0, "fainted": 4.0, "unconscious": 4.5,
        "chemical burn": 4.5, "acid spill": 4.5, "fire": 4.5,
        "smoke": 4.0, "flames": 4.5, "gas leak": 4.5, "explosion": 4.5,
        "electrocution": 4.5, "electric shock": 4.5, "poisoning": 4.5,
        "food poisoning": 4.0, "asthma": 4.0, "breathing difficulty": 4.5,
        "seizure": 4.5, "allergic reaction": 4.0,
    },
}

# ---------------------------------------------------------------------------
# Safety & Life-Threat Triggers (Conservatively handled - Safety Floor)
# ---------------------------------------------------------------------------

CRITICAL_SAFETY_KEYWORDS: Set[str] = {
    "fire", "smoke", "flames", "explosion", "gas leak", "chemical spill",
    "acid spill", "chemical burn", "electrocution", "electric shock",
    "unconscious", "breathing difficulty", "cardiac", "heart attack", "seizure",
    "severe bleeding", "active brawl", "weapon", "active shooter", "ragging",
    "structural collapse", "ceiling collapse", "poisoning", "ambulance",
    "flooding", "flood", "flash flood", "earthquake", "building collapse",
}

HIGH_SAFETY_KEYWORDS: Set[str] = {
    "sparking", "short circuit", "exposed wire", "live wire", "open wire",
    "fainted", "injury", "injured", "deep cut", "burn", "food poisoning",
    "harassment", "assault", "trespassing", "intruder", "theft", "threat",
    "choking", "fume leak", "hazardous", "contaminated water",
    "elevator stuck", "lift stuck", "trapped in lift", "trapped in elevator",
    "heavy rain floods", "storm damage", "snake", "wildlife incursion",
}

BENIGN_SAFETY_CONTEXTS: List[str] = [
    "fire drill", "mock drill", "fire alarm test", "fire safety awareness",
    "on fire with enthusiasm", "sparked an idea", "smoke test",
]

# ---------------------------------------------------------------------------
# Service Disruption Keywords
# ---------------------------------------------------------------------------

DISRUPTION_KEYWORDS: Dict[str, int] = {
    "campus-wide": 25,
    "entire campus": 25,
    "entire building": 20,
    "block-wide": 20,
    "whole block": 20,
    "all classrooms": 20,
    "during exam": 25,
    "ongoing exam": 25,
    "exam hall": 20,
    "server down": 20,
    "complete blackout": 25,
    "all buses": 20,
    "hostel water supply cut": 20,
    "hundreds of students": 15,
    "outage": 15,
    "calling for assistance": 15,
    "assistance needed": 15,
    "stuck between": 20,
    "trapped": 20,
    "floods": 25,
    "flooding": 25,
    "submerged": 25,
    "blocking vehicles": 20,
    "heavy rain": 20,
}

# ---------------------------------------------------------------------------
# Urgency Modifier Keywords
# ---------------------------------------------------------------------------

URGENCY_MODIFIERS: Dict[str, int] = {
    "emergency": 25,
    "immediate": 20,
    "immediately": 20,
    "urgent": 15,
    "urgently": 15,
    "asap": 15,
    "critical": 15,
    "danger": 20,
    "dangerous": 20,
    "hazard": 15,
    "right now": 10,
    "at once": 10,
    "ongoing": 10,
    "continuous": 5,
}

LOW_URGENCY_MODIFIERS: Dict[str, int] = {
    "suggestion": -15,
    "feedback": -10,
    "minor": -10,
    "whenever possible": -15,
    "no rush": -20,
    "routine": -10,
    "cosmetic": -15,
    "paint touchup": -15,
    "squeaky": -10,
    "slight": -5,
}

# ---------------------------------------------------------------------------
# Location Risk Multipliers
# ---------------------------------------------------------------------------

CRITICAL_LOCATIONS: Dict[str, int] = {
    "chemistry lab": 15,
    "chemical store": 20,
    "server room": 15,
    "data center": 15,
    "substation": 20,
    "transformer": 20,
    "girls hostel": 10,
    "boys hostel": 10,
    "exam hall": 15,
    "examination center": 15,
    "health center": 10,
    "cafeteria": 10,
    "canteen": 10,
    "auditorium": 10,
    "main entrance": 15,
    "entrance gate": 15,
}

CATEGORY_BASE_SCORES: Dict[ComplaintCategory, int] = {
    ComplaintCategory.MEDICAL_AND_SAFETY: 65,
    ComplaintCategory.SECURITY: 55,
    ComplaintCategory.NEEDS_ASSESSMENT: 50,
    ComplaintCategory.OTHER: 40,
    ComplaintCategory.LABORATORY: 45,
    ComplaintCategory.MAINTENANCE_AND_ELECTRICAL: 40,
    ComplaintCategory.IT_AND_NETWORK: 35,
    ComplaintCategory.TRANSPORT: 35,
    ComplaintCategory.ACADEMIC_ADMINISTRATION: 30,
    ComplaintCategory.HOUSEKEEPING_AND_SANITATION: 25,
    ComplaintCategory.GENERAL_UNKNOWN: 20,
}

SCORE_THRESHOLDS = {
    PriorityLevel.CRITICAL: 80,
    PriorityLevel.HIGH: 60,
    PriorityLevel.MEDIUM: 35,
    PriorityLevel.LOW: 0,
}
