const fs = require('fs');
try {
  const report = JSON.parse(fs.readFileSync('eslint-report.json', 'utf8'));
  const errors = report.filter(file => file.errorCount > 0 || file.warningCount > 0);
  errors.forEach(file => {
    console.log(`File: ${file.filePath}`);
    file.messages.forEach(msg => {
      console.log(`  Line ${msg.line}: ${msg.message} (${msg.ruleId})`);
    });
  });
} catch (e) {
  console.error("Error parsing report:", e);
}
