const fs = require('fs');
const readline = require('readline');

const fileStream = fs.createReadStream('src/app/blog/components/BlogPostDetail.tsx');

const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

let lineNum = 0;
rl.on('line', (line) => {
  lineNum++;
  if (line.includes('Link')) {
    console.log(`${lineNum}: ${line.trim()}`);
  }
});
