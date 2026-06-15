const fs = require('fs');
const path = require('path');
const webpush = require('web-push');

const envPath = path.join(__dirname, '../.env');

try {
  const keys = webpush.generateVAPIDKeys();
  const publicLine = `VAPID_PUBLIC_KEY=${keys.publicKey}`;
  const privateLine = `VAPID_PRIVATE_KEY=${keys.privateKey}`;

  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Remove existing VAPID keys if any
  envContent = envContent
    .split('\n')
    .filter(line => !line.startsWith('VAPID_PUBLIC_KEY=') && !line.startsWith('VAPID_PRIVATE_KEY='))
    .join('\n');

  envContent += `\n\n# ── Web Push Notifications VAPID Keys ──\n${publicLine}\n${privateLine}\n`;
  fs.writeFileSync(envPath, envContent, 'utf8');

  console.log('✅ Generated VAPID Keys and appended to .env:');
  console.log('Public Key:', keys.publicKey);
} catch (err) {
  console.error('Failed to generate VAPID keys:', err);
}
