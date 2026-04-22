const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MAPPING_FILE = path.join(__dirname, 'mapping.json');
const SRC_DIR = path.join(__dirname, '..', 'src');

if (!fs.existsSync(MAPPING_FILE)) {
    console.error('Mapping file not found! Run convert-all-to-avif.js first.');
    process.exit(1);
}

const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));

// Function to walk through directory
function walk(dir, callback) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath, callback);
        } else {
            callback(fullPath);
        }
    });
}

const extensionsToUpdate = ['.tsx', '.ts', '.css', '.scss', '.js', '.jsx'];

function updateFile(filePath) {
    if (!extensionsToUpdate.includes(path.extname(filePath))) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    for (const [oldPath, newPath] of Object.entries(mapping)) {
        // We match various ways the path could be written:
        // 1. Literal match: "HomePage/Next Styles Images/PAITHANI.png"
        // 2. Path with leading slash: "/HomePage/Next Styles Images/PAITHANI.png"
        // 3. Just the filename? (Dangerous, skip for now. Focus on paths)
        
        const oldEscaped = oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(oldEscaped, 'g');
        
        if (regex.test(content)) {
            content = content.replace(regex, newPath);
            changed = true;
            console.log(`  Updated ${oldPath} -> ${newPath} in ${path.relative(SRC_DIR, filePath)}`);
        }
    }
    
    if (changed) {
        fs.writeFileSync(filePath, content);
    }
}

console.log('Updating code references...');
walk(SRC_DIR, updateFile);
console.log('Update complete!');
