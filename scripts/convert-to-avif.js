const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..', 'public', 'HomePage', 'creativeStyle');
const NEXT_STYLES_DIR = path.join(ROOT_DIR, 'Next Styles Images');
const NEXT_STYLES_DIR_NEW = path.join(ROOT_DIR, 'next-styles-images');

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

async function processDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        console.log(`Directory not found: ${dirPath}`);
        return;
    }

    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            if (file === 'Next Styles Images' || file === 'next-styles-images') continue;
            await processDirectory(filePath);
            continue;
        }

        const ext = path.extname(file).toLowerCase();
        if (!['.png', '.jpg', '.jpeg', '.avif'].includes(ext)) {
            continue;
        }

        const baseName = path.basename(file, ext);
        const slugName = slugify(baseName);
        const newFileName = `${slugName}.avif`;
        const newFilePath = path.join(dirPath, newFileName);

        // CASE 1: Already AVIF and already slugified (exact match)
        if (ext === '.avif' && file === newFileName) {
            console.log(`  Skipping already processed: ${file}`);
            continue;
        }

        // CASE 2: Already AVIF but needs case-only change (e.g. AJRAKH.avif -> ajrakh.avif)
        if (ext === '.avif' && file.toLowerCase() === newFileName.toLowerCase()) {
            console.log(`  Renaming (case-only): ${file} -> ${newFileName}`);
            const tempPath = path.join(dirPath, `temp_${Date.now()}_${file}`);
            fs.renameSync(filePath, tempPath);
            fs.renameSync(tempPath, newFilePath);
            continue;
        }

        console.log(`Processing: ${file} -> ${newFileName}`);

        try {
            const info = await sharp(filePath)
                .avif({ quality: 65 })
                .toFile(newFilePath);

            console.log(`  Success: ${newFileName} (${info.size} bytes)`);

            // Delete original ONLY if it was a different filename/extension
            // On Windows, AJRAKH.png and ajrakh.avif are different, so this is safe.
            if (filePath.toLowerCase() !== newFilePath.toLowerCase()) {
                fs.unlinkSync(filePath);
                console.log(`  Deleted original: ${file}`);
            }
        } catch (err) {
            console.error(`  [!] Error processing ${file}:`, err.message);
        }
    }
}

async function main() {
    // 1. Rename the subdirectory first if it exists with spaces
    if (fs.existsSync(NEXT_STYLES_DIR)) {
        if (!fs.existsSync(NEXT_STYLES_DIR_NEW)) {
            console.log('Renaming "Next Styles Images" to "next-styles-images"...');
            fs.renameSync(NEXT_STYLES_DIR, NEXT_STYLES_DIR_NEW);
        } else {
            console.log('"next-styles-images" already exists. Moving files from "Next Styles Images"...');
            const files = fs.readdirSync(NEXT_STYLES_DIR);
            for (const file of files) {
                fs.renameSync(path.join(NEXT_STYLES_DIR, file), path.join(NEXT_STYLES_DIR_NEW, file));
            }
            fs.rmdirSync(NEXT_STYLES_DIR);
        }
    }

    // 2. Process root directory (creativeStyle)
    console.log('Processing root directory...');
    await processDirectory(ROOT_DIR);

    // 3. Process the subdirectory (next-styles-images)
    console.log('Processing next-styles-images directory...');
    await processDirectory(NEXT_STYLES_DIR_NEW);

    console.log('All images processed and optimized!');
}

main().catch(console.error);
