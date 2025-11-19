const fs = require('fs');
const report = JSON.parse(fs.readFileSync('eslint-report.json', 'utf8'));
const filesWithErrors = report
    .filter(file => file.messages.length > 0)
    .map(file => file.filePath);
console.log(filesWithErrors.join('\n'));
