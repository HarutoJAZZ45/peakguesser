import axios from 'axios';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

async function main() {
  const fileName = 'File:13_Arakawadake_from_Shiomidake_2000-7-9.jpg';
  // CommonsのAPIを使用
  const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${fileName}&prop=imageinfo&iiprop=url&format=json`;

  try {
    const res = await axios.get(apiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' }
    });
    const pages = res.data.query.pages;
    const pageId = Object.keys(pages)[0];
    const imageUrl = pages[pageId].imageinfo[0].url;

    console.log(`Downloading from: ${imageUrl}`);

    const response = await axios({
      url: imageUrl,
      responseType: 'arraybuffer',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' }
    });

    const outPath = path.join(process.cwd(), 'public', 'images', 'mountains', 'arakawa.webp');
    await sharp(Buffer.from(response.data))
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outPath);
      
    console.log('✅ Successfully downloaded and saved arakawa.webp');
  } catch (error: any) {
    console.error('❌ Failed:', error.message);
  }
}

main();
