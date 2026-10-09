import fs from 'fs';
import path from 'path';

const pages = [
  'Dashboard', 'Login', 'Incidents/index', 'Incidents/IncidentDetails',
  'CampusMap', 'Teams', 'Resources', 'Recommendations',
  'Notifications', 'Reports', 'Settings', 'Audit'
];

pages.forEach(page => {
  const dir = path.join(process.cwd(), 'src/pages', path.dirname(page));
  if (dir !== '.') fs.mkdirSync(dir, { recursive: true });
  
  let name = path.basename(page);
  if (name === 'index') name = 'Incidents';

  const file = path.join(process.cwd(), 'src/pages', `${page}.tsx`);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, `
export default function ${name}() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">${name}</h1>
      <p className="text-muted">Content for ${name} goes here.</p>
    </div>
  );
}
`);
  }
});

const shellPath = path.join(process.cwd(), 'src/components/layout/Shell.tsx');
if (!fs.existsSync(shellPath)) {
  fs.writeFileSync(shellPath, `
import { Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, Map, Users, Box, Cpu, Bell, BarChart2, Settings, ShieldAlert } from 'lucide-react';

export default function Shell() {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Incidents', path: '/incidents', icon: AlertTriangle },
    { name: 'Campus Map', path: '/campus-map', icon: Map },
    { name: 'Teams', path: '/teams', icon: Users },
    { name: 'Resources', path: '/resources', icon: Box },
    { name: 'Recommendations', path: '/recommendations', icon: Cpu },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Reports', path: '/reports', icon: BarChart2 },
    { name: 'Audit', path: '/audit', icon: ShieldAlert },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-background text-text">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-border flex flex-col">
        <div className="p-4 flex items-center gap-3 border-b border-border">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center font-bold text-white">E</div>
          <div>
            <h1 className="font-bold text-lg">EngineX</h1>
            <p className="text-xs text-muted">Smart Campus Crisis</p>
          </div>
        </div>
        
        <div className="p-3 bg-blue-900/20 border-b border-border text-xs text-blue-300 text-center">
          ACADEMIC DEMO MODE
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-panel transition-colors text-sm"
              >
                <Icon size={18} className="text-muted" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6">
          <div className="font-semibold">Command Center</div>
          <div className="flex items-center gap-4">
            <span className="text-sm bg-panel px-3 py-1 rounded-full border border-border">Role: Coordinator</span>
            <button className="text-sm text-primary hover:underline">Log Out</button>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
`);
}

const mainPath = path.join(process.cwd(), 'src/main.tsx');
fs.writeFileSync(mainPath, `
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
`);

console.log('Pages generated.');
