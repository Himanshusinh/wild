const fs = require('fs');
const pdf = require('pdf-parse');

const pdfPath = "c:\\Users\\asus\\Desktop\\wildmindai\\wild\\pdf_content\\Next styles\\Ganjifa - Karnataka.pdf";
const dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function(data) {
    console.log(data.text);
}).catch(err => {
    console.error(err);
});
