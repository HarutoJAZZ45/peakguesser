import axios from 'axios';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

async function main() {
  const fileName = 'File:Mt._Yakushi_from_Mt._Tarou_2001-8-8.jpg';
  const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${fileName}&prop=imageinfo&iiprop=url&format=json`;
  
  try {
    const res = await axios.get(apiUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' } });
    const pages = res.data.query.pages;
    const pageId = Object.keys(pages)[0];
    const imageUrl = pages[pageId].imageinfo[0].url;

    console.log(`Downloading: ${imageUrl}`);
    const response = await axios({ url: imageUrl, responseType: 'arraybuffer', headers: { 'User-Agent': 'Mozilla/5.0' }});
    const outPath = path.join(process.cwd(), 'public', 'images', 'mountains', 'yakushi.webp');
    await sharp(Buffer.from(response.data)).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 80 }).toFile(outPath);
    
    let fileContent = await fs.readFile('src/data/mountains.ts', 'utf-8');
    fileContent = fileContent.replace(
      /(id:\s*'yakushi',[\s\S]*?imageUrl:\s*')\/images\/mountains\/placeholder\.webp(')/,
      '$1/images/mountains/yakushi.webp$2'
    );
    await fs.writeFile('src/data/mountains.ts', fileContent, 'utf-8');
    console.log('✅ Yakushi Done!');
  } catch(e: any) {
    console.error('❌ Failed:', e.message);
  }
}
main();
