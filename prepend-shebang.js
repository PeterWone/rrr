const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const filePath = path.join(__dirname, 'dist/index.js');
const shebang = '#!/usr/bin/env node\n';

fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    return console.error(err);
  }
  const updatedContent = shebang + data;
  fs.writeFile(filePath, updatedContent, 'utf8', (err) => {
    if (err) return console.error(err);
    console.log('Shebang line added successfully.');

    // Set execute permission on non-Windows platforms
    if (process.platform !== 'win32') {
      exec(`chmod +x ${filePath}`, (err) => {
        if (err) {
          return console.error('Error setting execute permissions:', err);
        }
        console.log('Execute permissions set successfully.');
      });
    }
  });
});
