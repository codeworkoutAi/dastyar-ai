/**
 * scripts/prune-android-assets.cjs
 *
 * Automatically prunes web-only assets (e.g. Landing Page image galleries,
 * webmaster verification files, etc.) from the Android Capacitor assets directory
 * (android/app/src/main/assets/public) to minimize APK and AAB bundle size.
 *
 * Leaves root `public/` completely intact for web deployment.
 */

const fs = require('fs');
const path = require('path');

const ANDROID_ASSETS_DIR = path.resolve(__dirname, '..', 'android', 'app', 'src', 'main', 'assets', 'public');

// Web-only directories and files relative to assets/public
const ITEMS_TO_PRUNE = [
  'images',            // Landing page gallery, professions, gemini-pro-banner
  '60366138.txt',      // eNamad verification
  'BingSiteAuth.xml',  // Bing webmaster verification
  'llms.txt'           // LLM web crawler file
];

function getDirectorySize(dirPath) {
  let size = 0;
  if (!fs.existsSync(dirPath)) return 0;
  const stat = fs.statSync(dirPath);
  if (!stat.isDirectory()) return stat.size;

  const entries = fs.readdirSync(dirPath);
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    const entryStat = fs.statSync(fullPath);
    if (entryStat.isDirectory()) {
      size += getDirectorySize(fullPath);
    } else {
      size += entryStat.size;
    }
  }
  return size;
}

function prune() {
  if (!fs.existsSync(ANDROID_ASSETS_DIR)) {
    console.log(`[prune-android-assets] Assets directory not found: ${ANDROID_ASSETS_DIR}. Skipping.`);
    return;
  }

  console.log(`[prune-android-assets] Scanning Android assets at: ${ANDROID_ASSETS_DIR}`);
  let totalPrunedBytes = 0;

  for (const item of ITEMS_TO_PRUNE) {
    const targetPath = path.join(ANDROID_ASSETS_DIR, item);
    if (fs.existsSync(targetPath)) {
      const size = getDirectorySize(targetPath);
      try {
        fs.rmSync(targetPath, { recursive: true, force: true });
        totalPrunedBytes += size;
        const sizeFormatted = (size / 1024 / 1024).toFixed(2);
        console.log(`  - Pruned web-only asset: ${item} (~${sizeFormatted} MB)`);
      } catch (err) {
        console.warn(`  ! Failed to prune ${item}:`, err.message);
      }
    }
  }

  const mbSaved = (totalPrunedBytes / 1024 / 1024).toFixed(2);
  console.log(`[prune-android-assets] Finished! Total size saved from APK/AAB: ${mbSaved} MB\n`);
}

prune();
