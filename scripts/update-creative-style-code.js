const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'view', 'HomePage', 'compo', 'CreativeStyle.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Function to slugify filename
function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[\u2013\u2014]/g, '-') // Convert en-dash and em-dash to hyphen
        .replace(/[^\w\s-]/g, '') // Remove other special characters
        .replace(/[\s\-_]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Regex to find image paths
// Example: image: "/HomePage/creativeStyle/Next Styles Images/KATAB APPLIQUÉ.png",
const imageRegex = /image:\s*"(.*?)",/g;

content = content.replace(imageRegex, (match, p1) => {
    const parts = p1.split('/');
    const fileNameWithExt = parts.pop();
    const ext = path.extname(fileNameWithExt);
    const baseName = path.basename(fileNameWithExt, ext);
    
    const newBaseName = slugify(baseName);
    const newFileName = `${newBaseName}.avif`;
    
    // Update path parts
    const newParts = parts.map(part => {
        if (part === 'Next Styles Images') return 'next-styles-images';
        return part;
    });
    
    const newPath = [...newParts, newFileName].join('/');
    return `image: "${newPath}",`;
});

fs.writeFileSync(filePath, content);
console.log('CreativeStyle.tsx updated successfully!');
