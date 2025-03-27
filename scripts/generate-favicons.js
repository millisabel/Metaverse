const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 192, 512];
const inputFile = path.join(__dirname, '../src/assets/images/svg/Logo.svg');
const outputDir = path.join(__dirname, '../src/assets/images');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Generate favicons for different sizes
sizes.forEach(size => {
    const outputFile = size <= 32 
        ? path.join(outputDir, 'favicon.png')
        : path.join(outputDir, `favicon-${size}.png`);

    sharp(inputFile)
        .resize(size, size)
        .png()
        .toFile(outputFile)
        .then(() => {
            console.log(`Generated ${size}x${size} favicon`);
        })
        .catch(err => {
            console.error(`Error generating ${size}x${size} favicon:`, err);
        });
});

// Generate Apple Touch Icon (180x180)
sharp(inputFile)
    .resize(180, 180)
    .png()
    .toFile(path.join(outputDir, 'apple-touch-icon.png'))
    .then(() => {
        console.log('Generated Apple Touch Icon');
    })
    .catch(err => {
        console.error('Error generating Apple Touch Icon:', err);
    }); 