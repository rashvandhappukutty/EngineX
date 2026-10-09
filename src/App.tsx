import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DemoProvider } from "./store/demoState";
import Layout from "./components/layout/Shell";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Incidents from "./pages/Incidents";
import IncidentDetails from "./pages/Incidents/IncidentDetails";
import CampusMap from "./pages/CampusMap";
import Dispatch from "./pages/Dispatch";
import Evacuation from "./pages/Evacuation";
import Resources from "./pages/Resources";
import Alerts from "./pages/Alerts";
import Analytics from "./pages/Analytics";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import ReportEmergency from "./pages/ReportEmergency";

function App() {
  return (
    <DemoProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/incidents/:id" element={<IncidentDetails />} />
            <Route path="/campus-map" element={<CampusMap />} />
            <Route path="/dispatch" element={<Dispatch />} />
            <Route path="/evacuation" element={<Evacuation />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/users" element={<Users />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/report-emergency" element={<ReportEmergency />} />

            <Route
              path="*"
              element={
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                  <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
                  <a href="/dashboard" className="text-primary hover:underline">
                    Return to Dashboard
                  </a>
                </div>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </DemoProvider>
  );
}

export default App;
