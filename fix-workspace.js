const fs = require('fs');

const yamlPath = './pnpm-workspace.yaml';
let content = fs.readFileSync(yamlPath, 'utf8');
content = content.replace('"packages/*"', '"packages/shared"\n  - "packages/frontend"');
fs.writeFileSync(yamlPath, content);
console.log('Updated workspace:');
console.log(content);
