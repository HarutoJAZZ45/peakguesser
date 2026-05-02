import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';

// 既に登録済みの30山のIDリスト（重複登録を防ぐため）
const existingIds = new Set([
  'fuji', 'kitadake', 'hotaka', 'yari', 'tateyama', 'hakusan', 'asama', 'ontake', 'norikura', 'tsukuba',
  'tanigawa', 'daisetsu', 'rishiri', 'gassan', 'iwate', 'zao', 'myoko', 'kisokoma', 'tsurugi', 'bandai',
  'chokai', 'miyanoura', 'daisen', 'tokachi', 'nasu', 'shirane', 'aino', 'akaishi', 'ena', 'kirigamine'
]);

// 残りの70山データ
const missingMountains = [
  { id: 'rausu', name: '羅臼岳', nameEn: 'Mt. Rausu', elevation: 1661, location: '北海道', description: '知床半島の最高峰。ヒグマの高密度生息地。' },
  { id: 'shari', name: '斜里岳', nameEn: 'Mt. Shari', elevation: 1547, location: '北海道', description: 'アイヌ語で「葦の生えているところ」を意味する美しい山容。' },
  { id: 'akan', name: '阿寒岳', nameEn: 'Mt. Akan', elevation: 1499, location: '北海道', description: '阿寒カルデラにそびえる雌阿寒岳と雄阿寒岳の総称。' },
  { id: 'poroshiri', name: '幌尻岳', nameEn: 'Mt. Poroshiri', elevation: 2052, location: '北海道', description: '日高山脈の最高峰。アプローチが非常に長く険しい。' },
  { id: 'yotei', name: '羊蹄山', nameEn: 'Mt. Yotei', elevation: 1898, location: '北海道', description: '蝦夷富士と呼ばれる見事な成層火山。' },
  { id: 'iwaki', name: '岩木山', nameEn: 'Mt. Iwaki', elevation: 1625, location: '青森県', description: '津軽富士と呼ばれる独立峰。古くから信仰の山。' },
  { id: 'hakkoda', name: '八甲田山', nameEn: 'Mt. Hakkoda', elevation: 1585, location: '青森県', description: '湿原と高山植物が豊富な火山群。冬の樹氷でも有名。' },
  { id: 'hachimantai', name: '八幡平', nameEn: 'Hachimantai', elevation: 1614, location: '岩手県・秋田県', description: 'なだらかな高原地帯。無数の沼や湿原が広がる。' },
  { id: 'hayachine', name: '早池峰山', nameEn: 'Mt. Hayachine', elevation: 1917, location: '岩手県', description: '北上山地の最高峰。固有種ハヤチネウスユキソウが咲く。' },
  { id: 'asahi', name: '朝日岳', nameEn: 'Mt. Asahi', elevation: 1870, location: '山形県・新潟県', description: '朝日連峰の主峰。手つかずのブナ原生林が広がる。' },
  { id: 'iide', name: '飯豊山', nameEn: 'Mt. Iide', elevation: 2105, location: '山形県・福島県・新潟県', description: 'たおやかな稜線が続く「東北のアルプス」。' },
  { id: 'azuma', name: '吾妻山', nameEn: 'Mt. Azuma', elevation: 2035, location: '山形県・福島県', description: '火山湖の「魔女の瞳」が美しい火山群。' },
  { id: 'adatara', name: '安達太良山', nameEn: 'Mt. Adatara', elevation: 1700, location: '福島県', description: '高村光太郎の「智恵子抄」で「ほんとの空」と詠まれた山。' },
  { id: 'aizukoma', name: '会津駒ヶ岳', nameEn: 'Mt. Aizukoma', elevation: 2133, location: '福島県', description: '山頂に広大な湿原を持つたおやかな山。' },
  { id: 'echigokoma', name: '越後駒ヶ岳', nameEn: 'Mt. Echigokoma', elevation: 2003, location: '新潟県', description: '魚沼三山の一つ。雪深き険しい名峰。' },
  { id: 'hiragatake', name: '平ヶ岳', nameEn: 'Mt. Hiragatake', elevation: 2141, location: '新潟県・群馬県', description: '頂上付近に広大な平原と湿原が広がる。' },
  { id: 'makihatayama', name: '巻機山', nameEn: 'Mt. Makihata', elevation: 1967, location: '新潟県・群馬県', description: 'たおやかな山容と豊富な高山植物が魅力。' },
  { id: 'hiuchigatake', name: '燧ヶ岳', nameEn: 'Mt. Hiuchigatake', elevation: 2356, location: '福島県', description: '尾瀬ヶ原の北にそびえる東北以北の最高峰。' },
  { id: 'shibutsu', name: '至仏山', nameEn: 'Mt. Shibutsu', elevation: 2228, location: '群馬県', description: '尾瀬ヶ原の西に立つ蛇紋岩の山。固有種が多い。' },
  { id: 'hotaka_gunma', name: '武尊山', nameEn: 'Mt. Hotaka', elevation: 2158, location: '群馬県', description: '日本武尊（ヤマトタケル）伝説が残る修験の山。' },
  { id: 'akagi', name: '赤城山', nameEn: 'Mt. Akagi', elevation: 1828, location: '群馬県', description: '上毛三山の一つ。カルデラ湖の黒檜山が最高峰。' },
  { id: 'nantai', name: '男体山', nameEn: 'Mt. Nantai', elevation: 2486, location: '栃木県', description: '中禅寺湖の北にそびえる日光連山の主峰。' },
  { id: 'sukaisan', name: '皇海山', nameEn: 'Mt. Sukai', elevation: 2144, location: '栃木県・群馬県', description: '足尾山地の奥深くにある静かな秘峰。' },
  { id: 'naeba', name: '苗場山', nameEn: 'Mt. Naeba', elevation: 2145, location: '新潟県・長野県', description: '山頂に広大な湿原と無数の池塘を持つ。' },
  { id: 'amakazari', name: '雨飾山', nameEn: 'Mt. Amakazari', elevation: 1963, location: '新潟県・長野県', description: '双耳峰と「女神の横顔」と呼ばれる雪渓が有名。' },
  { id: 'takatsuma', name: '高妻山', nameEn: 'Mt. Takatsuma', elevation: 2353, location: '新潟県・長野県', description: '戸隠連峰の最高峰。ピラミッド型の鋭い山容。' },
  { id: 'hiuchi', name: '火打山', nameEn: 'Mt. Hiuchi', elevation: 2462, location: '新潟県', description: '頸城山塊の最高峰。高山植物とライチョウが生息。' },
  { id: 'azumaya', name: '四阿山', nameEn: 'Mt. Azumaya', elevation: 2354, location: '群馬県・長野県', description: 'なだらかな山容の火山。根子岳との縦走が人気。' },
  { id: 'shirouma', name: '白馬岳', nameEn: 'Mt. Shirouma', elevation: 2932, location: '長野県・富山県', description: '日本最大の雪渓「白馬大雪渓」とお花畑で有名。' },
  { id: 'goryu', name: '五竜岳', nameEn: 'Mt. Goryu', elevation: 2814, location: '富山県・長野県', description: 'ひし形の山容と「武田菱」の雪形が特徴的。' },
  { id: 'kashimayari', name: '鹿島槍ヶ岳', nameEn: 'Mt. Kashimayari', elevation: 2889, location: '富山県・長野県', description: '美しい双耳峰を持つ後立山連峰の盟主。' },
  { id: 'kurobegoro', name: '黒部五郎岳', nameEn: 'Mt. Kurobegoro', elevation: 2840, location: '富山県・岐阜県', description: '巨大なカール地形を持つ北アルプス最深部の名峰。' },
  { id: 'suisho', name: '水晶岳', nameEn: 'Mt. Suisho', elevation: 2986, location: '富山県', description: '別名・黒岳。かつて水晶が採掘された北アルプスの奥地。' },
  { id: 'washiba', name: '鷲羽岳', nameEn: 'Mt. Washiba', elevation: 2924, location: '富山県・長野県', description: '鷲が羽を広げたような山容と火口湖の鷲羽池が美しい。' },
  { id: 'jonen', name: '常念岳', nameEn: 'Mt. Jonen', elevation: 2857, location: '長野県', description: '安曇野から望むピラミッド型の山容が親しまれる。' },
  { id: 'kasagatake', name: '笠ヶ岳', nameEn: 'Mt. Kasagatake', elevation: 2898, location: '岐阜県', description: '笠を伏せたような特異な山容。飛騨山脈の独立峰。' },
  { id: 'yakedake', name: '焼岳', nameEn: 'Mt. Yakedake', elevation: 2455, location: '長野県・岐阜県', description: '上高地にそびえる活火山。大正池を形成した。' },
  { id: 'utsugi', name: '空木岳', nameEn: 'Mt. Utsugi', elevation: 2864, location: '長野県', description: '中央アルプス南部を代表する山。白い花崗岩が美しい。' },
  { id: 'utsukushigahara', name: '美ヶ原', nameEn: 'Utsukushigahara', elevation: 2034, location: '長野県', description: '広大な溶岩台地。放牧地ののどかな風景が広がる。' },
  { id: 'tateshina', name: '蓼科山', nameEn: 'Mt. Tateshina', elevation: 2531, location: '長野県', description: '諏訪富士とも呼ばれる美しい円錐形の火山。' },
  { id: 'yatsugatake', name: '八ヶ岳', nameEn: 'Yatsugatake', elevation: 2899, location: '山梨県・長野県', description: '最高峰の赤岳を中心に連なる火山群の総称。' },
  { id: 'ryokami', name: '両神山', nameEn: 'Mt. Ryokami', elevation: 1723, location: '埼玉県', description: 'ノコギリの歯のような険しい岩峰が続く修験の山。' },
  { id: 'kumotori', name: '雲取山', nameEn: 'Mt. Kumotori', elevation: 2017, location: '東京都・埼玉県・山梨県', description: '東京都の最高峰。奥秩父の展望台。' },
  { id: 'kobushi', name: '甲武信ヶ岳', nameEn: 'Mt. Kobushi', elevation: 2475, location: '埼玉県・山梨県・長野県', description: '千曲川、荒川、笛吹川の源流となる奥秩父の山。' },
  { id: 'kinpu', name: '金峰山', nameEn: 'Mt. Kinpu', elevation: 2599, location: '山梨県・長野県', description: '山頂に「五丈岩」と呼ばれる巨大な岩がそびえる。' },
  { id: 'mizugaki', name: '瑞牆山', nameEn: 'Mt. Mizugaki', elevation: 2230, location: '山梨県', description: '花崗岩の奇岩が林立する独特の景観を持つ。' },
  { id: 'daibosatsu', name: '大菩薩嶺', nameEn: 'Mt. Daibosatsu', elevation: 2057, location: '山梨県', description: 'なだらかな笹原から富士山を一望できる人気の山。' },
  { id: 'tanzawa', name: '丹沢山', nameEn: 'Mt. Tanzawa', elevation: 1567, location: '神奈川県', description: '首都圏に近く、ブナ林と富士山の眺望が美しい。' },
  { id: 'amagi', name: '天城山', nameEn: 'Mt. Amagi', elevation: 1406, location: '静岡県', description: '伊豆半島の最高峰。アマギシャクナゲなどの植物の宝庫。' },
  { id: 'kaikoma', name: '甲斐駒ヶ岳', nameEn: 'Mt. Kaikoma', elevation: 2967, location: '山梨県・長野県', description: '花崗岩の白砂が雪のように輝く南アルプスの急峻な山。' },
  { id: 'senjo', name: '仙丈ヶ岳', nameEn: 'Mt. Senjo', elevation: 3033, location: '山梨県・長野県', description: '南アルプスの女王。雄大な３つのカール地形を持つ。' },
  { id: 'houou', name: '鳳凰山', nameEn: 'Mt. Houou', elevation: 2841, location: '山梨県', description: '地蔵岳のオベリスク（尖塔状の岩）が特徴的。' },
  { id: 'shiomi', name: '塩見岳', nameEn: 'Mt. Shiomi', elevation: 3047, location: '長野県・静岡県', description: '南アルプスの中央に位置する鉄兜のようなドーム型の山。' },
  { id: 'arakawa', name: '悪沢岳', nameEn: 'Mt. Arakawa', elevation: 3141, location: '静岡県', description: '別名・荒川東岳。南アルプス南部の巨大な山塊の最高峰。' },
  { id: 'hijiri', name: '聖岳', nameEn: 'Mt. Hijiri', elevation: 3013, location: '長野県・静岡県', description: '南アルプス最南端の3000m峰。雄大でどっしりとした山容。' },
  { id: 'tekari', name: '光岳', nameEn: 'Mt. Tekari', elevation: 2592, location: '長野県・静岡県', description: '南アルプス最南端。ハイマツ帯の南限。' },
  { id: 'arashima', name: '荒島岳', nameEn: 'Mt. Arashima', elevation: 1523, location: '福井県', description: '大野盆地にそびえる大野富士。独立峰の風格を持つ。' },
  { id: 'ibuki', name: '伊吹山', nameEn: 'Mt. Ibuki', elevation: 1377, location: '滋賀県・岐阜県', description: 'お花畑と薬草で知られる滋賀県の最高峰。' },
  { id: 'odaigahara', name: '大台ヶ原山', nameEn: 'Odaigahara', elevation: 1695, location: '三重県・奈良県', description: '日本有数の多雨地帯。トウヒの枯木林や大蛇嵓の絶壁が有名。' },
  { id: 'omine', name: '大峰山', nameEn: 'Mt. Omine', elevation: 1915, location: '奈良県', description: '修験道の聖地であり、世界遺産「紀伊山地の霊場と参詣道」の一部。' },
  { id: 'tsurugi_shikoku', name: '剣山', nameEn: 'Mt. Tsurugi', elevation: 1955, location: '徳島県', description: '四国第二の高峰。なだらかな山頂部には平家の落人伝説が残る。' },
  { id: 'ishizuchi', name: '石鎚山', nameEn: 'Mt. Ishizuchi', elevation: 1982, location: '愛媛県', description: '西日本最高峰。鎖場が連続する修験道の山。' },
  { id: 'kuju', name: '九重山', nameEn: 'Mt. Kuju', elevation: 1791, location: '大分県', description: '九州本土最高峰の中岳を擁する火山群。ミヤマキリシマが美しい。' },
  { id: 'sobo', name: '祖母山', nameEn: 'Mt. Sobo', elevation: 1756, location: '大分県・宮崎県', description: '神武天皇の祖母を祀る伝説の山。アケボノツツジの名所。' },
  { id: 'aso', name: '阿蘇山', nameEn: 'Mt. Aso', elevation: 1592, location: '熊本県', description: '世界最大級のカルデラを持つ活火山。' },
  { id: 'kirishima', name: '霧島山', nameEn: 'Mt. Kirishima', elevation: 1700, location: '宮崎県・鹿児島県', description: '韓国岳を最高峰とする火山群。天孫降臨の神話が残る。' },
  { id: 'kaimon', name: '開聞岳', nameEn: 'Mt. Kaimon', elevation: 924, location: '鹿児島県', description: '薩摩富士と呼ばれる完全な円錐形の海に突き出た火山。' }
];

const OUT_DIR = path.join(process.cwd(), 'public', 'images', 'mountains');
const MOUNTAINS_FILE = path.join(process.cwd(), 'src', 'data', 'mountains.ts');

// Wikipedia APIを使用して対象の山の画像URLを検索する関数
async function fetchWikipediaImage(searchQuery: string): Promise<string | null> {
  try {
    const res = await axios.get('https://ja.wikipedia.org/w/api.php', {
      params: {
        action: 'query',
        titles: searchQuery,
        prop: 'pageimages',
        format: 'json',
        pithumbsize: 1200 // 取得する画像の最大幅
      },
      headers: { 'User-Agent': 'PeakGuesser/1.0' }
    });

    const pages = res.data.query?.pages;
    if (!pages) return null;

    const pageId = Object.keys(pages)[0];
    if (pageId === '-1' || !pages[pageId].thumbnail) {
      // 検索に失敗した場合のフォールバック
      return null;
    }

    return pages[pageId].thumbnail.source;
  } catch (error) {
    return null;
  }
}

async function downloadAndProcessImage(url: string, id: string): Promise<string> {
  const outFileName = `${id}.webp`;
  const outPath = path.join(OUT_DIR, outFileName);

  // 既にファイルが存在する場合はスキップ
  try {
    await fs.access(outPath);
    return `/images/mountains/${outFileName}`;
  } catch {
    // ファイルがない場合はそのまま処理続行
  }

  // URLがプレースホルダー用のダミーの場合はダウンロードしない
  if (url === 'PLACEHOLDER') {
    return '/images/mountains/placeholder.webp';
  }

  try {
    const response = await axios({
      url,
      responseType: 'arraybuffer',
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://ja.wikipedia.org/'
      }
    });

    const buffer = Buffer.from(response.data, 'binary');

    await sharp(buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outPath);

    return `/images/mountains/${outFileName}`;
  } catch (error: any) {
    console.error(`❌ Failed to download [${id}] from ${url}:`, error.message);
    return '/images/mountains/placeholder.webp';
  }
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  let successCount = 0;
  let failCount = 0;
  let newMountainsText = '';

  for (const mountain of missingMountains) {
    console.log(`Processing: ${mountain.name} (${mountain.id})...`);
    
    // Wikipedia API で画像URLを取得
    let imageUrl = await fetchWikipediaImage(mountain.name);
    
    if (!imageUrl) {
      console.warn(`⚠️ No image found for ${mountain.name} on Wikipedia. Using placeholder.`);
      imageUrl = 'PLACEHOLDER';
    }

    // 画像をローカルにダウンロードして最適化
    const localPath = await downloadAndProcessImage(imageUrl, mountain.id);

    // 新しい山のデータブロックを生成
    const entry = `
  {
    id: '${mountain.id}',
    name: '${mountain.name}',
    nameEn: '${mountain.nameEn}',
    elevation: ${mountain.elevation},
    location: '${mountain.location}',
    description: '${mountain.description}',
    imageUrl: '${localPath}',
    imageCredit: '${imageUrl === 'PLACEHOLDER' ? 'Unknown' : 'Wikimedia Commons'}',
  },`;
    newMountainsText += entry;
    successCount++;

    // APIリミット回避のためのウェイト（長めに設定）
    await new Promise(r => setTimeout(r, 4000));
  }

  // 既存の mountains.ts に生成したデータを追記する処理
  const fileContent = await fs.readFile(MOUNTAINS_FILE, 'utf-8');
  // `generateOptions` 関数の前にある `];` を探す
  const optionsIndex = fileContent.indexOf('export function generateOptions');
  let insertionIndex = -1;
  if (optionsIndex !== -1) {
    insertionIndex = fileContent.lastIndexOf('];', optionsIndex);
  } else {
    insertionIndex = fileContent.lastIndexOf('];');
  }
  
  if (insertionIndex !== -1) {
    const updatedContent = fileContent.slice(0, insertionIndex) + newMountainsText + '\n' + fileContent.slice(insertionIndex);
    await fs.writeFile(MOUNTAINS_FILE, updatedContent, 'utf-8');
    console.log(`\n✅ Done! Data added to mountains.ts`);
  } else {
    console.error('❌ Could not find "];" in mountains.ts to insert data.');
  }

  console.log(`✅ Success: ${successCount}, Failed: ${failCount}`);
}

main().catch(console.error);
