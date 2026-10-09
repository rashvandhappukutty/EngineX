const fs = require('fs');
const path = require('path');

function replaceFile(file, regex, replacement) {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(regex, replacement);
    fs.writeFileSync(fullPath, content, 'utf8');
  }
}

// Alerts.tsx
replaceFile('src/pages/Alerts.tsx', 
  /import\s*{\s*Severity,\s*Alert\s*}\s*from\s*["']\.\.\/store\/demoState["'];?/, 
  "import type { Severity, Alert } from '../store/demoState';"
);

// Analytics.tsx
replaceFile('src/pages/Analytics.tsx', 
  /import\s*{\s*Incident\s*}\s*from\s*["']\.\.\/store\/demoState["'];?/, 
  ""
);
// In Analytics.tsx it might be `import { Incident, Building } ...`
replaceFile('src/pages/Analytics.tsx', 
  /,\s*Incident(\s*[},])/g, 
  "$1"
);
replaceFile('src/pages/Analytics.tsx', 
  /Incident\s*,\s*/g, 
  ""
);
replaceFile('src/pages/Analytics.tsx', 
  /let entry/g, 
  "let _entry"
);
replaceFile('src/pages/Analytics.tsx', 
  /entry,\s*idx/g, 
  "_entry, idx"
);

// CampusMap.tsx
replaceFile('src/pages/CampusMap.tsx', 
  /,\s*Incident(\s*[},])/g, 
  "$1"
);
replaceFile('src/pages/CampusMap.tsx', 
  /Incident\s*,\s*/g, 
  ""
);
replaceFile('src/pages/CampusMap.tsx', 
  /,\s*MapIcon(\s*[},])/g, 
  "$1"
);
replaceFile('src/pages/CampusMap.tsx', 
  /MapIcon\s*,\s*/g, 
  ""
);
replaceFile('src/pages/CampusMap.tsx', 
  /const resources = [^;]+;/g, 
  ""
);

// Evacuation.tsx
replaceFile('src/pages/Evacuation.tsx', 
  /,\s*Navigation(\s*[},])/g, 
  "$1"
);
replaceFile('src/pages/Evacuation.tsx', 
  /Navigation\s*,\s*/g, 
  ""
);

// IncidentDetails.tsx
replaceFile('src/pages/Incidents/IncidentDetails.tsx', 
  /import\s*{\s*IncidentStatus,\s*Severity\s*}\s*from\s*["']\.\.\/\.\.\/store\/demoState["'];?/, 
  "import type { IncidentStatus, Severity } from '../../store/demoState';"
);

// ReportEmergency.tsx
replaceFile('src/pages/ReportEmergency.tsx', 
  /type FormValues = z\.infer<typeof formSchema>;/g, 
  `interface FormValues {
  type: string;
  buildingId: string;
  locationDetails: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  reporterName: string;
  reporterContact?: string;
  peopleAffected?: number;
}`
);
replaceFile('src/pages/ReportEmergency.tsx', 
  /peopleAffected:\s*z\.preprocess\([^\)]+\),\s*z\.number\(\)\.optional\(\)\),?/s, 
  "peopleAffected: z.any().optional(),"
);
replaceFile('src/pages/ReportEmergency.tsx', 
  /peopleAffected:\s*z\.preprocess[^,]+,[^,]+,\s*/s, 
  "peopleAffected: z.any().optional(),"
);



