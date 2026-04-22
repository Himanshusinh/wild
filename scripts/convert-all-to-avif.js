const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const MAPPING_FILE = path.join(__dirname, 'mapping.json');

// Function to slugify text
function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s\-_]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

const mapping = {};

async function walk(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            // Slugify directory names too if they have spaces or special chars
            const slugDirName = slugify(file);
            let nextPath = fullPath;
            if (slugDirName !== file) {
                const targetDirPath = path.join(dir, slugDirName);
                console.log(`Renaming directory: ${file} -> ${slugDirName}`);
                fs.renameSync(fullPath, targetDirPath);
                nextPath = targetDirPath;
            }
            await walk(nextPath);
            continue;
        }
        
        const ext = path.extname(file).toLowerCase();
        if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
            continue;
        }
        
        const baseName = path.basename(file, ext);
        const slugName = slugify(baseName);
        const newFileName = `${slugName}.avif`;
        const newPath = path.join(dir, newFileName);
        
        // Record mapping for code updates (relative to public/)
        const relativeOld = path.relative(PUBLIC_DIR, fullPath).replace(/\\/g, '/');
        const relativeNew = path.relative(PUBLIC_DIR, newPath).replace(/\\/g, '/');
        mapping[relativeOld] = relativeNew;
        
        if (fullPath === newPath && ext === '.avif') {
            console.log(`Skipping: ${relativeOld}`);
            continue;
        }
        
        console.log(`Converting: ${relativeOld} -> ${relativeNew}`);
        
        try {
            await sharp(fullPath)
                .avif({ quality: 70 })
                .toFile(newPath);
            
            // Delete original
            if (fullPath !== newPath) {
                fs.unlinkSync(fullPath);
            }
        } catch (err) {
            console.error(`Error converting ${relativeOld}:`, err.message);
        }
    }
}

async function main() {
    console.log('Starting project-wide AVIF conversion...');
    await walk(PUBLIC_DIR);
    
    fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2));
    console.log(`Conversion complete. Mapping saved to ${MAPPING_FILE}`);
}

main().catch(console.error);
