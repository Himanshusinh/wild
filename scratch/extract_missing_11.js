const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const pdfDir = 'C:\\Users\\Aryan_WILDMIND\\Desktop\\WILDMINDAI\\wild\\pdf_content\\5th';
const outputJson = 'C:\\Users\\Aryan_WILDMIND\\Desktop\\WILDMINDAI\\wild\\scratch\\missing_11_styles_text.json';

const targetFiles = [
  'Agra marble inlay - Uttar Pradesh.pdf',
  'Baluchari - West Bengal.pdf',
  'Bankura terracotta - West Bengal.pdf',
  'Basohli - Jammu.pdf',
  'cane, bamboo - Andaman & Nicobar.pdf',
  'Chandigarh modernist  - Chandigarh.pdf',
  'coastal fiber - Lakshadweep.pdf',
  'coconut-shell - Andaman & Nicobar.pdf',
  'coir craft - Lakshadweep.pdf',
  'Dhaniakhali - West Bengal.pdf',
  'Franco-Tamil decorative environment - Puducherry.pdf'
];

async function extract() {
  const results = {};
  for (const fileName of targetFiles) {
    const filePath = path.join(pdfDir, fileName);
    if (fs.existsSync(filePath)) {
      console.log(`Extracting: ${fileName}`);
      try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        results[fileName] = data.text;
      } catch (err) {
        console.error(`Error reading ${fileName}:`, err);
      }
    } else {
      console.warn(`File not found: ${fileName}`);
    }
  }
  fs.writeFileSync(outputJson, JSON.stringify(results, null, 2));
  console.log('Extraction complete!');
}

extract();
