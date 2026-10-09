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

// 1. Alerts.tsx
replaceFile('src/pages/Alerts.tsx', c => c.replace(/import\s+{\s*Severity,\s*Alert\s*}\s+from\s+['"]\.\.\/store\/demoState['"];?/, "import type { Severity, Alert } from '../store/demoState';"));

// 2. Analytics.tsx
replaceFile('src/pages/Analytics.tsx', c => {
  return c.replace(/,\s*Incident/, '').replace(/let entry/g, 'let _entry').replace(/entry,\s*idx/g, '_entry, idx');
});

// 3. CampusMap.tsx
replaceFile('src/pages/CampusMap.tsx', c => {
  return c.replace(/,\s*Incident/, '').replace(/,\s*MapIcon/, '').replace(/const resources = [^;]+;/, '');
});

// 4. Evacuation.tsx
replaceFile('src/pages/Evacuation.tsx', c => c.replace(/,\s*Navigation/, ''));

// 5. IncidentDetails.tsx
replaceFile('src/pages/Incidents/IncidentDetails.tsx', c => {
  return c.replace(/import\s+{\s*IncidentStatus,\s*Severity\s*}\s+from\s+['"]\.\.\/\.\.\/store\/demoState['"];?/, "import type { IncidentStatus, Severity } from '../../store/demoState';").replace(/idx/g, '_idx');
});
