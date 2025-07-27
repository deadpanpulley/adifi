interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

interface ColorPaletteResult {
  colors: ColorRGB[];
  processingTime: number;
  totalPixelsAnalyzed: number;
  samplingRate: number;
}

// Convert RGB to Hex
export const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Convert RGB to HSL for better color analysis
const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
};

// Calculate color distance in RGB space
const colorDistance = (c1: ColorRGB, c2: ColorRGB): number => {
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

// Sample pixels from image data for performance
const samplePixels = (imageData: ImageData, maxSamples: number = 5000): ColorRGB[] => {
  const { data, width, height } = imageData;
  const totalPixels = width * height;
  const samplingInterval = Math.max(1, Math.floor(totalPixels / maxSamples));
  
  const samples: ColorRGB[] = [];
  
  for (let i = 0; i < data.length; i += samplingInterval * 4) {
    const alpha = data[i + 3];
    
    // Skip transparent pixels
    if (alpha < 128) continue;
    
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Skip very dark or very light pixels that might be noise
    const [, , lightness] = rgbToHsl(r, g, b);
    if (lightness < 5 || lightness > 95) continue;
    
    samples.push({ r, g, b });
  }
  
  return samples;
};

// Initialize K-means centroids using K-means++ algorithm for better initial placement
const initializeCentroids = (pixels: ColorRGB[], k: number): ColorRGB[] => {
  const centroids: ColorRGB[] = [];
  
  // Choose first centroid randomly
  centroids.push(pixels[Math.floor(Math.random() * pixels.length)]);
  
  // Choose remaining centroids using K-means++ (weighted probability)
  for (let i = 1; i < k; i++) {
    const distances: number[] = [];
    let totalDistance = 0;
    
    // Calculate distance from each pixel to nearest existing centroid
    for (const pixel of pixels) {
      let minDistance = Infinity;
      for (const centroid of centroids) {
        const distance = colorDistance(pixel, centroid);
        minDistance = Math.min(minDistance, distance);
      }
      distances.push(minDistance * minDistance); // Square for K-means++
      totalDistance += minDistance * minDistance;
    }
    
    // Choose next centroid with probability proportional to squared distance
    const randomValue = Math.random() * totalDistance;
    let cumulativeDistance = 0;
    
    for (let j = 0; j < pixels.length; j++) {
      cumulativeDistance += distances[j];
      if (cumulativeDistance >= randomValue) {
        centroids.push(pixels[j]);
        break;
      }
    }
  }
  
  return centroids;
};

// Assign each pixel to the nearest centroid
const assignPixelsToClusters = (pixels: ColorRGB[], centroids: ColorRGB[]): number[] => {
  return pixels.map(pixel => {
    let minDistance = Infinity;
    let clusterIndex = 0;
    
    centroids.forEach((centroid, index) => {
      const distance = colorDistance(pixel, centroid);
      if (distance < minDistance) {
        minDistance = distance;
        clusterIndex = index;
      }
    });
    
    return clusterIndex;
  });
};

// Update centroids based on cluster assignments
const updateCentroids = (pixels: ColorRGB[], assignments: number[], k: number): ColorRGB[] => {
  const newCentroids: ColorRGB[] = [];
  
  for (let i = 0; i < k; i++) {
    const clusterPixels = pixels.filter((_, index) => assignments[index] === i);
    
    if (clusterPixels.length === 0) {
      // If no pixels assigned, use a random pixel
      newCentroids.push(pixels[Math.floor(Math.random() * pixels.length)]);
      continue;
    }
    
    // Calculate average color of cluster
    const avgR = clusterPixels.reduce((sum, pixel) => sum + pixel.r, 0) / clusterPixels.length;
    const avgG = clusterPixels.reduce((sum, pixel) => sum + pixel.g, 0) / clusterPixels.length;
    const avgB = clusterPixels.reduce((sum, pixel) => sum + pixel.b, 0) / clusterPixels.length;
    
    newCentroids.push({
      r: Math.round(avgR),
      g: Math.round(avgG),
      b: Math.round(avgB)
    });
  }
  
  return newCentroids;
};

// Check if centroids have converged
const centroidsConverged = (oldCentroids: ColorRGB[], newCentroids: ColorRGB[], threshold: number = 1): boolean => {
  for (let i = 0; i < oldCentroids.length; i++) {
    if (colorDistance(oldCentroids[i], newCentroids[i]) > threshold) {
      return false;
    }
  }
  return true;
};

// Sort colors by vibrancy and lightness for better display order
const sortColorsByVibrancy = (colors: ColorRGB[]): ColorRGB[] => {
  return colors.sort((a, b) => {
    const [, satA, lightA] = rgbToHsl(a.r, a.g, a.b);
    const [, satB, lightB] = rgbToHsl(b.r, b.g, b.b);
    
    // Prioritize vibrant colors (high saturation) and balanced lightness
    const vibrancyA = satA * (1 - Math.abs(lightA - 50) / 50);
    const vibrancyB = satB * (1 - Math.abs(lightB - 50) / 50);
    
    return vibrancyB - vibrancyA;
  });
};

// Main K-means clustering function
export const extractColorPalette = async (
  imageData: ImageData,
  k: number = 5,
  maxIterations: number = 50,
  maxSamples: number = 5000
): Promise<ColorPaletteResult> => {
  const startTime = performance.now();
  
  console.log('Starting color palette extraction...');
  
  // Sample pixels for performance
  const pixels = samplePixels(imageData, maxSamples);
  const samplingRate = pixels.length / (imageData.width * imageData.height);
  
  console.log(`Analyzing ${pixels.length} sampled pixels (${(samplingRate * 100).toFixed(2)}% sampling rate)`);
  
  if (pixels.length < k) {
    throw new Error(`Not enough valid pixels (${pixels.length}) for ${k} clusters`);
  }
  
  // Initialize centroids using K-means++
  let centroids = initializeCentroids(pixels, k);
  console.log('Initial centroids selected using K-means++ algorithm');
  
  // K-means iteration
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Assign pixels to clusters
    const assignments = assignPixelsToClusters(pixels, centroids);
    
    // Update centroids
    const newCentroids = updateCentroids(pixels, assignments, k);
    
    // Check for convergence
    if (centroidsConverged(centroids, newCentroids)) {
      console.log(`K-means converged after ${iteration + 1} iterations`);
      centroids = newCentroids;
      break;
    }
    
    centroids = newCentroids;
    
    if (iteration === maxIterations - 1) {
      console.log(`K-means completed ${maxIterations} iterations (max reached)`);
    }
  }
  
  // Sort colors by vibrancy for better visual display
  const sortedColors = sortColorsByVibrancy(centroids);
  
  const endTime = performance.now();
  const processingTime = endTime - startTime;
  
  console.log('Color palette extraction results:', {
    colors: sortedColors.map(color => rgbToHex(color.r, color.g, color.b)),
    processingTime: `${processingTime.toFixed(2)}ms`,
    pixelsAnalyzed: pixels.length,
    samplingRate: `${(samplingRate * 100).toFixed(2)}%`
  });
  
  return {
    colors: sortedColors,
    processingTime,
    totalPixelsAnalyzed: pixels.length,
    samplingRate
  };
};

// Generate color name based on HSL values (optional feature)
export const getColorName = (r: number, g: number, b: number): string => {
  const [hue, saturation, lightness] = rgbToHsl(r, g, b);
  
  // Simple color naming based on hue
  if (saturation < 10) {
    if (lightness < 20) return 'Dark Gray';
    if (lightness < 40) return 'Gray';
    if (lightness < 60) return 'Light Gray';
    if (lightness < 80) return 'Silver';
    return 'White';
  }
  
  if (lightness < 20) return 'Dark';
  if (lightness > 80) return 'Light';
  
  // Color hue ranges
  if (hue < 15 || hue >= 345) return 'Red';
  if (hue < 45) return 'Orange';
  if (hue < 75) return 'Yellow';
  if (hue < 105) return 'Yellow Green';
  if (hue < 135) return 'Green';
  if (hue < 165) return 'Teal';
  if (hue < 195) return 'Cyan';
  if (hue < 225) return 'Blue';
  if (hue < 255) return 'Purple';
  if (hue < 285) return 'Magenta';
  if (hue < 315) return 'Pink';
  return 'Red';
};