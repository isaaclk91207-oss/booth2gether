const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'pnpm-workspace.yaml');
let content = fs.readFileSync(filePath, 'utf8');
content = content.replace('"packages/*"', '"packages/shared"\n  - "packages/frontend"');
fs.writeFileSync(filePath, content);
console.log('Updated pnpm-workspace.yaml:');
console.log(content);
