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
    if (file.includes('OutputGrid.tsx')) return;
    if (file.includes('WarliRightPanel.tsx')) return;
    if (file.includes('TraditionalStyleModal.tsx')) return;

    let modified = false;

    // 1. Remove p-5 from main container
    const mainPattern = /className="flex flex-1 flex-col overflow-y-auto p-5/g;
    if (mainPattern.test(content)) {
        content = content.replace(mainPattern, 'className="flex flex-1 flex-col overflow-y-auto');
        modified = true;
    }

    // 2. Add padding wrapper to empty state
    const emptySearch = /\{state\.panelState === "empty" \? \(\s*<div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center">([\s\S]*?)<\/div>\s*\) : null\}/;
    const emptyMatch = content.match(emptySearch);
    if (emptyMatch) {
        const replacement = `{state.panelState === "empty" ? (
                <div className="p-5">
                  <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center">${emptyMatch[1]}</div>
                </div>
              ) : null}`;
        content = content.replace(emptySearch, replacement);
        modified = true;
    }

    // 3. Add padding wrapper to loading state
    const loadingSearch = /\{state\.panelState === "loading" \? \(\s*<div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">([\s\S]*?)<\/div>\s*<\/div>\s*\) : null\}/;
    const loadingMatch = content.match(loadingSearch);
    if (loadingMatch) {
        const replacement = `{state.panelState === "loading" ? (
                <div className="p-5">
                  <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">${loadingMatch[1]}</div>
                </div>
              ) : null}`;
        content = content.replace(loadingSearch, replacement);
        modified = true;
    }

    // 4. Update Results block: gap-4 to gap-0 and wrap PromptPreview
    const resultsSearch = /\{state\.panelState === "results" \? \(\s*<div className="flex flex-col gap-4">([\s\S]*?)<PromptPreview\s+prompt=\{assembledPrompt\}\s*\/>\s*<\/div>\s*\) : null\}/;
    const resultsMatch = content.match(resultsSearch);
    if (resultsMatch) {
        const replacement = `{state.panelState === "results" ? (
                <div className="flex flex-col gap-0">${resultsMatch[1]}<div className="px-5 py-5">
                    <PromptPreview prompt={assembledPrompt} />
                  </div>
                </div>
              ) : null}`;
        content = content.replace(resultsSearch, replacement);
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated: ${path.relative(root, file)}`);
        count++;
    }
});

console.log(`Total files updated: ${count}`);
