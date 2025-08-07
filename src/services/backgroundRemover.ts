import * as tf from '@tensorflow/tfjs';
import * as bodyPix from '@tensorflow-models/body-pix';

let model: bodyPix.BodyPix | null = null;
let isLoading = false;

export interface BackgroundRemovalOptions {
  segmentationThreshold?: number;
  flipHorizontal?: boolean;
}

export const loadBodyPixModel = async (): Promise<bodyPix.BodyPix> => {
  // If model is already loaded, return it
  if (model) return model;
  
  // If model is currently loading, wait for it
  if (isLoading) {
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (model) return model;
  }
  
  isLoading = true;
  
  try {
    // Ensure TensorFlow.js is ready
    await tf.ready();
    console.log('TensorFlow.js is ready');
    
    // Load the BodyPix model
    console.log('Loading BodyPix model...');
    model = await bodyPix.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      multiplier: 0.75,
      quantBytes: 2,
    });
    
    console.log('BodyPix model loaded successfully');
    return model;
  } catch (error) {
    console.error('Failed to load BodyPix model:', error);
    throw new Error('Failed to load BodyPix model. Please try again.');
  } finally {
    isLoading = false;
  }
};

export const removeBackground = async (
  imageElement: HTMLImageElement,
  options: BackgroundRemovalOptions = {}
): Promise<ImageData> => {
  const {
    segmentationThreshold = 0.5,
    flipHorizontal = false
  } = options;

  // Ensure BodyPix model is loaded and ready
  console.log('Ensuring BodyPix model is ready...');
  const bodyPixModel = await loadBodyPixModel();
  
  if (!bodyPixModel) {
    throw new Error('BodyPix model failed to load');
  }
  
  console.log('BodyPix model is ready, starting segmentation...');

  // Create a canvas to process the image
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Unable to get canvas context');
  }
  
  canvas.width = imageElement.naturalWidth;
  canvas.height = imageElement.naturalHeight;
  
  // Draw the image to canvas
  ctx.drawImage(imageElement, 0, 0);
  
  try {
    // Get segmentation from BodyPix - only called after model is ready
    const segmentation = await bodyPixModel.segmentPerson(canvas, {
      flipHorizontal,
      internalResolution: 'medium',
      segmentationThreshold,
    });
    
    console.log('Segmentation completed, processing pixels...');

    // Debug: Check how many person pixels were detected
    const personPixels = segmentation.data.filter(pixel => pixel === 1).length;
    const totalPixels = segmentation.data.length;
    const personPercentage = (personPixels / totalPixels) * 100;
    
    console.log(`Person pixels detected: ${personPixels}/${totalPixels} (${personPercentage.toFixed(2)}%)`);
    
    // If no person detected or very few person pixels, return original image
    if (personPercentage < 1) {
      console.warn('Very few or no person pixels detected. Returning original image.');
      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
    // Get the image data from canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Loop through pixels and set alpha to 0 where person is not detected
    for (let i = 0; i < segmentation.data.length; i++) {
      const pixelIndex = i * 4; // Each pixel has 4 values (R, G, B, A)
      
      // If this pixel is background (segmentation.data[i] === 0), make it transparent
      if (segmentation.data[i] === 0) {
        data[pixelIndex + 3] = 0; // Set alpha to 0 (transparent)
      }
    }

    // Put the modified image data back
    ctx.putImageData(imageData, 0, 0);
    
    console.log('Background removal completed successfully');

    // Return the processed image data
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch (error) {
    console.error('Error during segmentation:', error);
    // Return original image if segmentation fails
    console.log('Returning original image due to segmentation error');
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
};

export const preloadModel = async (): Promise<void> => {
  try {
    await loadBodyPixModel();
    console.log('BodyPix model preloaded successfully');
  } catch (error) {
    console.warn('Failed to preload BodyPix model:', error);
  }
};