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
    let modified = false;

    // Pattern to find the syntax error:
    // ${ ... " disabled:opacity-50 disabled:cursor-not-allowed`}
    // Note that the closing `}` is misplaced.
    
    const badPattern = /\$\{([^}]*?"[^}]*?)" disabled:opacity-50 disabled:cursor-not-allowed\}/g;
    if (badPattern.test(content)) {
        content = content.replace(badPattern, '${$1} disabled:opacity-50 disabled:cursor-not-allowed');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Fixed syntax in: ${path.relative(root, file)}`);
        count++;
    }
});

console.log(`Total files fixed: ${count}`);
