const fs = require('fs');

const filePath = 'c:/Users/wildm/Desktop/WILDMIND AI AFTER RAJDEEP/wild/src/app/blog/components/BlogPostDetail.tsx';
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
let mapCount = 0;
let renderConclusionCount = 0;

console.log('--- Map Usages ---');
lines.forEach((line, index) => {
    if (line.includes('.map(')) {
        console.log(`Line ${index + 1}: ${line.trim()}`);
        mapCount++;
    }
    if (line.includes('renderConclusionWithLinks')) {
        console.log(`Line ${index + 1} (usage check): ${line.trim()}`);
        renderConclusionCount++;
    }
});

console.log(`\nTotal map usages found: ${mapCount}`);
console.log(`Total renderConclusionWithLinks occurrences: ${renderConclusionCount}`);
