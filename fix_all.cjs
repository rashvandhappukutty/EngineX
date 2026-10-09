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

// 1. Add missing lucide-react imports
const missingIcons = {
  'src/pages/CampusMap.tsx': ['AlertTriangle', 'Users', 'Navigation'],
  'src/pages/Dispatch.tsx': ['CheckCircle', 'Filter'],
  'src/pages/Incidents.tsx': ['MapPin', 'Clock', 'ChevronRight'],
  'src/pages/Incidents/IncidentDetails.tsx': ['MapPin', 'Clock', 'Users', 'Activity', 'CheckCircle'],
  'src/pages/Resources.tsx': ['CheckCircle', 'Filter', 'AlertTriangle']
};

for (const [file, icons] of Object.entries(missingIcons)) {
  replaceFile(file, content => {
    // Check if import from 'lucide-react' exists
    if (content.includes("'lucide-react'")) {
      return content.replace(/import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/, (match, p1) => {
        let existing = p1.split(',').map(s => s.trim()).filter(s => s);
        let all = new Set([...existing, ...icons]);
        return `import { ${Array.from(all).join(', ')} } from 'lucide-react'`;
      });
    } else {
      return `import { ${icons.join(', ')} } from 'lucide-react';\n` + content;
    }
  });
}

// 2. Fix Dashboard.tsx null currentUser
replaceFile('src/pages/Dashboard.tsx', content => {
  return content.replace(/currentUser\.name/g, 'currentUser?.name')
                .replace(/currentUser\.role/g, 'currentUser?.role');
});

// 3. Fix IncidentDetails.tsx null currentUser
replaceFile('src/pages/Incidents/IncidentDetails.tsx', content => {
  return content.replace(/currentUser\.name/g, 'currentUser?.name');
});

// 4. Fix ReportEmergency.tsx zod schema
replaceFile('src/pages/ReportEmergency.tsx', content => {
  // Fix enum
  let c = content.replace(
    /severity:\s*z\.enum\(\['low',\s*'medium',\s*'high',\s*'critical'\],\s*{[^}]+}\),/s,
    `severity: z.enum(['low', 'medium', 'high', 'critical'], { message: 'Please select a severity level' }),`
  );
  // Fix peopleAffected: change coerce.number() back to string and transform, but map type to unknown to number
  c = c.replace(
    /peopleAffected:\s*z\.coerce\.number\(\)\.min\(0\)\.optional\(\),/,
    `peopleAffected: z.union([z.string(), z.number()]).optional().transform(v => typeof v === 'string' && v ? parseInt(v, 10) : (typeof v === 'number' ? v : undefined)),`
  );
  return c;
});

// 5. Fix unused imports in Alerts.tsx
replaceFile('src/pages/Alerts.tsx', content => {
  return content.replace(/import\s+{\s*Severity,\s*Alert\s*}\s+from\s+['"]\.\.\/store\/demoState['"]/, `import type { Severity, Alert } from '../store/demoState'`);
});

// 6. Fix ReactNode import in demoState.tsx
replaceFile('src/store/demoState.tsx', content => {
  let c = content.replace(/import\s+{\s*ReactNode\s*}\s+from\s+['"]react['"];?/g, '');
  if (!c.includes('import type { ReactNode }')) {
     c = c.replace(/import\s+{([^}]+)}\s+from\s+['"]react['"];?/, `import { $1 } from 'react';\nimport type { ReactNode } from 'react';`);
  }
  return c;
});
