const fs = require('fs');
const path = require('path');
const pages = ['Dispatch', 'Evacuation', 'Alerts', 'Analytics', 'Users', 'ReportEmergency'];
pages.forEach(page => {
  const file = path.join(process.cwd(), 'src/pages', page + '.tsx');
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, `
export default function ${page}() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">${page}</h1>
      <p className="text-muted">Content for ${page} goes here.</p>
    </div>
  );
}
`);
  }
});
