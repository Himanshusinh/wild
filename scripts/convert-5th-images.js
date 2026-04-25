const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..', 'public', 'HomePage', 'creativeStyle');
const SRC_DIR = path.join(ROOT_DIR, '5th images');
const DEST_DIR = path.join(ROOT_DIR, '5th-images');

// Ensure destination directory exists
if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
}

// Function to slugify filename
function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[\u2013\u2014]/g, '-') // Convert en-dash and em-dash to hyphen
        .replace(/[^\w\s-]/g, '') // Remove other special characters
        .replace(/[\s\-_]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

async function processDirectory() {
    if (!fs.existsSync(SRC_DIR)) {
        console.log(`Directory not found: ${SRC_DIR}`);
        return;
    }

    const files = fs.readdirSync(SRC_DIR);

    for (const file of files) {
        const filePath = path.join(SRC_DIR, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) continue;

        const ext = path.extname(file).toLowerCase();
        if (!['.png', '.jpg', '.jpeg'].includes(ext)) {
            continue;
        }

        const baseName = path.basename(file, ext);
        const slugName = slugify(baseName);
        const newFileName = `${slugName}.avif`;
        const newFilePath = path.join(DEST_DIR, newFileName);

        console.log(`Processing: ${file} -> ${newFileName}`);

        try {
            const info = await sharp(filePath)
                .avif({ quality: 65 })
                .toFile(newFilePath);

            console.log(`  Success: ${newFileName} (${info.size} bytes)`);
        } catch (err) {
            console.error(`  [!] Error processing ${file}:`, err.message);
        }
    }
}

async function main() {
    console.log(`Converting images from "${SRC_DIR}" to "${DEST_DIR}"...`);
    await processDirectory();
    console.log('All images processed and optimized!');
}

main().catch(console.error);
