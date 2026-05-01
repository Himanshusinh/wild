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

    // Pattern to find the broken loading state block (2 closing divs instead of 3)
    const brokenLoadingPattern = /\{state\.panelState === "loading" \? \(\s*<div className="p-5">\s*<div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">([\s\S]*?)<\/div>\s*<\/div>\s*\) : null\}/g;
    
    if (brokenLoadingPattern.test(content)) {
        content = content.replace(brokenLoadingPattern, (match, inner) => {
            // Reconstruct the block with the missing 3rd closing div
            return `{state.panelState === "loading" ? (
                <div className="p-5">
                  <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">${inner}</div>
                </div>
              </div>
            ) : null}`;
        });
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Fixed: ${path.relative(root, file)}`);
        count++;
    }
});

console.log(`Total files fixed: ${count}`);
