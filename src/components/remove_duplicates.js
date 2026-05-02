const fs = require('fs');
const path = require('path');

const rootDir = process.argv[2];

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (file.endsWith('Modal.tsx')) {
            processFile(fullPath);
        }
    }
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    const tags = ['textarea', 'input', 'button', 'ModeToggle', 'SceneInput', 'UploadZone', 'ModelSelector', 'SettingsPanel'];
    
    tags.forEach(tag => {
        let index = 0;
        const searchTag = `<${tag}`;
        while ((index = content.indexOf(searchTag, index)) !== -1) {
            // Find end of tag
            let tagEnd = -1;
            let braceCount = 0;
            let inString = false;
            let stringChar = '';
            for (let i = index + searchTag.length; i < content.length; i++) {
                const char = content[i];
                if (inString) {
                    if (char === stringChar && content[i-1] !== '\\') inString = false;
                } else {
                    if (char === '"' || char === "'" || char === '`') {
                        inString = true;
                        stringChar = char;
                    } else if (char === '{') braceCount++;
                    else if (char === '}') braceCount--;
                    else if (char === '>' && braceCount === 0) {
                        tagEnd = i;
                        break;
                    }
                }
            }

            if (tagEnd !== -1) {
                let fullTag = content.substring(index, tagEnd + 1);
                let originalTag = fullTag;

                // Count disabled attributes
                // We use a regex that only matches attributes, not strings in className
                const disabledRegex = /\bdisabled=\{[\s\S]*?\}/g;
                const matches = fullTag.match(disabledRegex);
                
                if (matches && matches.length > 1) {
                    // Keep the first one, remove others
                    let first = true;
                    fullTag = fullTag.replace(disabledRegex, (m) => {
                        if (first) {
                            first = false;
                            return m;
                        }
                        return '';
                    });
                    
                    content = content.substring(0, index) + fullTag + content.substring(tagEnd + 1);
                    index += fullTag.length;
                } else {
                    index = tagEnd + 1;
                }
            } else {
                index += searchTag.length;
            }
        }
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Removed duplicates in: ${filePath}`);
    }
}

walk(rootDir);
