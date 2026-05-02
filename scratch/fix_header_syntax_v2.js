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

    // The script accidentally moved the closing } of ${} to the end of the template literal.
    // Original: className={`... ${ condition ? "a" : "b" }`}
    // Corrupted: className={`... ${ condition ? "a" : "b" disabled:opacity-50 disabled:cursor-not-allowed}`}
    
    // We want to move the } back to after the quote.
    
    if (content.includes('" disabled:opacity-50 disabled:cursor-not-allowed`}')) {
        content = content.replace(/" disabled:opacity-50 disabled:cursor-not-allowed`}/g, '"} disabled:opacity-50 disabled:cursor-not-allowed`');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Fixed: ${path.relative(root, file)}`);
        count++;
    }
});

console.log(`Total files fixed: ${count}`);
