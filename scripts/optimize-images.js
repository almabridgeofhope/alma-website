#!/usr/bin/env node

import { execSync } from 'child_process';
import { readdir, stat, mkdir } from 'fs/promises';
import { join, dirname, extname, basename } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Image optimization settings
const MAX_HERO_WIDTH = 1920; // Hero images (full width)
const MAX_CARD_WIDTH = 1200; // Card images (4/3 aspect)
const MAX_THUMBNAIL_WIDTH = 800; // Thumbnail images
const WEBP_QUALITY = 85; // WebP quality (0-100)

// Directories to process
const ASSETS_DIR = join(rootDir, 'src/assets');

// Helper function to check if file exists
async function fileExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

// Get image dimensions
function getImageDimensions(imagePath) {
  try {
    const output = execSync(`magick identify -format "%wx%h" "${imagePath}"`, { encoding: 'utf-8' });
    const [width, height] = output.trim().split('x').map(Number);
    return { width, height };
  } catch (error) {
    console.error(`Error getting dimensions for ${imagePath}:`, error.message);
    return null;
  }
}

// Optimize image: resize and convert to WebP
async function optimizeImage(inputPath, outputPath, maxWidth) {
  const ext = extname(inputPath).toLowerCase();
  const isPNG = ext === '.png';
  const isJPEG = ['.jpg', '.jpeg'].includes(ext);
  
  if (!isPNG && !isJPEG) {
    console.log(`Skipping ${inputPath} (not a PNG/JPEG)`);
    return false;
  }

  // Get original size
  const originalStats = await stat(inputPath);
  const originalSize = originalStats.size;
  
  // Get dimensions
  const dimensions = getImageDimensions(inputPath);
  if (!dimensions) {
    return false;
  }

  // Calculate new dimensions (maintain aspect ratio)
  let newWidth = dimensions.width;
  let newHeight = dimensions.height;
  
  if (dimensions.width > maxWidth) {
    newWidth = maxWidth;
    newHeight = Math.round((dimensions.height * maxWidth) / dimensions.width);
  }

  // Create output directory if it doesn't exist
  const outputDir = dirname(outputPath);
  await mkdir(outputDir, { recursive: true });

  try {
    // Step 1: Resize image (if needed)
    const tempPath = outputPath.replace('.webp', '_temp.jpg');
    
    if (dimensions.width > maxWidth) {
      execSync(
        `magick "${inputPath}" -resize ${newWidth}x${newHeight} -quality 90 "${tempPath}"`,
        { stdio: 'inherit' }
      );
    } else {
      execSync(
        `magick "${inputPath}" -quality 90 "${tempPath}"`,
        { stdio: 'inherit' }
      );
    }

    // Step 2: Convert to WebP
    execSync(
      `cwebp -q ${WEBP_QUALITY} "${tempPath}" -o "${outputPath}"`,
      { stdio: 'inherit' }
    );

    // Clean up temp file
    execSync(`rm "${tempPath}"`);

    // Get new size
    const newStats = await stat(outputPath);
    const newSize = newStats.size;
    const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);

    console.log(`✓ Optimized: ${basename(inputPath)}`);
    console.log(`  ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(newSize / 1024 / 1024).toFixed(2)}MB (${savings}% reduction)`);
    console.log(`  ${dimensions.width}x${dimensions.height} → ${newWidth}x${newHeight}`);
    
    return true;
  } catch (error) {
    console.error(`Error optimizing ${inputPath}:`, error.message);
    return false;
  }
}

// Recursively find all images
async function findImages(dir, fileList = []) {
  const files = await readdir(dir);
  
  for (const file of files) {
    const filePath = join(dir, file);
    const stats = await stat(filePath);
    
    if (stats.isDirectory()) {
      await findImages(filePath, fileList);
    } else {
      const ext = extname(file).toLowerCase();
      if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        fileList.push(filePath);
      }
    }
  }
  
  return fileList;
}

// Determine max width based on file path
function getMaxWidth(filePath) {
  const path = filePath.toLowerCase();
  
  // Hero images
  if (path.includes('hero') || path.includes('land_3') || path.includes('nature_2') || 
      path.includes('header_construction') || path.includes('land_11')) {
    return MAX_HERO_WIDTH;
  }
  
  // Large PNG files (likely need more aggressive optimization)
  if (path.includes('land_constructions') || path.includes('house_2') || 
      path.includes('water.png') || path.includes('construction')) {
    return MAX_CARD_WIDTH;
  }
  
  // Card images
  if (path.includes('project/') || path.includes('community/')) {
    return MAX_CARD_WIDTH;
  }
  
  // Team images
  if (path.includes('team/')) {
    return MAX_THUMBNAIL_WIDTH;
  }
  
  // Default
  return MAX_CARD_WIDTH;
}

// Main function
async function main() {
  console.log('Starting image optimization...\n');
  
  const images = await findImages(ASSETS_DIR);
  console.log(`Found ${images.length} images to optimize\n`);
  
  let optimized = 0;
  let skipped = 0;
  
  for (const imagePath of images) {
    const ext = extname(imagePath);
    const outputPath = imagePath.replace(ext, '.webp');
    
    // Skip if WebP already exists and is newer
    if (await fileExists(outputPath)) {
      const originalStats = await stat(imagePath);
      const webpStats = await stat(outputPath);
      
      if (webpStats.mtime > originalStats.mtime) {
        console.log(`⊘ Skipping ${basename(imagePath)} (WebP already exists)`);
        skipped++;
        continue;
      }
    }
    
    const maxWidth = getMaxWidth(imagePath);
    const success = await optimizeImage(imagePath, outputPath, maxWidth);
    
    if (success) {
      optimized++;
    } else {
      skipped++;
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('\n=== Optimization Complete ===');
  console.log(`Optimized: ${optimized}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total: ${images.length}`);
}

main().catch(console.error);

