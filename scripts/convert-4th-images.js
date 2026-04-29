const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../public/HomePage/creativeStyle/4th images');
const dst = path.join(__dirname, '../public/HomePage/creativeStyle/4th-images');

if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });

const files = fs.readdirSync(src).filter(f => /\.(png|jpg|jpeg)$/i.test(f));
console.log(`Converting ${files.length} files from:\n  ${src}\nto:\n  ${dst}\n`);

async function convertAll() {
  for (const f of files) {
    const slug = f
      .replace(/\.(png|jpg|jpeg)$/i, '')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');
    const out = path.join(dst, slug + '.avif');
    
    if (fs.existsSync(out)) {
      console.log(`  - Skipping existing: ${slug}.avif`);
      continue;
    }

    console.log(`Converting: "${f}" → "${slug}.avif"`);
    try {
      const info = await sharp(path.join(src, f))
        .avif({ quality: 75 })
        .toFile(out);
      console.log(`  ✓ ${slug}.avif (${(info.size/1024).toFixed(0)} KB)`);
    } catch (err) {
      console.error(`  ✗ ${f}: ${err.message}`);
    }
  }
  console.log('\nAll done!');
}

convertAll();
