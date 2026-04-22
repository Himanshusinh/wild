const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const pdfDir = "c:\\Users\\asus\\Desktop\\wildmindai\\wild\\pdf_content\\Next styles";
const results = {};

async function extract() {
    const files = fs.readdirSync(pdfDir).filter(f => f.endsWith('.pdf'));
    for (const file of files) {
        console.log(`Extracting ${file}...`);
        const filePath = path.join(pdfDir, file);
        try {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            results[file] = data.text;
        } catch (err) {
            console.error(`Error extracting ${file}:`, err);
        }
    }
    fs.writeFileSync('scratch/all_detected_styles_text.json', JSON.stringify(results, null, 2));
    console.log("Done!");
}

extract().catch(console.error);
