const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');
const path = require('path');

const jarUrl = 'https://github.com/cafebazaar/bundle-signer/releases/download/v0.1.13/bundlesigner-0.1.13.jar';
const destFolder = path.join(process.env.USERPROFILE, 'Desktop', 'Chatbox_Releases');
const jarPath = path.join(destFolder, 'bundlesigner-0.1.13.jar');
const aabPath = path.join(destFolder, 'FaChatbox-Bazaar.aab');
const keystorePath = 'C:\\Users\\farha\\Fa-Chatbox\\android\\app\\release-key.keystore';
const pass = 'pass:Dastyar12345';
const alias = 'dastyar-alias';

if (fs.existsSync(jarPath) && fs.statSync(jarPath).size > 1000) {
  console.log('bundlesigner.jar already exists, skipping download.');
  runSigner();
} else {
  console.log('Downloading bundlesigner...');
  const file = fs.createWriteStream(jarPath);
  https.get(jarUrl, function(response) {
    if (response.statusCode === 302 || response.statusCode === 301) {
      https.get(response.headers.location, function(res2) {
        res2.pipe(file);
        file.on('finish', function() {
          file.close(runSigner);
        });
      });
    } else {
      response.pipe(file);
      file.on('finish', function() {
        file.close(runSigner);
      });
    }
  }).on('error', function(err) {
    try { fs.unlinkSync(jarPath); } catch {}
    console.error('Error downloading:', err.message);
  });
}

function runSigner() {
  console.log('Running bundlesigner...');
  try {
    const cmd = `java -jar "${jarPath}" genbin -v --bundle "${aabPath}" --bin "${destFolder}" --v2-signing-enabled true --v3-signing-enabled false --ks "${keystorePath}" --ks-pass ${pass} --ks-key-alias ${alias} --key-pass ${pass}`;
    console.log('Executing:', cmd);
    execSync(cmd, { stdio: 'inherit', cwd: destFolder });
    console.log('Success! .bin file generated.');
  } catch (err) {
    console.error('Error signing:', err.message);
  }
}
