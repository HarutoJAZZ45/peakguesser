import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';
import { mountains } from '../src/data/mountains';

const OUT_DIR = path.join(process.cwd(), 'public', 'images', 'mountains');
const MOUNTAINS_FILE = path.join(process.cwd(), 'src', 'data', 'mountains.ts');

async function downloadAndProcessImage(url: string, id: string): Promise<string | null> {
  try {
    const response = await axios({
      url,
      responseType: 'arraybuffer',
      // Wikimedia Commons requests a User-Agent identifying the application
      headers: {
        'User-Agent': 'PeakGuesser/1.0 (https://github.com/haruto/peak-guesser)',
      }
    });

    const buffer = Buffer.from(response.data, 'binary');
    const outFileName = `${id}.webp`;
    const outPath = path.join(OUT_DIR, outFileName);

    // Resize to max 1200px width and convert to WebP
    await sharp(buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outPath);

    return `/images/mountains/${outFileName}`;
  } catch (error: any) {
    console.error(`❌ Failed to download [${id}] from ${url}:`, error.message);
    return null;
  }
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  let fileContent = await fs.readFile(MOUNTAINS_FILE, 'utf-8');
  let successCount = 0;
  let failCount = 0;

  for (const mountain of mountains) {
    if (mountain.imageUrl.startsWith('http')) {
      console.log(`Downloading: ${mountain.name} (${mountain.id})...`);
      // Wait a bit to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newUrl = await downloadAndProcessImage(mountain.imageUrl, mountain.id);
      
      if (newUrl) {
        // Replace the URL in the mountains.ts file
        fileContent = fileContent.replace(
          `imageUrl: '${mountain.imageUrl}'`,
          `imageUrl: '${newUrl}'`
        );
        successCount++;
      } else {
        failCount++;
      }
    } else {
      console.log(`Skipping: ${mountain.name} (${mountain.id}) - already local`);
    }
  }

  // Save the updated mountains.ts
  await fs.writeFile(MOUNTAINS_FILE, fileContent, 'utf-8');
  console.log(`\n✅ Done! Success: ${successCount}, Failed: ${failCount}`);
}

main().catch(console.error);
