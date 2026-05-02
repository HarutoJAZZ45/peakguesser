import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

async function main() {
  const outDir = path.join(process.cwd(), 'public', 'images', 'mountains');
  await fs.mkdir(outDir, { recursive: true });
  
  const outPath = path.join(outDir, 'placeholder.webp');

  // SVGテキストを作成（"NO IMAGE"）
  const svgText = `
    <svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#1a1a2e" />
      <text x="50%" y="50%" font-family="sans-serif" font-size="60" fill="#f0ece2" text-anchor="middle" dominant-baseline="middle">NO IMAGE</text>
      <text x="50%" y="60%" font-family="sans-serif" font-size="30" fill="#c84b31" text-anchor="middle" dominant-baseline="middle">PeakGuesser</text>
    </svg>
  `;

  await sharp(Buffer.from(svgText))
    .webp({ quality: 80 })
    .toFile(outPath);
    
  console.log('Created placeholder.webp');
}

main().catch(console.error);
