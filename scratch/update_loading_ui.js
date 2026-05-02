const fs = require('fs');
const path = require('path');

const root = 'c:\\Users\\chauh\\OneDrive\\Desktop\\wild mind\\wmnew\\wild\\src\\components';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(root);
let count = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('Logo.gif')) return;

    let modified = false;

    // Pattern 1: Background and Border (flexible spacing)
    // Looking for the specific className used for the loading slot
    const bgPattern = /className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-white\/\[0\.06\] bg-\[#111117\]"/g;
    if (bgPattern.test(content)) {
        content = content.replace(bgPattern, 'className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-transparent"');
        modified = true;
    }

    // Pattern 2: Generating text (flexible wording)
    const textPattern = /<p className="text-\[11px\] text-white\/20">Generating.*?<\/p>/g;
    if (textPattern.test(content)) {
        content = content.replace(textPattern, '');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated: ${path.relative(root, file)}`);
        count++;
    }
});

console.log(`Total files updated: ${count}`);
