import axios from 'axios';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const OUT_DIR = path.join(process.cwd(), 'public', 'images', 'mountains');
const MOUNTAINS_FILE = path.join(process.cwd(), 'src', 'data', 'mountains.ts');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
  'Referer': 'https://ja.wikipedia.org/'
};

async function fetchWikipediaImage(searchQuery: string): Promise<string | null> {
  try {
    const res = await axios.get('https://ja.wikipedia.org/w/api.php', {
      params: { action: 'query', titles: searchQuery, prop: 'pageimages', format: 'json', pithumbsize: 1200 },
      headers: HEADERS, timeout: 10000
    });
    const pages = res.data.query?.pages;
    if (!pages) return null;
    const pageId = Object.keys(pages)[0];
    if (pageId === '-1' || !pages[pageId].thumbnail) return null;
    return pages[pageId].thumbnail.source;
  } catch (error) { return null; }
}

async function main() {
  const mountainId = 'yakushi';
  const mountainName = '薬師岳';
  
  console.log(`Fetching image URL for ${mountainName}...`);
  const imageUrl = await fetchWikipediaImage(mountainName);
  
  if (!imageUrl) {
    console.log('❌ Could not find image URL via API.');
    return;
  }
  
  console.log(`Found URL: ${imageUrl}`);
  console.log('Downloading...');

  try {
    const response = await axios({ url: imageUrl, responseType: 'arraybuffer', headers: HEADERS, timeout: 15000 });
    const outPath = path.join(OUT_DIR, `${mountainId}.webp`);
    
    await sharp(Buffer.from(response.data))
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outPath);
      
    console.log(`✅ Saved image to ${outPath}`);

    // mountains.ts を置換
    let fileContent = await fs.readFile(MOUNTAINS_FILE, 'utf-8');
    const blockRegex = new RegExp(`(id:\\s*'${mountainId}',[\\s\\S]*?imageUrl:\\s*')\\/images\\/mountains\\/placeholder\\.webp(')`);
    
    if (blockRegex.test(fileContent)) {
      fileContent = fileContent.replace(blockRegex, `$1/images/mountains/${mountainId}.webp$2`);
      await fs.writeFile(MOUNTAINS_FILE, fileContent, 'utf-8');
      console.log(`✅ Updated mountains.ts successfully!`);
    } else {
      console.log(`⚠️ Could not find placeholder text for ${mountainId} in mountains.ts`);
    }
  } catch (error: any) {
    console.error(`❌ Failed to download or process image:`, error.message);
  }
}

main().catch(console.error);
