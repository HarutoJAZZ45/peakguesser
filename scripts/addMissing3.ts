import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';

const missing3 = [
  { id: 'tomuraushi', name: 'トムラウシ山', nameEn: 'Mt. Tomuraushi', elevation: 2141, location: '北海道', description: '大雪山の奥地にそびえる「大雪山の奥座敷」。' },
  { id: 'kusatsushirane', name: '草津白根山', nameEn: 'Mt. Kusatsu-Shirane', elevation: 2160, location: '群馬県', description: 'エメラルドグリーンの美しい湯釜を持つ活火山。' },
  { id: 'yakushi', name: '薬師岳', nameEn: 'Mt. Yakushi', elevation: 2926, location: '富山県', description: '北アルプス中部の雄大な山容を持つ名峰。' }
];

const OUT_DIR = path.join(process.cwd(), 'public', 'images', 'mountains');
const MOUNTAINS_FILE = path.join(process.cwd(), 'src', 'data', 'mountains.ts');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
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

async function downloadAndProcessImage(url: string, id: string): Promise<string | null> {
  try {
    const response = await axios({ url, responseType: 'arraybuffer', headers: HEADERS, timeout: 15000 });
    const outPath = path.join(OUT_DIR, `${id}.webp`);
    await sharp(Buffer.from(response.data)).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 80 }).toFile(outPath);
    return `/images/mountains/${id}.webp`;
  } catch (error: any) {
    console.error(`❌ Failed:`, error.message);
    return null;
  }
}

async function main() {
  let fileContent = await fs.readFile(MOUNTAINS_FILE, 'utf-8');
  let newMountainsText = '';

  for (const mountain of missing3) {
    console.log(`Processing: ${mountain.name}...`);
    let imageUrl = await fetchWikipediaImage(mountain.name);
    let localPath = '/images/mountains/placeholder.webp';

    if (imageUrl) {
      const downloaded = await downloadAndProcessImage(imageUrl, mountain.id);
      if (downloaded) localPath = downloaded;
    }

    newMountainsText += `
  {
    id: '${mountain.id}',
    name: '${mountain.name}',
    nameEn: '${mountain.nameEn}',
    elevation: ${mountain.elevation},
    location: '${mountain.location}',
    description: '${mountain.description}',
    imageUrl: '${localPath}',
    imageCredit: '${localPath.includes('placeholder') ? 'Unknown' : 'Wikimedia Commons'}',
  },`;
    
    await new Promise(r => setTimeout(r, 2000));
  }

  // 挿入処理
  const optionsIndex = fileContent.indexOf('export function generateOptions');
  const insertionIndex = fileContent.lastIndexOf('];', optionsIndex);
  
  if (insertionIndex !== -1) {
    const updatedContent = fileContent.slice(0, insertionIndex) + newMountainsText + '\n' + fileContent.slice(insertionIndex);
    await fs.writeFile(MOUNTAINS_FILE, updatedContent, 'utf-8');
    console.log(`✅ Added 3 missing mountains!`);
  } else {
    console.error('❌ Insertion point not found.');
  }
}

main().catch(console.error);
