import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import {
  type AIAnalysisResult,
  analyzeSituationWithAI,
} from "../services/api";

export type Severity = "critical" | "high" | "medium" | "low";
export type IncidentStatus =
  | "reported"
  | "assigned"
  | "acknowledged"
  | "in_progress"
  | "resolved"
  | "closed";

export interface TimelineEvent {
  id: string;
  time: string;
  message: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  incidentId?: string;
}

export interface Incident {
  id: string;
  title: string;
  type: string;
  category?: string;
  buildingId?: string;
  location?: string;
  locationDetails: string;
  description: string;
  severity: Severity;
  status: IncidentStatus;
  reportedTime: string;
  reportedAt?: string;
  lastUpdate: string;
  reporterName: string;
  reporterContact?: string;
  peopleAffected?: number;
  occupancy?: number;
  verificationStatus?: string;
  assignedTeamId?: string;
  notes: string[];
  timeline: TimelineEvent[];
  aiAnalysis?: AIAnalysisResult;
}

export interface Building {
  id: string;
  name: string;
  code?: string;
  floors?: number;
  status: "safe" | "evacuating" | "locked_down";
  occupancy: number;
  currentOccupancy?: number;
  capacity: number;
  maxCapacity?: number;
  evacuationTime?: string;
  type: string;
  coordinates: { x: number; y: number };
  width: number;
  height: number;
  lat?: number;
  lng?: number;
}

export type DispatchStatus =
  | "available"
  | "assigned"
  | "dispatched"
  | "acknowledged"
  | "on_scene"
  | "completed"
  | "unavailable";

export interface Responder {
  id: string;
  name: string;
  specialization: string;
  skills: string[];
  status: DispatchStatus;
  currentIncidentId?: string;
  incidentId?: string;
  callsign?: string;
  location?: string;
  phone?: string;
  baseLocation: string;
  contactNumber: string;
  lastUpdate: string;
}

export interface Resource {
  id: string;
  name: string;
  type: string;
  totalQuantity: number;
  availableQuantity: number;
  assignedQuantity: number;
  maintenanceQuantity: number;
  location: string;
  condition: "good" | "fair" | "poor";
}

export interface EvacuationRoute {
  id: string;
  origin: string;
  destination: string;
  status: "safe" | "restricted" | "unverified";
}

export interface Alert {
  id: string;
  title: string;
  message?: string;
  severity: Severity;
  time: string;
  timestamp?: string;
  read: boolean;
  incidentId?: string;
  source: string;
}

export interface AssemblyPoint {
  id: string;
  name: string;
  capacity?: number;
  coordinates: { x: number; y: number };
  lat?: number;
  lng?: number;
}

export interface CampusEdge {
  id: string;
  source: string;
  target: string;
  distance: number;
  accessible: boolean;
  blocked: boolean;
}

export interface User {
  id: string;
  name: string;
  role: "administrator" | "coordinator" | "security" | "responder" | "reporter";
}

export interface DemoState {
  currentUser: User | null;
  selectedIncidentId: string | null;
  setSelectedIncidentId: (id: string | null) => void;
  incidents: Incident[];
  buildings: Building[];
  responders: Responder[];
  resources: Resource[];
  routes: EvacuationRoute[];
  alerts: Alert[];
  auditLogs: AuditLog[];
  assemblyPoints: AssemblyPoint[];
  campusEdges: CampusEdge[];
  setCurrentUser: (user: User | null) => void;
  addIncident: (
    incident: Omit<
      Incident,
      "id" | "reportedTime" | "lastUpdate" | "timeline" | "notes" | "aiAnalysis"
    >,
  ) => Promise<Incident>;
  updateIncident: (id: string, updates: Partial<Incident>) => void;
  updateResponder: (id: string, updates: Partial<Responder>) => void;
  updateResource: (id: string, updates: Partial<Resource>) => void;
  addNote: (id: string, note: string) => void;
  addAuditLog: (log: Omit<AuditLog, "id" | "timestamp">) => void;
  toggleEdgeBlock: (edgeId: string) => void;
  markAlertRead: (id: string) => void;
  markAllAlertsRead: () => void;
  refreshAIAnalysis: (incidentId: string) => Promise<AIAnalysisResult | null>;
  logout: () => void;
  resetDemoData: () => void;
}

const defaultUser: User | null = null;

// Standard non-overlapping 920x560 campus spatial coordinates
export const CAMPUS_NODE_LAYOUT: Record<
  string,
  { x: number; y: number; width: number; height: number; cx: number; cy: number; label: string }
> = {
  // Column 1 (West Campus)
  B9:  { x: 40,  y: 40,  width: 180, height: 85, cx: 130, cy: 82.5,  label: "Sports Complex" },
  AP1: { x: 40,  y: 160, width: 180, height: 65, cx: 130, cy: 192.5, label: "AP-1 West Ground" },
  B3:  { x: 40,  y: 260, width: 180, height: 85, cx: 130, cy: 302.5, label: "Science Laboratory" },
  B8:  { x: 40,  y: 385, width: 180, height: 85, cx: 130, cy: 427.5, label: "Auditorium" },

  // Column 2 (Academic Core)
  AP3: { x: 260, y: 40,  width: 180, height: 65, cx: 350, cy: 72.5,  label: "AP-3 North Plaza" },
  B2:  { x: 260, y: 160, width: 180, height: 85, cx: 350, cy: 202.5, label: "Engineering Block" },
  B4:  { x: 260, y: 285, width: 180, height: 85, cx: 350, cy: 327.5, label: "Central Library" },

  // Column 3 (Administration & Hub)
  B5:  { x: 480, y: 40,  width: 180, height: 85, cx: 570, cy: 82.5,  label: "Hostel A (Men's)" },
  B1:  { x: 480, y: 160, width: 180, height: 85, cx: 570, cy: 202.5, label: "Main Block" },
  B10: { x: 480, y: 385, width: 180, height: 80, cx: 570, cy: 425.0, label: "Main Security Gate" },

  // Column 4 (East Campus & Dining)
  B6:  { x: 700, y: 40,  width: 180, height: 85, cx: 790, cy: 82.5,  label: "Hostel B (Women's)" },
  B7:  { x: 700, y: 160, width: 180, height: 85, cx: 790, cy: 202.5, label: "Student Cafeteria" },
  AP2: { x: 700, y: 285, width: 180, height: 65, cx: 790, cy: 317.5, label: "AP-2 East Quad" },
};

const defaultBuildings: Building[] = [
  {
    id: "B1",
    name: "Main Block",
    code: "ADM-100",
    floors: 4,
    status: "safe",
    occupancy: 350,
    currentOccupancy: 350,
    capacity: 500,
    maxCapacity: 500,
    evacuationTime: "4.2 min",
    type: "Admin",
    coordinates: { x: 480, y: 160 },
    width: 180,
    height: 85,
    lat: 11.1085,
    lng: 77.3411,
  },
  {
    id: "B2",
    name: "Engineering Block",
    code: "ENG-200",
    floors: 4,
    status: "safe",
    occupancy: 420,
    currentOccupancy: 420,
    capacity: 600,
    maxCapacity: 600,
    evacuationTime: "5.1 min",
    type: "Academic",
    coordinates: { x: 260, y: 160 },
    width: 180,
    height: 85,
    lat: 11.1092,
    lng: 77.3402,
  },
  {
    id: "B3",
    name: "Science Laboratory",
    code: "SCI-300",
    floors: 3,
    status: "evacuating",
    occupancy: 120,
    currentOccupancy: 120,
    capacity: 200,
    maxCapacity: 200,
    evacuationTime: "2.8 min",
    type: "Laboratory",
    coordinates: { x: 40, y: 260 },
    width: 180,
    height: 85,
    lat: 11.1098,
    lng: 77.3395,
  },
  {
    id: "B4",
    name: "Central Library",
    code: "LIB-400",
    floors: 2,
    status: "safe",
    occupancy: 210,
    currentOccupancy: 210,
    capacity: 300,
    maxCapacity: 300,
    evacuationTime: "3.4 min",
    type: "Academic",
    coordinates: { x: 260, y: 285 },
    width: 180,
    height: 85,
    lat: 11.1080,
    lng: 77.3400,
  },
  {
    id: "B5",
    name: "Hostel A (Men's)",
    code: "HST-A",
    floors: 4,
    status: "safe",
    occupancy: 380,
    currentOccupancy: 380,
    capacity: 400,
    maxCapacity: 400,
    evacuationTime: "6.0 min",
    type: "Residential",
    coordinates: { x: 480, y: 40 },
    width: 180,
    height: 85,
    lat: 11.1100,
    lng: 77.3425,
  },
  {
    id: "B6",
    name: "Hostel B (Women's)",
    code: "HST-B",
    floors: 4,
    status: "safe",
    occupancy: 350,
    currentOccupancy: 350,
    capacity: 400,
    maxCapacity: 400,
    evacuationTime: "5.8 min",
    type: "Residential",
    coordinates: { x: 700, y: 40 },
    width: 180,
    height: 85,
    lat: 11.1105,
    lng: 77.3432,
  },
  {
    id: "B7",
    name: "Student Cafeteria",
    code: "CAF-700",
    floors: 2,
    status: "safe",
    occupancy: 180,
    currentOccupancy: 180,
    capacity: 250,
    maxCapacity: 250,
    evacuationTime: "2.5 min",
    type: "Facility",
    coordinates: { x: 700, y: 160 },
    width: 180,
    height: 85,
    lat: 11.1075,
    lng: 77.3420,
  },
  {
    id: "B8",
    name: "Auditorium",
    code: "AUD-800",
    floors: 2,
    status: "safe",
    occupancy: 50,
    currentOccupancy: 50,
    capacity: 800,
    maxCapacity: 800,
    evacuationTime: "4.5 min",
    type: "Facility",
    coordinates: { x: 40, y: 385 },
    width: 180,
    height: 85,
    lat: 11.1070,
    lng: 77.3390,
  },
  {
    id: "B9",
    name: "Sports Complex",
    code: "SPT-900",
    floors: 2,
    status: "safe",
    occupancy: 85,
    currentOccupancy: 85,
    capacity: 300,
    maxCapacity: 300,
    evacuationTime: "3.0 min",
    type: "Facility",
    coordinates: { x: 40, y: 40 },
    width: 180,
    height: 85,
    lat: 11.1110,
    lng: 77.3385,
  },
  {
    id: "B10",
    name: "Main Security Gate",
    code: "SEC-01",
    floors: 1,
    status: "safe",
    occupancy: 5,
    currentOccupancy: 5,
    capacity: 20,
    maxCapacity: 20,
    evacuationTime: "0.5 min",
    type: "Security",
    coordinates: { x: 480, y: 385 },
    width: 180,
    height: 80,
    lat: 11.1060,
    lng: 77.3410,
  },
];

const defaultState: DemoState = {
  currentUser: defaultUser,
  incidents: [
    {
      id: "INC-20261009-001",
      title: "Smoke Report in Lab 3",
      type: "Fire",
      buildingId: "B3", // Science Laboratory
      locationDetails: "Floor 2, Lab 3",
      description:
        "Thick black smoke seen coming from under the door of Lab 3. Alarm has triggered.",
      severity: "critical",
      status: "reported",
      reportedTime: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      lastUpdate: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      reporterName: "Dr. Smith",
      reporterContact: "555-0100",
      peopleAffected: 5,
      notes: [],
      timeline: [
        {
          id: "T1",
          time: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          message: "Incident reported by Dr. Smith",
        },
        {
          id: "T1-AI",
          time: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
          message:
            "[CampusOne AI] Threat Assessed: Critical (Risk Score: 88/100). Safety floor enforced for active smoke/fire hazard.",
        },
      ],
      aiAnalysis: {
        incident_id: "INC-20261009-001",
        categories: ["Fire", "Life Safety Hazard", "Infrastructure"],
        summary:
          "Active smoke emission detected from Science Laboratory Floor 2 Lab 3 with fire alarm activation.",
        affected_location: "Science Laboratory - Floor 2, Lab 3",
        risk_assessment: {
          priority: "Critical",
          risk_score: 88,
          priority_score: 88,
          risk_factors: [
            "Critical safety hazard detected: 'smoke'",
            "Critical safety hazard detected: 'alarm'",
            "Safety floor enforced: Guaranteed >= 88 for life-safety hazard",
          ],
          reasoning_summary:
            "Priority evaluated as Critical (Risk Score: 88/100, Uncertainty: Low). Immediate smoke threat with alarm activation in chemical lab environment.",
          uncertainty_level: "Low",
          requires_human_review: true,
          missing_information: [
            "Hazardous chemical inventory in Lab 3",
            "Exact count of remaining building occupants",
          ],
          is_safety_critical: true,
          potential_harm_level: "Severe / Life Threatening",
          immediacy_of_danger: "Immediate",
        },
        recommended_department: "Campus Fire & Emergency Services",
        recommended_actions: [
          {
            action: "Dispatch Fire Response Alpha",
            priority: "Immediate",
            description: "Deploy SCBA-equipped firefighters to Floor 2 of Science Laboratory.",
            role_responsible: "Emergency Coordinator",
          },
          {
            action: "Trigger Science Lab Evacuation",
            priority: "Immediate",
            description: "Direct occupants toward Assembly Point North via unobstructed stairwells.",
            role_responsible: "Security / Floor Wardens",
          },
          {
            action: "Isolate Lab Ventilation",
            priority: "High",
            description: "Request facilities shut down HVAC zone to prevent smoke propagation.",
            role_responsible: "Facilities",
          },
        ],
        resource_recommendations: [
          {
            team_name: "Fire Response Alpha",
            specialization: "Fire & Hazmat",
            match_score: 95,
            rationale: "Highest capability match for structural smoke and potential chemical fire.",
            recommended_equipment: ["SCBA Gear", "CO2 Extinguishers", "Thermal Camera"],
          },
          {
            team_name: "Campus Security Alpha",
            specialization: "Security",
            match_score: 85,
            rationale: "Establish 100-meter safety cordon and clear evacuation corridor.",
          },
        ],
        related_incidents: [],
        evacuation_recommendation: {
          status: "evacuation_recommended",
          route: ["Science Lab Exit North", "Perimeter Path", "North Assembly Lawn"],
          safe_zone: "North Assembly Lawn",
          accessibility_verified: true,
          hazards_avoided: ["Science Lab 2nd Floor Central Hallway"],
        },
        uncertainty: {
          level: "Low",
          nlu_confidence: 0.95,
          classification_confidence: 0.98,
          missing_information: ["Chemical storage status"],
          conflicting_elements: [],
          is_unfamiliar: false,
          model_provider: "gemini",
        },
        requires_human_review: true,
        explanation:
          "CampusOne AI evaluated structural smoke and active alarms. Safety floor guarantees Critical priority.",
      },
    },
    {
      id: "INC-20261009-002",
      title: "Medical Emergency at Cafe",
      type: "Medical Emergency",
      buildingId: "B7", // Cafeteria
      locationDetails: "Main floor, near the entrance",
      description: "Student collapsed and is unresponsive.",
      severity: "critical",
      status: "in_progress",
      reportedTime: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      lastUpdate: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      reporterName: "Jane Doe",
      assignedTeamId: "T2",
      notes: ["First aid dispatched."],
      timeline: [
        {
          id: "T2",
          time: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          message: "Incident reported.",
        },
        {
          id: "T3",
          time: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
          message: "Medical Team Alpha assigned.",
        },
      ],
      aiAnalysis: {
        incident_id: "INC-20261009-002",
        categories: ["Medical Emergency", "Life Safety Hazard"],
        summary: "Unresponsive student collapse reported at Cafeteria entrance.",
        affected_location: "Cafeteria - Main Floor",
        risk_assessment: {
          priority: "Critical",
          risk_score: 92,
          priority_score: 92,
          risk_factors: [
            "Critical hazard: 'unresponsive'",
            "Critical hazard: 'collapsed'",
            "Immediate life-support required",
          ],
          reasoning_summary:
            "Priority evaluated as Critical (Risk Score: 92/100). Severe medical emergency requiring immediate CPR/AED intervention.",
          uncertainty_level: "Low",
          requires_human_review: true,
          missing_information: ["Student vitals/pulse status", "AED deployment status"],
          is_safety_critical: true,
          potential_harm_level: "Severe / Life Threatening",
          immediacy_of_danger: "Immediate",
        },
        recommended_department: "Campus Health & Paramedic Dispatch",
        recommended_actions: [
          {
            action: "Deploy AED & First Responder",
            priority: "Immediate",
            description: "Retrieve AED from Cafeteria lobby and begin emergency first response.",
            role_responsible: "First Aid Team",
          },
          {
            action: "Call City Paramedic Unit",
            priority: "Immediate",
            description: "Coordinate with 911 for priority ambulance transfer.",
            role_responsible: "Emergency Coordinator",
          },
        ],
        resource_recommendations: [
          {
            team_name: "Medical Team Alpha",
            specialization: "Medical Emergency",
            match_score: 98,
            rationale: "Certified EMT and paramedic staff on standby.",
            recommended_equipment: ["AED Unit", "Trauma Kit", "Oxygen Tank"],
          },
        ],
        related_incidents: [],
        evacuation_recommendation: {
          status: "clear_ingress_route",
          route: ["Main Gate", "Campus Drive", "Cafeteria South Bay"],
          safe_zone: "Cafeteria Medical Staging",
          accessibility_verified: true,
        },
        uncertainty: {
          level: "Low",
          nlu_confidence: 0.98,
          classification_confidence: 0.99,
          missing_information: [],
          conflicting_elements: [],
          is_unfamiliar: false,
          model_provider: "gemini",
        },
        requires_human_review: true,
        explanation: "Critical medical distress detected. Rapid paramedic dispatch recommended.",
      },
    },
  ],
  buildings: defaultBuildings,
  responders: [
    {
      id: "T1",
      name: "Campus Security Alpha",
      specialization: "Security",
      skills: ["Crowd Control", "First Aid", "De-escalation"],
      status: "available",
      baseLocation: "Main Gate",
      contactNumber: "555-1001",
      lastUpdate: new Date().toISOString(),
    },
    {
      id: "T2",
      name: "Medical Response Team",
      specialization: "Medical Emergency",
      skills: ["Paramedic", "Trauma Care", "BLS"],
      status: "on_scene",
      currentIncidentId: "INC-20261009-002",
      baseLocation: "Health Center",
      contactNumber: "555-1002",
      lastUpdate: new Date().toISOString(),
    },
    {
      id: "T3",
      name: "Fire and Safety Team",
      specialization: "Fire",
      skills: ["Firefighting", "Hazmat", "Evacuation"],
      status: "available",
      baseLocation: "Facilities Hub",
      contactNumber: "555-1003",
      lastUpdate: new Date().toISOString(),
    },
    {
      id: "T4",
      name: "Electrical Maintenance",
      specialization: "Infrastructure",
      skills: ["High Voltage", "Power Restoration", "Lockout/Tagout"],
      status: "available",
      baseLocation: "Engineering Block",
      contactNumber: "555-1004",
      lastUpdate: new Date().toISOString(),
    },
    {
      id: "T5",
      name: "Disaster Support Team",
      specialization: "General",
      skills: ["Search & Rescue", "Logistics", "Communications"],
      status: "unavailable",
      baseLocation: "Student Union",
      contactNumber: "555-1005",
      lastUpdate: new Date().toISOString(),
    },
  ],
  resources: [
    {
      id: "R1",
      name: "Standard First Aid Kit",
      type: "Medical Supplies",
      totalQuantity: 50,
      availableQuantity: 42,
      assignedQuantity: 5,
      maintenanceQuantity: 3,
      location: "Storage A",
      condition: "good",
    },
    {
      id: "R2",
      name: "CO2 Fire Extinguisher",
      type: "Fire Extinguishers",
      totalQuantity: 100,
      availableQuantity: 98,
      assignedQuantity: 0,
      maintenanceQuantity: 2,
      location: "Science Laboratory",
      condition: "good",
    },
    {
      id: "R3",
      name: "Folding Stretcher",
      type: "Stretchers & Wheelchairs",
      totalQuantity: 10,
      availableQuantity: 8,
      assignedQuantity: 2,
      maintenanceQuantity: 0,
      location: "Health Center",
      condition: "fair",
    },
    {
      id: "R4",
      name: "Defibrillator (AED)",
      type: "Medical Supplies",
      totalQuantity: 5,
      availableQuantity: 4,
      assignedQuantity: 1,
      maintenanceQuantity: 0,
      location: "Sports Complex",
      condition: "good",
    },
    {
      id: "R5",
      name: "Two-Way Radio",
      type: "Emergency Communication Equipment",
      totalQuantity: 30,
      availableQuantity: 10,
      assignedQuantity: 15,
      maintenanceQuantity: 5,
      location: "Security Office",
      condition: "fair",
    },
  ],
  routes: [
    {
      id: "RT1",
      origin: "Science Block",
      destination: "Assembly Point 1",
      status: "unverified",
    },
  ],
  assemblyPoints: [
    {
      id: "AP1",
      name: "Assembly Point 1 (West Field)",
      capacity: 1000,
      coordinates: { x: 40, y: 160 },
      lat: 11.1105,
      lng: 77.3380,
    },
    {
      id: "AP2",
      name: "Assembly Point 2 (East Quad Green)",
      capacity: 800,
      coordinates: { x: 700, y: 285 },
      lat: 11.1070,
      lng: 77.3435,
    },
    {
      id: "AP3",
      name: "Assembly Point 3 (North Gate Plaza)",
      capacity: 600,
      coordinates: { x: 260, y: 40 },
      lat: 11.1115,
      lng: 77.3405,
    },
  ],
  campusEdges: [
    {
      id: "E1",
      source: "B1",
      target: "B2",
      distance: 30,
      accessible: true,
      blocked: false,
    }, // Main to Eng
    {
      id: "E2",
      source: "B2",
      target: "B3",
      distance: 25,
      accessible: true,
      blocked: false,
    }, // Eng to Science
    {
      id: "E3",
      source: "B1",
      target: "B4",
      distance: 30,
      accessible: true,
      blocked: false,
    }, // Main to Library
    {
      id: "E4",
      source: "B4",
      target: "B7",
      distance: 45,
      accessible: true,
      blocked: false,
    }, // Library to Cafe
    {
      id: "E5",
      source: "B7",
      target: "B5",
      distance: 30,
      accessible: true,
      blocked: false,
    }, // Cafe to Hostel A
    {
      id: "E6",
      source: "B5",
      target: "B6",
      distance: 20,
      accessible: true,
      blocked: false,
    }, // Hostel A to B
    {
      id: "E7",
      source: "B6",
      target: "AP2",
      distance: 25,
      accessible: true,
      blocked: false,
    }, // Hostel B to AP2
    {
      id: "E8",
      source: "B7",
      target: "AP2",
      distance: 15,
      accessible: true,
      blocked: false,
    }, // Cafe to AP2
    {
      id: "E9",
      source: "B3",
      target: "B8",
      distance: 20,
      accessible: true,
      blocked: false,
    }, // Science to Auditorium
    {
      id: "E10",
      source: "B8",
      target: "AP1",
      distance: 25,
      accessible: true,
      blocked: false,
    }, // Auditorium to AP1
    {
      id: "E11",
      source: "B2",
      target: "B8",
      distance: 35,
      accessible: true,
      blocked: false,
    }, // Eng to Auditorium
    {
      id: "E12",
      source: "B1",
      target: "B10",
      distance: 25,
      accessible: true,
      blocked: false,
    }, // Main to Gate
    {
      id: "E13",
      source: "B3",
      target: "B4",
      distance: 25,
      accessible: true,
      blocked: false,
    }, // Science to Library
    {
      id: "E14",
      source: "B9",
      target: "AP1",
      distance: 15,
      accessible: true,
      blocked: false,
    }, // Sports to AP1
    {
      id: "E15",
      source: "B9",
      target: "AP3",
      distance: 25,
      accessible: true,
      blocked: false,
    }, // Sports to AP3
    {
      id: "E16",
      source: "AP3",
      target: "B2",
      distance: 20,
      accessible: true,
      blocked: false,
    }, // AP3 to Eng
    {
      id: "E17",
      source: "AP3",
      target: "B5",
      distance: 25,
      accessible: true,
      blocked: false,
    }, // AP3 to Hostel A
  ],
  alerts: [
    {
      id: "A1",
      title: "New incident reported in Science Laboratory",
      severity: "high",
      time: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      read: false,
      incidentId: "INC-20261009-001",
      source: "System",
    },
    {
      id: "A2",
      title: "Medical Team Alpha dispatched",
      severity: "medium",
      time: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      read: true,
      incidentId: "INC-20261009-002",
      source: "Dispatch",
    },
  ],
  auditLogs: [
    {
      id: "LOG-1",
      timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      action: "incident_reported",
      details: "Chemical Vapor Leak detected in Science Laboratory (BLD-001). Initial triage initiated.",
      incidentId: "INC-20261009-001",
    },
    {
      id: "LOG-2",
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      action: "ai_triage_completed",
      details: "EngineX AI evaluated incident INC-20261009-001 as Critical priority (Risk score: 92/100).",
      incidentId: "INC-20261009-001",
    },
    {
      id: "LOG-3",
      timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      action: "responder_dispatched",
      details: "Dispatched HazMat Response Squad to Science Laboratory East Wing.",
      incidentId: "INC-20261009-001",
    },
  ],
  selectedIncidentId: "INC-20261009-001",
  setSelectedIncidentId: () => {},
  setCurrentUser: () => {},
  addIncident: async () => ({} as Incident),
  updateIncident: () => {},
  updateResponder: () => {},
  updateResource: () => {},
  addNote: () => {},
  addAuditLog: () => {},
  toggleEdgeBlock: () => {},
  markAlertRead: () => {},
  markAllAlertsRead: () => {},
  refreshAIAnalysis: async () => null,
  logout: () => {},
  resetDemoData: () => {},
};

const DemoContext = createContext<DemoState>(defaultState);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("enginex_user");
      return saved ? JSON.parse(saved) : defaultState.currentUser;
    } catch {
      return defaultState.currentUser;
    }
  });

  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(() => {
    try {
      return localStorage.getItem("enginex_selected_incident") || "INC-20261009-001";
    } catch {
      return "INC-20261009-001";
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(defaultState.auditLogs);

  const addAuditLog = (log: Omit<AuditLog, "id" | "timestamp">) => {
    const newLog: AuditLog = {
      ...log,
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const [incidents, setIncidents] = useState<Incident[]>(() => {
    try {
      const saved = localStorage.getItem("enginex_incidents");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return defaultState.incidents;
    } catch {
      return defaultState.incidents;
    }
  });

  const [buildings, setBuildings] = useState<Building[]>(defaultState.buildings);
  const [responders, setResponders] = useState<Responder[]>(defaultState.responders);
  const [resources, setResources] = useState<Resource[]>(defaultState.resources);
  const [routes] = useState<EvacuationRoute[]>(defaultState.routes);
  const [alerts, setAlerts] = useState<Alert[]>(defaultState.alerts);
  const [assemblyPoints] = useState<AssemblyPoint[]>(defaultState.assemblyPoints);
  const [campusEdges, setCampusEdges] = useState<CampusEdge[]>(defaultState.campusEdges);

  // Sync to localStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem("enginex_user", JSON.stringify(currentUser));
      } else {
        localStorage.removeItem("enginex_user");
      }
    } catch (e) {
      console.warn("Storage sync error:", e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      if (selectedIncidentId) {
        localStorage.setItem("enginex_selected_incident", selectedIncidentId);
      }
    } catch (e) {
      console.warn("Storage sync error:", e);
    }
  }, [selectedIncidentId]);

  useEffect(() => {
    try {
      localStorage.setItem("enginex_incidents", JSON.stringify(incidents));
    } catch (e) {
      console.warn("Storage sync error:", e);
    }
  }, [incidents]);

  const createAlert = (
    title: string,
    severity: Severity,
    source: string,
    incidentId?: string,
  ) => {
    setAlerts((prev) => [
      {
        id: `AL-${Date.now()}`,
        title,
        severity,
        time: new Date().toISOString(),
        read: false,
        incidentId,
        source,
      },
      ...prev,
    ]);
  };

  const addIncident = async (
    incidentData: Omit<
      Incident,
      "id" | "reportedTime" | "lastUpdate" | "timeline" | "notes" | "aiAnalysis"
    >,
  ): Promise<Incident> => {
    const timestamp = new Date().toISOString();
    const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const newId = `INC-${dateStr}-${String(incidents.length + 1).padStart(3, "0")}`;
    const buildingObj = buildings.find((b) => b.id === incidentData.buildingId);
    const locationName = buildingObj
      ? `${buildingObj.name} (${incidentData.locationDetails})`
      : incidentData.locationDetails;

    let aiResult: AIAnalysisResult | null = null;
    try {
      aiResult = await analyzeSituationWithAI({
        title: incidentData.title,
        description: incidentData.description,
        incident_id: newId,
        location: locationName,
        reporter_role: incidentData.reporterName,
        resources: responders.map((r) => ({
          team_name: r.name,
          specialization: r.specialization,
          status: r.status,
          skills: r.skills,
        })),
      });
    } catch (e) {
      console.warn("AI situation analysis error:", e);
    }

    let finalSeverity: Severity = incidentData.severity;
    if (aiResult?.risk_assessment?.priority) {
      const p = aiResult.risk_assessment.priority.toLowerCase();
      if (p === "critical") finalSeverity = "critical";
      else if (p === "high" && finalSeverity !== "critical") finalSeverity = "high";
      else if (p === "medium" && finalSeverity === "low") finalSeverity = "medium";
    }

    const timelineEvents: TimelineEvent[] = [
      {
        id: `TL-${Date.now()}`,
        time: timestamp,
        message: "Incident reported.",
      },
    ];

    if (aiResult) {
      timelineEvents.unshift({
        id: `TL-${Date.now() + 1}`,
        time: new Date().toISOString(),
        message: `[CampusOne AI] Threat Assessed: Priority ${aiResult.risk_assessment.priority} (Risk Score: ${aiResult.risk_assessment.risk_score}/100)${aiResult.requires_human_review ? " • Mandatory Human Review Required" : ""}`,
      });
    }

    const newIncident: Incident = {
      ...incidentData,
      id: newId,
      severity: finalSeverity,
      reportedTime: timestamp,
      lastUpdate: timestamp,
      notes: [],
      timeline: timelineEvents,
      aiAnalysis: aiResult || undefined,
    };

    setIncidents((prev) => [newIncident, ...prev]);

    // Create Alert
    createAlert(
      `New ${incidentData.type} reported in ${buildingObj?.name || "Campus"} (AI Priority: ${aiResult?.risk_assessment.priority || finalSeverity.toUpperCase()})`,
      finalSeverity,
      "CampusOne AI",
      newId,
    );

    // Update building status if it's high/critical
    if (
      finalSeverity === "high" ||
      finalSeverity === "critical"
    ) {
      setBuildings((prev) =>
        prev.map((b) =>
          b.id === incidentData.buildingId ? { ...b, status: "evacuating" } : b,
        ),
      );
    }

    return newIncident;
  };

  const refreshAIAnalysis = async (
    incidentId: string,
  ): Promise<AIAnalysisResult | null> => {
    const inc = incidents.find((i) => i.id === incidentId);
    if (!inc) return null;
    const buildingObj = buildings.find((b) => b.id === inc.buildingId);
    const locationName = buildingObj
      ? `${buildingObj.name} (${inc.locationDetails})`
      : inc.locationDetails;

    const aiResult = await analyzeSituationWithAI({
      title: inc.title,
      description: inc.description,
      incident_id: inc.id,
      location: locationName,
      reporter_role: inc.reporterName,
      resources: responders.map((r) => ({
        team_name: r.name,
        specialization: r.specialization,
        status: r.status,
        skills: r.skills,
      })),
    });

    if (aiResult) {
      let finalSeverity = inc.severity;
      const p = aiResult.risk_assessment?.priority?.toLowerCase();
      if (p === "critical") finalSeverity = "critical";
      else if (p === "high" && finalSeverity !== "critical") finalSeverity = "high";

      updateIncident(incidentId, {
        aiAnalysis: aiResult,
        severity: finalSeverity,
        timeline: [
          {
            id: `TL-${Date.now()}`,
            time: new Date().toISOString(),
            message: `[CampusOne AI] Intelligence Updated: Priority ${aiResult.risk_assessment.priority} (Score: ${aiResult.risk_assessment.risk_score}/100)`,
          },
          ...inc.timeline,
        ],
      });
    }

    return aiResult;
  };

  const updateIncident = (id: string, updates: Partial<Incident>) => {
    setIncidents((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          const updated = {
            ...i,
            ...updates,
            lastUpdate: new Date().toISOString(),
          };
          if (updates.status && updates.status !== i.status) {
            updated.timeline = [
              {
                id: `TL-${Date.now()}`,
                time: new Date().toISOString(),
                message: `Status changed to ${updates.status}`,
              },
              ...updated.timeline,
            ];
            createAlert(
              `Incident ${id} status updated to ${updates.status}`,
              i.severity,
              "Status Update",
              id,
            );
          }
          if (
            updates.assignedTeamId &&
            updates.assignedTeamId !== i.assignedTeamId
          ) {
            updated.timeline = [
              {
                id: `TL-${Date.now()}`,
                time: new Date().toISOString(),
                message: `Response team assigned.`,
              },
              ...updated.timeline,
            ];
          }
          return updated;
        }
        return i;
      }),
    );
  };

  const addNote = (id: string, note: string) => {
    setIncidents((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          return {
            ...i,
            notes: [...i.notes, note],
            timeline: [
              {
                id: `TL-${Date.now()}`,
                time: new Date().toISOString(),
                message: "Note added to incident.",
              },
              ...i.timeline,
            ],
          };
        }
        return i;
      }),
    );
  };

  const updateResponder = (id: string, updates: Partial<Responder>) => {
    setResponders((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          if (
            updates.status &&
            updates.status !== r.status &&
            r.currentIncidentId
          ) {
            createAlert(
              `Team ${r.name} is now ${updates.status}`,
              "medium",
              "Dispatch",
              r.currentIncidentId,
            );
          }
          return { ...r, ...updates, lastUpdate: new Date().toISOString() };
        }
        return r;
      }),
    );
  };

  const updateResource = (id: string, updates: Partial<Resource>) => {
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    );
  };

  const toggleEdgeBlock = (edgeId: string) => {
    setCampusEdges((prev) => {
      const edge = prev.find((e) => e.id === edgeId);
      if (edge && !edge.blocked) {
        createAlert(
          `Passage between ${edge.source} and ${edge.target} is blocked.`,
          "medium",
          "Infrastructure",
        );
      }
      return prev.map((e) =>
        e.id === edgeId ? { ...e, blocked: !e.blocked } : e,
      );
    });
  };

  const markAlertRead = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a)),
    );
  };

  const markAllAlertsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const resetDemoData = () => {
    if (
      window.confirm(
        "Are you sure you want to reset all mock data to their original states?",
      )
    ) {
      setIncidents(defaultState.incidents);
      setResponders(defaultState.responders);
      setBuildings(defaultState.buildings);
      setResources(defaultState.resources);
      setAlerts(defaultState.alerts);
      setCampusEdges(defaultState.campusEdges);
      createAlert("Demo data has been reset to defaults.", "low", "System");
    }
  };

  return (
    <DemoContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        selectedIncidentId,
        setSelectedIncidentId,
        incidents,
        buildings,
        responders,
        resources,
        routes,
        alerts,
        auditLogs,
        assemblyPoints,
        campusEdges,
        addIncident,
        updateIncident,
        updateResponder,
        updateResource,
        addNote,
        addAuditLog,
        toggleEdgeBlock,
        markAlertRead,
        markAllAlertsRead,
        refreshAIAnalysis,
        logout,
        resetDemoData,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  return useContext(DemoContext);
}
