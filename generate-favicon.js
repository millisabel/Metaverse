const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 48];
const svgPath = path.join(__dirname, 'src/assets/images/svg/Logo.svg');
const outputPath = path.join(__dirname, 'favicon.ico');

async function generateIco() {
  try {
    console.log('Reading SVG file...');
    const inputBuffer = fs.readFileSync(svgPath);
    
    // Create buffers for each size
    const promises = sizes.map(size => 
      sharp(inputBuffer)
        .resize(size, size)
        .png()
        .toBuffer()
    );
    
    console.log('Processing image...');
    const buffers = await Promise.all(promises);
    
    // Write a single PNG file (32x32) as fallback
    console.log('Writing favicon...');
    await sharp(buffers[1]).toFile(outputPath);
    
    console.log('Favicon generated successfully!');
  } catch (error) {
    console.error('Error generating favicon:', error);
  }
}

generateIco(); 