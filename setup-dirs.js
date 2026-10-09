import fs from 'fs';
import path from 'path';

const dirs = [
  'src/components/layout',
  'src/components/ui',
  'src/components/shared',
  'src/pages/Dashboard',
  'src/pages/Incidents',
  'src/pages/CampusMap',
  'src/pages/Teams',
  'src/pages/Resources',
  'src/pages/Recommendations',
  'src/pages/Notifications',
  'src/pages/Reports',
  'src/pages/Settings',
  'src/pages/Audit',
  'src/pages/Login',
  'src/store',
  'src/types',
  'src/lib',
];

dirs.forEach(dir => {
  fs.mkdirSync(path.join(process.cwd(), dir), { recursive: true });
});

console.log('Directories created successfully.');
