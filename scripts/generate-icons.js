import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sourceLogo = path.resolve('public/LOGO.png');
const iconsDir = path.resolve('public/icons');
const splashDir = path.resolve('public/splash');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}
if (!fs.existsSync(splashDir)) {
  fs.mkdirSync(splashDir, { recursive: true });
}

async function generate() {
  console.log('Generating icons from LOGO.png...');

  // Standard square icons
  const iconSizes = [
    { name: 'favicon-16x16.png', size: 16, targetDir: iconsDir },
    { name: 'favicon-32x32.png', size: 32, targetDir: iconsDir },
    { name: 'apple-touch-icon.png', size: 180, targetDir: iconsDir },
    { name: 'icon-192.png', size: 192, targetDir: iconsDir },
    { name: 'icon-512.png', size: 512, targetDir: iconsDir },
    { name: 'favicon.png', size: 64, targetDir: path.resolve('public') },
    { name: 'apple-touch-icon.png', size: 180, targetDir: path.resolve('public') },
  ];

  for (const item of iconSizes) {
    const dest = path.join(item.targetDir, item.name);
    await sharp(sourceLogo)
      .resize(item.size, item.size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(dest);
    console.log(`Generated ${item.name} (${item.size}x${item.size})`);
  }

  // Maskable icons (with blue background #110195 and safe zone padding)
  const maskableSizes = [
    { name: 'icon-192-maskable.png', size: 192 },
    { name: 'icon-512-maskable.png', size: 512 }
  ];

  for (const item of maskableSizes) {
    const innerSize = Math.round(item.size * 0.75); // 75% safe area
    const logoBuffer = await sharp(sourceLogo)
      .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    const dest = path.join(iconsDir, item.name);
    await sharp({
      create: {
        width: item.size,
        height: item.size,
        channels: 4,
        background: { r: 17, g: 1, b: 149, alpha: 1 } // #110195
      }
    })
      .composite([{ input: logoBuffer, gravity: 'center' }])
      .png()
      .toFile(dest);
    console.log(`Generated maskable ${item.name} (${item.size}x${item.size})`);
  }

  // iOS Splash screens (Blue #110195 background with centered logo)
  const splashScreens = [
    { name: 'splash-640x1136.png', width: 640, height: 1136, logoSize: 220 },
    { name: 'splash-750x1334.png', width: 750, height: 1334, logoSize: 260 },
    { name: 'splash-1242x2208.png', width: 1242, height: 2208, logoSize: 380 },
    { name: 'splash-1125x2436.png', width: 1125, height: 2436, logoSize: 380 },
    { name: 'splash-828x1792.png', width: 828, height: 1792, logoSize: 320 },
    { name: 'splash-1242x2688.png', width: 1242, height: 2688, logoSize: 420 },
    { name: 'splash-1536x2048.png', width: 1536, height: 2048, logoSize: 460 },
  ];

  for (const s of splashScreens) {
    const logoBuffer = await sharp(sourceLogo)
      .resize(s.logoSize, s.logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    const dest = path.join(splashDir, s.name);
    await sharp({
      create: {
        width: s.width,
        height: s.height,
        channels: 4,
        background: { r: 17, g: 1, b: 149, alpha: 1 } // #110195 brand color
      }
    })
      .composite([{ input: logoBuffer, gravity: 'center' }])
      .png()
      .toFile(dest);
    console.log(`Generated splash ${s.name} (${s.width}x${s.height})`);
  }

  console.log('All icons and splash screens generated successfully!');
}

generate().catch(console.error);
