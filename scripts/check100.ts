import fs from 'fs/promises';
import path from 'path';

async function main() {
  const filePath = path.join(process.cwd(), 'src', 'data', 'mountains.ts');
  const content = await fs.readFile(filePath, 'utf-8');

  // idの数をカウントして合計数を出す
  const idRegex = /id:\s*'([^']+)'/g;
  let match;
  const ids = [];
  while ((match = idRegex.exec(content)) !== null) {
    ids.push(match[1]);
  }

  console.log(`=================================`);
  console.log(`🏔 Total Mountains Count: ${ids.length}`);

  // 重複チェック
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    console.log(`⚠️ Warning: Duplicate IDs found! (Unique count: ${uniqueIds.size})`);
    
    // 重複しているIDを特定
    const counts = ids.reduce((acc, id) => {
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const duplicates = Object.keys(counts).filter(id => counts[id] > 1);
    console.log(`Duplicate IDs: ${duplicates.join(', ')}`);
  } else {
    console.log(`✅ No duplicate mountains found.`);
  }

  // プレースホルダーのチェック
  const placeholderRegex = /imageUrl:\s*'\/images\/mountains\/placeholder\.webp'/g;
  const placeholderCount = (content.match(placeholderRegex) || []).length;
  if (placeholderCount > 0) {
    console.log(`⚠️ Warning: Found ${placeholderCount} placeholder images!`);
  } else {
    console.log(`✅ All mountains have actual images (No placeholders).`);
  }
  console.log(`=================================`);
}

main().catch(console.error);
