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
const headerFiles = files.filter(f => f.endsWith('Header.tsx'));
const modalFiles = files.filter(f => f.endsWith('Modal.tsx') || f.endsWith('Panel.tsx'));

// 1. Update Headers
headerFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Add disabled to interface
    if (content.includes('interface') && content.includes('Props') && !content.includes('disabled?: boolean')) {
        content = content.replace(/(interface\s+\w+Props\s*\{[\s\S]*?)(\})/, '$1  disabled?: boolean;\n$2');
        modified = true;
    }

    // Add disabled to component arguments
    const componentName = path.basename(file, '.tsx');
    const compRegex = new RegExp(`(export\\s+function\\s+${componentName}\\s*\\(\\{[\\s\\S]*?)(\\}\\s*:\\s*\\w+Props\\))`);
    if (compRegex.test(content)) {
        content = content.replace(compRegex, (match, p1, p2) => {
            if (p1.includes('disabled')) return match;
            return `${p1.trimEnd()}, disabled ${p2}`;
        });
        modified = true;
    }

    // Add disabled to buttons
    if (content.includes('onClick={() => onStyleChange')) {
        content = content.replace(/<button([\s\S]*?)onClick=\{\(\)\s*=>\s*onStyleChange\([\s\S]*?\) /g, (match) => {
            if (match.includes('disabled=')) return match;
            return match.replace('<button', '<button disabled={disabled} ');
        });
        // Also fix the className for disabled state
        content = content.replace(/className={`([\s\S]*?)}`/g, (match, p1) => {
            if (p1.includes('disabled:opacity-50')) return match;
            return `className={\`${p1.trimEnd()} disabled:opacity-50 disabled:cursor-not-allowed\`}`;
        });
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated Header: ${path.relative(root, file)}`);
    }
});

// 2. Update Modals/Panels to pass disabled to Header
modalFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Look for style-specific header usage
    // e.g. <TraditionalHeader ... />
    const headerUsageRegex = /<([A-Z]\w+Header)([\s\S]*?)\/>/g;
    content = content.replace(headerUsageRegex, (match, headerName, props) => {
        if (props.includes('disabled=')) return match;
        modified = true;
        return `<${headerName}${props.trimEnd()}\n          disabled={state.panelState === "loading"} />`;
    });

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated Modal/Panel: ${path.relative(root, file)}`);
    }
});
