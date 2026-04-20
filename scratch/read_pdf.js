const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('C:\\\\Users\\\\asus\\\\Desktop\\\\wildmindai\\\\wild\\\\pdf_content\\\\Neo-Agrarian Brutalism - Haryana.pdf');

pdf(dataBuffer).then(function(data) {
    console.log(data.text);
}).catch(err => console.error(err));
