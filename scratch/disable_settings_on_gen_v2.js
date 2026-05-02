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

    // 1. Update ModelSelector
    if (content.includes('<ModelSelector')) {
        const modelPattern = /<ModelSelector([\s\S]*?)\/>/g;
        content = content.replace(modelPattern, (match, p1) => {
            if (p1.includes('disabled=')) return match;
            modified = true;
            return `<ModelSelector${p1} disabled={state.panelState === "loading"} />`;
        });
    }

    // 2. Update SettingsPanel
    if (content.includes('<SettingsPanel')) {
        const settingsPattern = /<SettingsPanel([\s\S]*?)\/>/g;
        content = content.replace(settingsPattern, (match, p1) => {
            if (p1.includes('disabled=')) return match;
            modified = true;
            return `<SettingsPanel${p1} disabled={state.panelState === "loading"} />`;
        });
    }

    // 3. Ensure Generate button is disabled
    const generateBtnPattern = /<button\s+([^>]*?onClick=\{\(\)\s*=>\s*void\s+handleGenerate\(\)\}[^>]*?)>/g;
    content = content.replace(generateBtnPattern, (match, p1) => {
        if (p1.includes('disabled=')) return match;
        modified = true;
        return `<button ${p1.trim()} disabled={state.panelState === "loading"}>`;
    });

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated: ${path.relative(root, file)}`);
        count++;
    }
});

console.log(`Total files updated: ${count}`);
