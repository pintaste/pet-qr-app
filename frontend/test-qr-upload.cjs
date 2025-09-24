const QrScanner = require('qr-scanner');
const fs = require('fs');
const path = require('path');

// Test QR code file upload functionality
async function testQRUpload() {
  console.log('🧪 Testing QR Code File Upload Functionality\n');

  const testCodesDir = path.join(__dirname, 'test-qr-codes');
  const testFiles = fs.readdirSync(testCodesDir).filter(file => file.endsWith('.png'));

  for (const filename of testFiles) {
    const filepath = path.join(testCodesDir, filename);

    try {
      console.log(`📁 Testing: ${filename}`);
      console.log(`   File path: ${filepath}`);

      // Read the file as a buffer (simulating file upload)
      const fileBuffer = fs.readFileSync(filepath);
      console.log(`   File size: ${fileBuffer.length} bytes`);

      // Test QR scanning (this is what happens in QRScannerModal)
      const result = await QrScanner.scanImage(filepath, {
        returnDetailedScanResult: true
      });

      console.log(`   ✅ QR Scan SUCCESS`);
      console.log(`   📱 Detected URL: ${result.data}`);

      // Extract QR code from URL
      const urlMatch = result.data.match(/\/qr\/(.+)$/);
      if (urlMatch) {
        const qrCode = urlMatch[1];
        console.log(`   🔍 Extracted QR Code: ${qrCode}`);
        console.log(`   🔄 Would navigate to: /language?qr=${encodeURIComponent(qrCode)}`);
      }

      console.log();

    } catch (error) {
      console.log(`   ❌ QR Scan FAILED: ${error.message}`);
      console.log();
    }
  }

  console.log('📊 Test Summary:');
  console.log('✅ All QR codes should be readable by the upload function');
  console.log('✅ URLs should be properly formatted');
  console.log('✅ Navigation flow should work as expected');
  console.log('\n🎯 Manual Testing Instructions:');
  console.log('1. Open http://localhost:3001 in your browser');
  console.log('2. Click the "Scan QR" button');
  console.log('3. Switch to "Upload" tab');
  console.log('4. Try uploading each PNG file from test-qr-codes/');
  console.log('5. Verify the navigation works for each scenario:');
  console.log('   - demo123: Should go to PIN verification');
  console.log('   - demo456: Should show "Registration Required"');
  console.log('   - demo789: Should show "QR Code Not Activated"');
  console.log('   - demo999: Should show "QR Code Not Found"');
}

testQRUpload().catch(console.error);