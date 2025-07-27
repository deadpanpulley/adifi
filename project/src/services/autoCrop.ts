import * as bodyPix from '@tensorflow-models/body-pix';
import { loadBodyPixModel } from './backgroundRemover';

export interface CropBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AutoCropOptions {
  segmentationThreshold?: number;
  paddingPercentage?: number;
  minCropSize?: number;
  flipHorizontal?: boolean;
}

export interface AutoCropResult {
  cropBounds: CropBounds;
  croppedImageData: ImageData;
  processingTime: number;
  subjectDetected: boolean;
  subjectCoverage: number;
}

// Find the bounding box of detected person/subject pixels
const findSubjectBounds = (
  segmentation: bodyPix.SemanticPersonSegmentation,
  width: number,
  height: number
): CropBounds | null => {
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;
  let subjectPixelCount = 0;

  // Scan through segmentation data to find bounds
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      
      // If this pixel is part of the subject (person)
      if (segmentation.data[index] === 1) {
        subjectPixelCount++;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }

  // If no subject pixels found, return null
  if (subjectPixelCount === 0) {
    return null;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  };
};

// Apply smart padding around the detected subject
const applyCropPadding = (
  bounds: CropBounds,
  imageWidth: number,
  imageHeight: number,
  paddingPercentage: number
): CropBounds => {
  // Calculate padding based on the smaller dimension of the bounding box
  const paddingX = Math.round(bounds.width * paddingPercentage);
  const paddingY = Math.round(bounds.height * paddingPercentage);

  // Apply padding while staying within image bounds
  const paddedBounds = {
    x: Math.max(0, bounds.x - paddingX),
    y: Math.max(0, bounds.y - paddingY),
    width: bounds.width + (2 * paddingX),
    height: bounds.height + (2 * paddingY)
  };

  // Adjust if padding goes beyond image boundaries
  if (paddedBounds.x + paddedBounds.width > imageWidth) {
    paddedBounds.width = imageWidth - paddedBounds.x;
  }
  
  if (paddedBounds.y + paddedBounds.height > imageHeight) {
    paddedBounds.height = imageHeight - paddedBounds.y;
  }

  return paddedBounds;
};

// Crop the image data to the specified bounds
const cropImageData = (
  originalImageData: ImageData,
  cropBounds: CropBounds
): ImageData => {
  const { x, y, width, height } = cropBounds;
  const { data: originalData, width: originalWidth } = originalImageData;

  // Create new ImageData for the cropped region
  const croppedData = new Uint8ClampedArray(width * height * 4);

  // Copy pixels from original to cropped region
  for (let cropY = 0; cropY < height; cropY++) {
    for (let cropX = 0; cropX < width; cropX++) {
      const originalPixelIndex = ((y + cropY) * originalWidth + (x + cropX)) * 4;
      const croppedPixelIndex = (cropY * width + cropX) * 4;

      // Copy RGBA values
      croppedData[croppedPixelIndex] = originalData[originalPixelIndex];     // R
      croppedData[croppedPixelIndex + 1] = originalData[originalPixelIndex + 1]; // G
      croppedData[croppedPixelIndex + 2] = originalData[originalPixelIndex + 2]; // B
      croppedData[croppedPixelIndex + 3] = originalData[originalPixelIndex + 3]; // A
    }
  }

  return new ImageData(croppedData, width, height);
};

// Enhanced crop algorithm that tries different approaches
const findOptimalCropBounds = (
  segmentation: bodyPix.SemanticPersonSegmentation,
  width: number,
  height: number,
  options: AutoCropOptions
): CropBounds | null => {
  const { paddingPercentage = 0.15, minCropSize = 100 } = options;

  // First, try to find person bounds
  let bounds = findSubjectBounds(segmentation, width, height);
  
  if (!bounds) {
    console.log('No clear subject detected, using center crop as fallback');
    // Fallback: Use center crop if no subject detected
    const cropSize = Math.min(width, height) * 0.8;
    bounds = {
      x: Math.round((width - cropSize) / 2),
      y: Math.round((height - cropSize) / 2),
      width: cropSize,
      height: cropSize
    };
  }

  // Ensure minimum crop size
  if (bounds.width < minCropSize || bounds.height < minCropSize) {
    const scale = Math.max(minCropSize / bounds.width, minCropSize / bounds.height);
    const newWidth = Math.round(bounds.width * scale);
    const newHeight = Math.round(bounds.height * scale);
    
    bounds = {
      x: Math.max(0, bounds.x - Math.round((newWidth - bounds.width) / 2)),
      y: Math.max(0, bounds.y - Math.round((newHeight - bounds.height) / 2)),
      width: newWidth,
      height: newHeight
    };
  }

  // Apply smart padding
  bounds = applyCropPadding(bounds, width, height, paddingPercentage);

  // Ensure aspect ratio is reasonable (not too extreme)
  const aspectRatio = bounds.width / bounds.height;
  if (aspectRatio > 3 || aspectRatio < 0.33) {
    // Make it more square if aspect ratio is too extreme
    const targetSize = Math.min(bounds.width, bounds.height);
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    
    bounds = {
      x: Math.max(0, Math.round(centerX - targetSize / 2)),
      y: Math.max(0, Math.round(centerY - targetSize / 2)),
      width: targetSize,
      height: targetSize
    };
  }

  return bounds;
};

export const autoCropImage = async (
  imageElement: HTMLImageElement,
  options: AutoCropOptions = {}
): Promise<AutoCropResult> => {
  const startTime = performance.now();
  
  const {
    segmentationThreshold = 0.6,
    paddingPercentage = 0.15,
    minCropSize = 100,
    flipHorizontal = false
  } = options;

  console.log('Starting auto-crop analysis...');

  try {
    // Load BodyPix model
    const bodyPixModel = await loadBodyPixModel();
    
    // Create canvas for processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Unable to get canvas context');
    }
    
    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;
    
    // Draw image to canvas
    ctx.drawImage(imageElement, 0, 0);
    
    // Get segmentation
    console.log('Performing subject segmentation...');
    const segmentation = await bodyPixModel.segmentPerson(canvas, {
      flipHorizontal,
      internalResolution: 'medium',
      segmentationThreshold,
    });

    // Calculate subject coverage
    const totalPixels = segmentation.data.length;
    const subjectPixels = segmentation.data.filter(pixel => pixel === 1).length;
    const subjectCoverage = (subjectPixels / totalPixels) * 100;
    
    console.log(`Subject coverage: ${subjectCoverage.toFixed(2)}%`);

    // Find optimal crop bounds
    const cropBounds = findOptimalCropBounds(
      segmentation, 
      canvas.width, 
      canvas.height,
      { paddingPercentage, minCropSize }
    );

    if (!cropBounds) {
      throw new Error('Unable to determine crop bounds');
    }

    console.log('Crop bounds calculated:', {
      x: cropBounds.x,
      y: cropBounds.y,
      width: cropBounds.width,
      height: cropBounds.height,
      aspectRatio: (cropBounds.width / cropBounds.height).toFixed(2)
    });

    // Get original image data
    const originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Crop the image
    const croppedImageData = cropImageData(originalImageData, cropBounds);

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    console.log(`Auto-crop completed in ${processingTime.toFixed(2)}ms`);

    return {
      cropBounds,
      croppedImageData,
      processingTime,
      subjectDetected: subjectPixels > totalPixels * 0.01, // At least 1% subject pixels
      subjectCoverage
    };

  } catch (error) {
    console.error('Auto-crop failed:', error);
    throw new Error('Auto-crop failed. Please try again.');
  }
};

// Fallback crop using center focus
export const centerCropImage = (
  imageElement: HTMLImageElement,
  cropRatio: number = 0.8
): Promise<AutoCropResult> => {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Unable to get canvas context'));
        return;
      }
      
      canvas.width = imageElement.naturalWidth;
      canvas.height = imageElement.naturalHeight;
      
      ctx.drawImage(imageElement, 0, 0);
      
      const cropSize = Math.min(canvas.width, canvas.height) * cropRatio;
      const cropBounds: CropBounds = {
        x: Math.round((canvas.width - cropSize) / 2),
        y: Math.round((canvas.height - cropSize) / 2),
        width: cropSize,
        height: cropSize
      };
      
      const originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const croppedImageData = cropImageData(originalImageData, cropBounds);
      
      const endTime = performance.now();
      
      resolve({
        cropBounds,
        croppedImageData,
        processingTime: endTime - startTime,
        subjectDetected: false,
        subjectCoverage: 0
      });
    } catch (error) {
      reject(error);
    }
  });
};