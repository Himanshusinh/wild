const fs = require('fs');
const path = require('path');

const root = 'c:\\Users\\chauh\\OneDrive\\Desktop\\wild mind\\wmnew\\wild\\src\\components';

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx')) {
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
    if (!content.includes('OutputGrid')) return;

    let modified = false;

    // Pattern to find the over-closed loading state block (4 closing divs instead of 3)
    const overClosedPattern = /<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\) : null\}/g;
    
    if (overClosedPattern.test(content)) {
        content = content.replace(overClosedPattern, '</div>\n                </div>\n              </div>\n            ) : null}');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Fixed Over-close: ${path.relative(root, file)}`);
        count++;
    }
});

console.log(`Total files fixed: ${count}`);
