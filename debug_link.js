const fs = require('fs');

const content = fs.readFileSync('src/app/blog/components/BlogPostDetail.tsx', 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);
console.log('Line 5400:', lines[5399]); // 0-indexed
console.log('Line 5401:', lines[5400]);

if (lines[5399].includes('Link')) {
  console.log('Line 5400 contains "Link"');
} else {
  console.log('Line 5400 DOES NOT contain "Link"');
  // Print char codes
  for (let i = 0; i < lines[5399].length; i++) {
    console.log(lines[5399].charCodeAt(i));
  }
}
