const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Create test-qr-codes directory if it doesn't exist
const outputDir = path.join(__dirname, 'test-qr-codes');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// QR code scenarios for testing
const qrCodes = [
  {
    code: 'demo123',
    description: 'Activated and bound to pet',
    url: 'http://localhost:3000/qr/demo123'
  },
  {
    code: 'demo456',
    description: 'Activated but needs binding',
    url: 'http://localhost:3000/qr/demo456'
  },
  {
    code: 'demo789',
    description: 'Needs activation',
    url: 'http://localhost:3000/qr/demo789'
  },
  {
    code: 'demo999',
    description: 'QR Code Not Found',
    url: 'http://localhost:3000/qr/demo999'
  }
];

// Generate QR codes
async function generateQRCodes() {
  console.log('Generating QR codes for testing...\n');

  for (const qr of qrCodes) {
    try {
      const filename = `${qr.code}-${qr.description.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.png`;
      const filepath = path.join(outputDir, filename);

      // Generate QR code with the URL
      await QRCode.toFile(filepath, qr.url, {
        errorCorrectionLevel: 'M',
        type: 'png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 300
      });

      console.log(`✅ Generated: ${filename}`);
      console.log(`   Code: ${qr.code}`);
      console.log(`   Description: ${qr.description}`);
      console.log(`   URL: ${qr.url}`);
      console.log();

    } catch (err) {
      console.error(`❌ Failed to generate QR code for ${qr.code}:`, err.message);
    }
  }

  console.log(`🎉 All QR codes generated in: ${outputDir}`);
  console.log('\nTo test:');
  console.log('1. Start the frontend dev server: npm run dev');
  console.log('2. Open http://localhost:3001 (or whatever port Vite assigns)');
  console.log('3. Click "Scan QR" button');
  console.log('4. Upload one of the generated PNG files or scan with camera');
  console.log('\nExpected behaviors:');
  console.log('- demo123: Should show "QR Code Activated" → PIN verification');
  console.log('- demo456: Should show "Registration Required"');
  console.log('- demo789: Should show "QR Code Not Activated"');
  console.log('- demo999: Should show "QR Code Not Found"');
}

generateQRCodes().catch(console.error);