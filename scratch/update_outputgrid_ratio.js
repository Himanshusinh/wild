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
    if (file.includes('OutputGrid.tsx')) return; // skip definition
    if (file.includes('WarliRightPanel.tsx')) return; // handled manually

    let modified = false;

    // Replace count={state.imageCount} with count={state.imageCount} ratio={state.ratio}
    const pattern1 = /count=\{state\.imageCount\}/g;
    if (content.match(pattern1)) {
        content = content.replace(pattern1, 'count={state.imageCount} ratio={state.ratio}');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated: ${path.relative(root, file)}`);
        count++;
    }
});

console.log(`Total files updated: ${count}`);
