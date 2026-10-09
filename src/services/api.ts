/**
 * EngineX Frontend Central API Client
 * Connects the React Frontend with the FastAPI Backend (/api/v1) and CampusOne AI Engine.
 */

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "/api/v1";

export interface AIStatusResponse {
  ai_enabled: boolean;
  nlu_provider: "gemini" | "rule_based_fallback" | "mock" | "custom_llm" | string;
  gemini_model?: string | null;
  gemini_configured: boolean;
  safety_disclaimer: string;
  status: string;
}

export interface AIAnalysisResult {
  incident_id?: string;
  categories: string[];
  summary: string;
  affected_location: string;
  risk_assessment: {
    priority: "Critical" | "High" | "Medium" | "Low" | string;
    risk_score: number;
    priority_score: number;
    risk_factors: string[];
    reasoning_summary: string;
    uncertainty_level: string;
    requires_human_review: boolean;
    missing_information: string[];
    is_safety_critical: boolean;
    potential_harm_level: string;
    immediacy_of_danger: string;
  };
  recommended_department: string;
  recommended_actions: Array<
    | string
    | {
        action: string;
        priority: string;
        description: string;
        role_responsible?: string;
      }
  >;
  resource_recommendations: Array<{
    team_name?: string;
    name?: string;
    specialization?: string;
    match_score?: number;
    rationale?: string;
    recommended_equipment?: string[];
  }>;
  related_incidents: any[];
  evacuation_recommendation: {
    status: string;
    route?: string[];
    safe_zone?: string;
    hazards_avoided?: string[];
    accessibility_verified?: boolean;
    reasoning?: string;
  };
  uncertainty: {
    level: string;
    nlu_confidence: number;
    classification_confidence: number;
    missing_information: string[];
    conflicting_elements: string[];
    is_unfamiliar: boolean;
    model_provider?: string;
  };
  requires_human_review: boolean;
  explanation: string;
  assessment_version?: string;
  timestamp?: string;
}

export interface SituationAnalysisPayload {
  title: string;
  description: string;
  incident_id?: string;
  location?: string;
  reporter_role?: string;
  campus_context?: Record<string, any>;
  resources?: Array<Record<string, any>>;
  related_incidents?: Array<Record<string, any>>;
  map_data?: Record<string, any>;
}

export interface BackendIncident {
  id: number;
  title: string;
  description: string;
  category: string;
  severity: string;
  priority_score: number;
  status: string;
  location_id?: number;
  location_name: string;
  reporter_metadata?: string;
  reported_at: string;
  updated_at: string;
  history?: any[];
}

export interface BackendDashboardStats {
  total_incidents: number;
  active_incidents: number;
  critical_incidents: number;
  resolved_incidents: number;
  avg_resolution_time_minutes: number;
  incidents_by_category: Record<string, number>;
  incidents_by_severity: Record<string, number>;
  active_hazards: number;
  available_teams: number;
  total_teams: number;
  open_helpdesk_tickets: number;
}

export interface BackendTeam {
  id: number;
  name: string;
  specialization: string;
  status: string;
  current_location_id?: number;
  contact_info?: string;
}

export interface BackendLocation {
  id: number;
  name: string;
  building_id?: number;
  floor?: number;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
}

export interface BackendBuilding {
  id: number;
  name: string;
  code?: string;
  total_floors?: number;
  status?: string;
}

export interface BackendHazard {
  id: number;
  location_id: number;
  hazard_type: string;
  severity: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface EvacuationRouteResponse {
  status: string;
  route: number[];
  route_names?: string[];
  total_distance: number;
  accessible: boolean;
  hazards_avoided?: number[];
  disclaimer: string;
}

export interface BackendNotification {
  id: number;
  title: string;
  message: string;
  severity: string;
  recipient_role?: string;
  incident_id?: number;
  sent_at: string;
  is_read: boolean;
}

export interface HelpdeskRequest {
  id?: number;
  title: string;
  description: string;
  department?: string;
  urgency?: string;
  location?: string;
  status?: string;
}

// ---------------------------------------------------------------------------
// Helper Request Function with Timeout
// ---------------------------------------------------------------------------
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs = 8000
): Promise<T | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[API] ${options.method || "GET"} ${endpoint} returned ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      console.warn(`[API] Timeout requesting ${endpoint}`);
    } else {
      console.warn(`[API] Connection error on ${endpoint}:`, err.message);
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// Health & AI Provider Status
// ---------------------------------------------------------------------------
export async function checkBackendHealth(): Promise<{ status: string; ai_enabled?: boolean } | null> {
  return await apiFetch<{ status: string; ai_enabled?: boolean }>("/health");
}

export async function getAIStatus(): Promise<AIStatusResponse | null> {
  return await apiFetch<AIStatusResponse>("/ai/status");
}

// ---------------------------------------------------------------------------
// AI Crisis Intelligence & NLU Analysis
// ---------------------------------------------------------------------------
export async function analyzeSituationWithAI(
  payload: SituationAnalysisPayload
): Promise<AIAnalysisResult | null> {
  return await apiFetch<AIAnalysisResult>("/ai/analyze-situation", {
    method: "POST",
    body: JSON.stringify({
      title: payload.title,
      description: payload.description,
      incident_id: payload.incident_id,
      location: payload.location,
      reporter_role: payload.reporter_role || "Student",
      campus_context: payload.campus_context || {},
      resources: payload.resources || [],
      related_incidents: payload.related_incidents || [],
      map_data: payload.map_data,
    }),
  }, 12000);
}

export async function classifyComplaintWithAI(
  title: string,
  description: string,
  location?: string
): Promise<any | null> {
  return await apiFetch<any>("/ai/classify-incident", {
    method: "POST",
    body: JSON.stringify({ title, description, location }),
  });
}

// ---------------------------------------------------------------------------
// Incident Management Endpoints (/reports)
// ---------------------------------------------------------------------------
export async function fetchBackendReports(params?: {
  status?: string;
  severity?: string;
  category?: string;
  skip?: number;
  limit?: number;
}): Promise<{ total: number; items: BackendIncident[] } | null> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.severity) query.set("severity", params.severity);
  if (params?.category) query.set("category", params.category);
  if (params?.skip !== undefined) query.set("skip", String(params.skip));
  if (params?.limit !== undefined) query.set("limit", String(params.limit));

  const endpoint = `/reports${query.toString() ? `?${query.toString()}` : ""}`;
  return await apiFetch<{ total: number; items: BackendIncident[] }>(endpoint);
}

export async function fetchBackendReport(reportId: number): Promise<BackendIncident | null> {
  return await apiFetch<BackendIncident>(`/reports/${reportId}`);
}

export async function createBackendReport(data: {
  title: string;
  description: string;
  category: string;
  severity: string;
  location_name: string;
  location_id?: number;
  reporter_metadata?: string;
}): Promise<BackendIncident | null> {
  return await apiFetch<BackendIncident>("/reports", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateBackendReportStatus(
  reportId: number,
  status: string,
  reason?: string
): Promise<BackendIncident | null> {
  return await apiFetch<BackendIncident>(`/reports/${reportId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, reason }),
  });
}

// ---------------------------------------------------------------------------
// Dashboard Analytics Endpoints (/dashboard/stats)
// ---------------------------------------------------------------------------
export async function fetchDashboardStats(): Promise<BackendDashboardStats | null> {
  return await apiFetch<BackendDashboardStats>("/dashboard/stats");
}

// ---------------------------------------------------------------------------
// Response Teams Endpoints (/teams)
// ---------------------------------------------------------------------------
export async function fetchTeams(): Promise<BackendTeam[] | null> {
  return await apiFetch<BackendTeam[]>("/teams");
}

export async function fetchAvailableTeams(): Promise<BackendTeam[] | null> {
  return await apiFetch<BackendTeam[]>("/teams/available");
}

// ---------------------------------------------------------------------------
// Campus & Routing Endpoints (/campus, /routing)
// ---------------------------------------------------------------------------
export async function fetchCampusBuildings(): Promise<BackendBuilding[] | null> {
  return await apiFetch<BackendBuilding[]>("/campus/buildings");
}

export async function fetchCampusLocations(): Promise<BackendLocation[] | null> {
  return await apiFetch<BackendLocation[]>("/campus/locations");
}

export async function fetchCampusHazards(): Promise<BackendHazard[] | null> {
  return await apiFetch<BackendHazard[]>("/campus/hazards");
}

export async function computeEvacuationRoute(
  originId: number,
  destinationId?: number,
  accessible = false
): Promise<EvacuationRouteResponse | null> {
  const query = new URLSearchParams({
    origin_id: String(originId),
    accessible: String(accessible),
  });
  if (destinationId) query.set("destination_id", String(destinationId));

  return await apiFetch<EvacuationRouteResponse>(`/routing/evacuate?${query.toString()}`);
}

// ---------------------------------------------------------------------------
// Helpdesk & Service Requests (/helpdesk)
// ---------------------------------------------------------------------------
export async function fetchHelpdeskRequests(): Promise<HelpdeskRequest[] | null> {
  return await apiFetch<HelpdeskRequest[]>("/helpdesk/requests");
}

export async function submitHelpdeskRequest(data: HelpdeskRequest): Promise<HelpdeskRequest | null> {
  return await apiFetch<HelpdeskRequest>("/helpdesk/requests", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ---------------------------------------------------------------------------
// Notifications Endpoints (/notifications)
// ---------------------------------------------------------------------------
export async function fetchNotifications(role?: string): Promise<BackendNotification[] | null> {
  const endpoint = role ? `/notifications?role=${encodeURIComponent(role)}` : "/notifications";
  return await apiFetch<BackendNotification[]>(endpoint);
}
