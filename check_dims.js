
const sizeOf = require('image-size');

const files = [
  './public/remove-element-before.jpg',
  './public/remove-element-after.jpg'
];

files.forEach(file => {
  try {
    const dimensions = sizeOf(file);
    console.log(`${file}: ${dimensions.width}x${dimensions.height}`);
  } catch (err) {
    console.log(`Error reading ${file}: ${err.message}`);
  }
});
