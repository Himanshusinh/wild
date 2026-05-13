const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Converts images to AVIF format.
 * Usage: node convert.js path/to/image1.jpg [path/to/image2.png ...]
 */

async function convertImage(filePath) {
    try {
        const absolutePath = path.resolve(filePath);
        if (!fs.existsSync(absolutePath)) {
            console.error(`File not found: ${filePath}`);
            return;
        }

        const ext = path.extname(absolutePath);
        const fileName = path.basename(absolutePath, ext);
        const dirName = path.dirname(absolutePath);
        
        // Slugify filename for consistency (optional, but good practice in this project)
        const slugName = fileName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        const outputFileName = `${slugName}.avif`;
        const outputPath = path.join(dirName, outputFileName);

        console.log(`Converting: ${filePath} -> ${outputFileName}`);

        await sharp(absolutePath)
            .avif({ quality: 75 })
            .toFile(outputPath);

        console.log(`Successfully converted to ${outputPath}`);

        // Optional: Delete original if it's not already an avif with the same name
        if (absolutePath !== outputPath) {
            fs.unlinkSync(absolutePath);
            console.log(`Deleted original: ${filePath}`);
        }
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
    }
}

async function main() {
    const files = process.argv.slice(2);
    if (files.length === 0) {
        console.log("Usage: node convert.js <image_path1> <image_path2> ...");
        return;
    }

    for (const file of files) {
        await convertImage(file);
    }
}

main();
