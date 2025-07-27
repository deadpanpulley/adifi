export interface SharpeningOptions {
  intensity?: number;
  method?: 'unsharp' | 'laplacian' | 'edge-enhance';
  threshold?: number;
}

export interface SharpeningResult {
  imageData: ImageData;
  processingTime: number;
  method: string;
}

// High-performance sharpening without TensorFlow overhead
export const sharpenImage = async (
  imageData: ImageData,
  options: SharpeningOptions = {}
): Promise<SharpeningResult> => {
  const startTime = performance.now();
  
  const {
    intensity = 1.5,
    method = 'unsharp'
  } = options;
  
  const { data, width, height } = imageData;
  const result = new ImageData(width, height);
  const newData = result.data;
  
  // Copy original data
  for (let i = 0; i < data.length; i++) {
    newData[i] = data[i];
  }
  
  console.log(`🔥 Applying ${method} sharpening with intensity ${intensity}`);
  
  // Apply sharpening based on method
  switch (method) {
    case 'unsharp':
      applyUnsharpMask(data, newData, width, height, intensity);
      break;
    case 'laplacian':
      applyLaplacianSharpening(data, newData, width, height, intensity);
      break;
    case 'edge-enhance':
      applyEdgeEnhancement(data, newData, width, height, intensity);
      break;
    default:
      applyUnsharpMask(data, newData, width, height, intensity);
  }
  
  const endTime = performance.now();
  const processingTime = endTime - startTime;
  
  console.log(`✅ SHARPENING COMPLETED! Method: ${method}, Time: ${processingTime.toFixed(2)}ms`);
  
  return {
    imageData: result,
    processingTime,
    method
  };
};

// Unsharp mask - most effective for photo sharpening
const applyUnsharpMask = (
  original: Uint8ClampedArray, 
  result: Uint8ClampedArray, 
  width: number, 
  height: number, 
  intensity: number
) => {
  // Create gaussian blur for unsharp mask
  const blurred = new Uint8ClampedArray(original.length);
  
  // Apply Gaussian blur (simplified 3x3 kernel)
  const gaussianKernel = [
    1, 2, 1,
    2, 4, 2,
    1, 2, 1
  ];
  const kernelSum = 16;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) { // RGB only
        let sum = 0;
        let ki = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIndex = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += original[pixelIndex] * gaussianKernel[ki];
            ki++;
          }
        }
        
        const blurredIndex = (y * width + x) * 4 + c;
        blurred[blurredIndex] = sum / kernelSum;
      }
    }
  }
  
  // Apply unsharp mask: original + intensity * (original - blurred)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        const index = (y * width + x) * 4 + c;
        const originalValue = original[index];
        const blurredValue = blurred[index];
        const difference = originalValue - blurredValue;
        const sharpened = originalValue + difference * intensity;
        
        result[index] = Math.max(0, Math.min(255, sharpened));
      }
      // Copy alpha channel
      const alphaIndex = (y * width + x) * 4 + 3;
      result[alphaIndex] = original[alphaIndex];
    }
  }
};

// Laplacian sharpening - good for edge enhancement
const applyLaplacianSharpening = (
  original: Uint8ClampedArray, 
  result: Uint8ClampedArray, 
  width: number, 
  height: number, 
  intensity: number
) => {
  // Laplacian kernel for edge detection
  const laplacianKernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        let ki = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIndex = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += original[pixelIndex] * laplacianKernel[ki];
            ki++;
          }
        }
        
        const currentIndex = (y * width + x) * 4 + c;
        const enhanced = original[currentIndex] + (sum - original[currentIndex]) * intensity * 0.3;
        result[currentIndex] = Math.max(0, Math.min(255, enhanced));
      }
      // Copy alpha
      const alphaIndex = (y * width + x) * 4 + 3;
      result[alphaIndex] = original[alphaIndex];
    }
  }
};

// Edge enhancement - preserves image while enhancing edges
const applyEdgeEnhancement = (
  original: Uint8ClampedArray, 
  result: Uint8ClampedArray, 
  width: number, 
  height: number, 
  intensity: number
) => {
  // Sobel edge detection
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let gradientX = 0;
        let gradientY = 0;
        let ki = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIndex = ((y + ky) * width + (x + kx)) * 4 + c;
            gradientX += original[pixelIndex] * sobelX[ki];
            gradientY += original[pixelIndex] * sobelY[ki];
            ki++;
          }
        }
        
        const edge = Math.sqrt(gradientX * gradientX + gradientY * gradientY);
        const currentIndex = (y * width + x) * 4 + c;
        const enhanced = original[currentIndex] + edge * intensity * 0.2;
        
        result[currentIndex] = Math.max(0, Math.min(255, enhanced));
      }
      // Copy alpha
      const alphaIndex = (y * width + x) * 4 + 3;
      result[alphaIndex] = original[alphaIndex];
    }
  }
};

export const analyzeImageSharpness = (imageData: ImageData): number => {
  const { data, width, height } = imageData;
  
  let edgeStrength = 0;
  let pixelCount = 0;
  
  // Calculate edge strength using Sobel operator
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // Skip transparent pixels
      if (data[idx + 3] < 128) continue;
      
      // Convert to grayscale
      const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      
      // Sobel X and Y
      const gx = (-1 * data[((y-1) * width + (x-1)) * 4] + 1 * data[((y-1) * width + (x+1)) * 4] +
                  -2 * data[(y * width + (x-1)) * 4] + 2 * data[(y * width + (x+1)) * 4] +
                  -1 * data[((y+1) * width + (x-1)) * 4] + 1 * data[((y+1) * width + (x+1)) * 4]);
      
      const gy = (-1 * data[((y-1) * width + (x-1)) * 4] - 2 * data[((y-1) * width + x) * 4] - 1 * data[((y-1) * width + (x+1)) * 4] +
                   1 * data[((y+1) * width + (x-1)) * 4] + 2 * data[((y+1) * width + x) * 4] + 1 * data[((y+1) * width + (x+1)) * 4]);
      
      edgeStrength += Math.sqrt(gx * gx + gy * gy);
      pixelCount++;
    }
  }
  
  const avgEdgeStrength = edgeStrength / pixelCount;
  
  // Normalize to 0-100 scale
  return Math.min(100, Math.max(0, avgEdgeStrength / 3));
};

export const preloadTensorFlow = async (): Promise<void> => {
  console.log('Image sharpening engine ready');
};