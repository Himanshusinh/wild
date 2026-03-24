const fs = require('fs');

const content = fs.readFileSync('src/app/blog/components/BlogPostDetail.tsx', 'utf8');
const lines = content.split('\n');

let count = 0;
lines.forEach((line, index) => {
  if (line.includes('<Link')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
    count++;
  }
});

console.log(`Total <Link> usages: ${count}`);
