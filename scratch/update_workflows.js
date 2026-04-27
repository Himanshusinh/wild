const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('src/app/view/workflows/components/data.js', 'utf8');

const cleanedContent = content.replace(/export const CATEGORIES[^\n]*\n/, '').replace('export const WORKFLOWS_DATA =', 'global.WORKFLOWS_DATA =');

eval(cleanedContent);

function walkSync(dir, filelist = []) {
  if (!fs.existsSync(dir)) return filelist;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);
    if (dirent.isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.tsx') || dirFile.endsWith('.jsx')) {
        filelist.push(dirFile);
      }
    }
  }
  return filelist;
}

const files = walkSync('src/app/view/workflows/(categories)');
let modifiedCount = 0;

for (const file of files) {
  let fileContent = fs.readFileSync(file, 'utf8');
  
  const idMatch = fileContent.match(/id:\s*["']([^"']+)["']/);
  if (!idMatch) continue;
  
  const id = idMatch[1];
  const wData = global.WORKFLOWS_DATA.find(w => w.id === id);
  if (!wData) continue;
  
  const beforeImage = wData.sampleBefore || '';
  const afterImage = wData.sampleAfter || '';
  const imageFit = wData.imageFit || 'object-contain';
  const imagePosition = wData.imagePosition || 'object-center';
  
  const originalContent = fileContent;
  
  // Replace beforeImage safely across potentially multiline strings
  fileContent = fileContent.replace(/beforeImage=["'][^"']*["']/, `beforeImage="${beforeImage}"`);
  // Replace afterImage
  fileContent = fileContent.replace(/afterImage=["'][^"']*["']/, `afterImage="${afterImage}"`);
  
  // For ProductPhotography, there is also sampleBeforeReference. Wait, does it use ImageComparisonSlider or something else?
  // Let's stick to ImageComparisonSlider properties first.
  
  // Replace or inject imageFit
  if (fileContent.includes('imageFit=')) {
    fileContent = fileContent.replace(/imageFit=["'][^"']*["']/, `imageFit="${imageFit}"`);
  } else {
    fileContent = fileContent.replace(/(<ImageComparisonSlider[^>]*?)\s*\/>/g, `$1\n                    imageFit="${imageFit}"\n                  />`);
  }
  
  // Replace or inject imagePosition
  if (fileContent.includes('imagePosition=')) {
    fileContent = fileContent.replace(/imagePosition=["'][^"']*["']/, `imagePosition="${imagePosition}"`);
  } else {
    fileContent = fileContent.replace(/(<ImageComparisonSlider[^>]*?)\s*\/>/g, `$1\n                    imagePosition="${imagePosition}"\n                  />`);
  }

  if (fileContent !== originalContent) {
    fs.writeFileSync(file, fileContent, 'utf8');
    console.log(`Updated ${file} (${id})`);
    modifiedCount++;
  }
}

console.log(`Modified ${modifiedCount} files.`);
