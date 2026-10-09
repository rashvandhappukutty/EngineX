const fs = require('fs');
const path = require('path');

function replaceFile(filePath, replacer) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  let newContent = replacer(content);
  if (content !== newContent) {
    fs.writeFileSync(fullPath, newContent, 'utf8');
    console.log('Fixed', filePath);
  }
}

// 1. Unused vars
replaceFile('src/components/layout/Shell.tsx', c => c.replace(/,\s*ShieldAlert/, ''));
replaceFile('src/pages/Alerts.tsx', c => c.replace(/import\s+{\s*Severity,\s*Alert\s*}\s+from\s+['"]\.\.\/store\/demoState['"]/, "import type { Severity, Alert } from '../store/demoState'"));
replaceFile('src/pages/Analytics.tsx', c => c.replace(/,\s*Incident/, '').replace(/let entry/g, 'let _entry').replace(/entry,\s*idx/g, '_entry, idx'));
replaceFile('src/pages/CampusMap.tsx', c => c.replace(/,\s*Incident/, '').replace(/,\s*MapIcon/, '').replace(/const resources = [^;]+;/, ''));
replaceFile('src/pages/Evacuation.tsx', c => c.replace(/,\s*Navigation/, '').replace(/,\s*AlertTriangle/, '').replace(/,\s*MapPin/, '').replace(/,\s*Map/, '').replace(/,\s*RefreshCw/, ''));
replaceFile('src/pages/Incidents/IncidentDetails.tsx', c => c.replace(/import\s+{\s*IncidentStatus,\s*Severity\s*}\s+from\s+['"]\.\.\/\.\.\/store\/demoState['"]/, "import type { IncidentStatus, Severity } from '../../store/demoState'").replace(/idx/g, '_idx'));
replaceFile('src/store/demoState.tsx', c => c.replace(/const \[routes, setRoutes\] = useState/g, 'const [routes] = useState'));

// 2. ReportEmergency zod
replaceFile('src/pages/ReportEmergency.tsx', c => {
  return c.replace(/peopleAffected:\s*z\.union\(\[z\.string\(\),\s*z\.number\(\)\]\)\.optional\(\)\.transform\([^\)]+\),/s, "peopleAffected: z.preprocess((val) => val === '' ? undefined : Number(val), z.number().optional()),");
});
