import db, { syncDatabase } from '../server/db/database';
import { optimizeImageToWebpDataUrl } from '../server/services/utils';

async function migrateAllNewsImages() {
  console.log('--- Starting Migration of News Images to Ultra-lightweight WebP ---');
  
  const rows = db.prepare('SELECT id, title, image FROM news ORDER BY id DESC').all() as Array<{
    id: number;
    title: string;
    image: string | null;
  }>;

  console.log(`Found ${rows.length} total news articles in database.`);
  let convertedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const row of rows) {
    if (!row.image) {
      console.log(`[#${row.id}] No image present. Skipping.`);
      skippedCount++;
      continue;
    }

    if (row.image.startsWith('data:image/webp;base64,')) {
      console.log(`[#${row.id}] Already WebP (${(row.image.length / 1024).toFixed(1)} KB). Skipping.`);
      skippedCount++;
      continue;
    }

    console.log(`[#${row.id}] Converting image: ${row.image.slice(0, 70)}...`);
    try {
      const webpDataUrl = await optimizeImageToWebpDataUrl(row.image, 800, 75);
      if (webpDataUrl) {
        db.prepare('UPDATE news SET image = ? WHERE id = ?').run(webpDataUrl, row.id);
        const kbSize = (webpDataUrl.length / 1024).toFixed(1);
        console.log(`[#${row.id}] ✅ Successfully converted & updated in DB! Size: ${kbSize} KB`);
        convertedCount++;
      } else {
        console.warn(`[#${row.id}] ⚠️ Failed to convert image (null returned).`);
        errorCount++;
      }
    } catch (err: any) {
      console.error(`[#${row.id}] ❌ Error during conversion:`, err?.message || err);
      errorCount++;
    }
  }

  console.log('Syncing database...');
  syncDatabase();
  console.log(`--- Migration Complete: ${convertedCount} converted, ${skippedCount} skipped, ${errorCount} errors ---`);
}

migrateAllNewsImages()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Fatal error during migration:', e);
    process.exit(1);
  });
