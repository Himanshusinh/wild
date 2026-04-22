const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const pdfDir = "c:\\Users\\asus\\Desktop\\wildmindai\\wild\\pdf_content\\Next styles";
const files = [
    "Garo weaving - Meghalaya.pdf",
    "Gendered,ceremonial body-cloth branch- Nagaland.pdf",
    "Gond - Madhya Pradesh.pdf",
    "Hard-ornament branch - Nagaland.pdf",
    "Himroo - Maharashtra.pdf",
    "Hmaram — Mizoram.pdf",
    "Hoysala Relief - Karnataka.pdf",
    "Jaintia textile - Meghalaya.pdf",
    "Jhabua Adivasi Dolls- Madhya Pradesh.pdf"
];

const results = {};

async function extract() {
    for (const file of files) {
        console.log(`Extracting ${file}...`);
        const filePath = path.join(pdfDir, file);
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            continue;
        }
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        results[file] = data.text;
    }
    fs.writeFileSync('scratch/all_styles_text.json', JSON.stringify(results, null, 2));
    console.log("Done!");
}

extract().catch(console.error);
