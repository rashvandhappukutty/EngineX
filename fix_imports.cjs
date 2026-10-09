const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/pages/Analytics.tsx',
  'src/pages/CampusMap.tsx',
  'src/pages/Dispatch.tsx',
  'src/pages/Incidents.tsx',
  'src/pages/Incidents/IncidentDetails.tsx',
  'src/pages/Login.tsx',
  'src/pages/Resources.tsx'
];

filesToFix.forEach(relPath => {
  const filePath = path.join(__dirname, relPath);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace import { Incident, Building, ... } from '../store/demoState' 
    // with import type { Incident, Building, ... } from '../store/demoState'
    content = content.replace(/import\s+{([^}]+)}\s+from\s+['"]\.\.?\/store\/demoState['"]/g, (match, p1) => {
      // If we only import types, we can use import type
      // Actually, useDemo is a value, but types are types.
      // A better way: just change it to import { type A, type B }
      let newImports = p1.split(',').map(s => s.trim()).filter(s => s);
      let mapped = newImports.map(i => {
        if (['Incident', 'Building', 'Responder', 'DispatchStatus', 'IncidentStatus', 'Severity', 'User', 'Resource'].includes(i)) {
          return `type ${i}`;
        }
        return i;
      });
      return `import { ${mapped.join(', ')} } from '../store/demoState'`;
    });

    // Remove unused lucide-react imports mentioned in errors
    content = content.replace(/,\s*Activity/, '');
    content = content.replace(/,\s*AlertTriangle/, '');
    content = content.replace(/,\s*CheckCircle/, '');
    content = content.replace(/,\s*Clock/, '');
    content = content.replace(/,\s*MapIcon/, '');
    content = content.replace(/,\s*Layers/, '');
    content = content.replace(/,\s*Users/, '');
    content = content.replace(/,\s*ChevronRight/, '');
    content = content.replace(/,\s*Navigation/, '');
    content = content.replace(/,\s*MapPin/, '');
    content = content.replace(/,\s*Map/, '');
    content = content.replace(/,\s*RefreshCw/, '');
    content = content.replace(/,\s*Filter/, '');
    // clean up trailing or leading commas inside import
    content = content.replace(/import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/g, (match, p1) => {
      let cleaned = p1.split(',').map(s => s.trim()).filter(s => s).join(', ');
      return `import { ${cleaned} } from 'lucide-react'`;
    });

    // Remove unused vars
    content = content.replace(/const typeData = [^;]+;/, '');
    content = content.replace(/const resources = [^;]+;/, '');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed imports in', relPath);
  }
});
