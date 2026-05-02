import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';

const OUT_DIR = path.join(process.cwd(), 'public', 'images', 'mountains');
const MOUNTAINS_FILE = path.join(process.cwd(), 'src', 'data', 'mountains.ts');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Referer': 'https://ja.wikipedia.org/'
};

async function fetchWikipediaImage(searchQuery: string): Promise<string | null> {
  try {
    const res = await axios.get('https://ja.wikipedia.org/w/api.php', {
      params: {
        action: 'query',
        titles: searchQuery,
        prop: 'pageimages',
        format: 'json',
        pithumbsize: 1200
      },
      headers: HEADERS,
      timeout: 10000
    });

    const pages = res.data.query?.pages;
    if (!pages) return null;

    const pageId = Object.keys(pages)[0];
    if (pageId === '-1' || !pages[pageId].thumbnail) {
      return null;
    }

    return pages[pageId].thumbnail.source;
  } catch (error) {
    return null;
  }
}

async function downloadAndProcessImage(url: string, id: string): Promise<string | null> {
  const outFileName = `${id}.webp`;
  const outPath = path.join(OUT_DIR, outFileName);

  try {
    await fs.access(outPath);
    console.log(` ⏩ File already exists locally, skipping download.`);
    return `/images/mountains/${outFileName}`;
  } catch {
    // proceed to download
  }

  try {
    const response = await axios({
      url,
      responseType: 'arraybuffer',
      headers: HEADERS,
      timeout: 15000
    });

    const buffer = Buffer.from(response.data, 'binary');
    const outFileName = `${id}.webp`;
    const outPath = path.join(OUT_DIR, outFileName);

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
  let fileContent = await fs.readFile(MOUNTAINS_FILE, 'utf-8');
  
  // placeholder.webp が設定されている山を正規表現で抽出
  const regex = /id:\s*'([^']+)',\s*name:\s*'([^']+)',[\s\S]*?imageUrl:\s*'\/images\/mountains\/placeholder\.webp'/g;
  
  let match;
  const missingList = [];
  while ((match = regex.exec(fileContent)) !== null) {
    missingList.push({ id: match[1], name: match[2] });
  }

  console.log(`Found ${missingList.length} mountains with placeholder images.`);
  if (missingList.length === 0) {
    console.log('All images are already present!');
    return;
  }

  let successCount = 0;

  for (const mountain of missingList) {
    console.log(`Processing: ${mountain.name} (${mountain.id})...`);
    
    // 検索とダウンロード
    let imageUrl = await fetchWikipediaImage(mountain.name);
    
    // 山の名前で画像が出ない場合、名前に「山」や「岳」をつけてリトライするなどの工夫
    if (!imageUrl && !mountain.name.endsWith('山') && !mountain.name.endsWith('岳')) {
      imageUrl = await fetchWikipediaImage(mountain.name + '山');
    }

    if (imageUrl) {
      console.log(` -> Found URL: ${imageUrl.substring(0, 50)}...`);
      const localPath = await downloadAndProcessImage(imageUrl, mountain.id);

      if (localPath) {
        // mountains.ts を書き換える
        // 対象のIDブロック内にある placeholder.webp を localPath に置換する
        const blockRegex = new RegExp(`(id:\\s*'${mountain.id}',[\\s\\S]*?imageUrl:\\s*')\\/images\\/mountains\\/placeholder\\.webp(')`);
        fileContent = fileContent.replace(blockRegex, `$1${localPath}$2`);
        await fs.writeFile(MOUNTAINS_FILE, fileContent, 'utf-8');
        successCount++;
        console.log(` ✅ Success & Saved: ${mountain.name}`);
      }
    } else {
      console.log(` ⚠️ No image found on Wikipedia for ${mountain.name}`);
    }

    // APIリミット回避のための十分なウェイト (5秒)
    console.log(' -> Waiting 5 seconds...');
    await new Promise(r => setTimeout(r, 5000));
  }

  console.log(`\n🎉 Finished! Successfully replaced ${successCount}/${missingList.length} placeholder images.`);
}

main().catch(console.error);
