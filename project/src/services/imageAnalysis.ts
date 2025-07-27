interface HistogramData {
  luminance: number[];
  red: number[];
  green: number[];
  blue: number[];
}

interface ImageAnalysisResult {
  averageLuminance: number;
  contrastLevel: number;
  saturationLevel: number;
  recommendedBrightness: number;
  recommendedContrast: number;
  recommendedSaturation: number;
}

export const analyzeImageHistogram = (imageData: ImageData): ImageAnalysisResult => {
  const { data, width, height } = imageData;
  const pixelCount = width * height;
  
  // Initialize histogram arrays
  const histogram: HistogramData = {
    luminance: new Array(256).fill(0),
    red: new Array(256).fill(0),
    green: new Array(256).fill(0),
    blue: new Array(256).fill(0)
  };
  
  let totalLuminance = 0;
  let totalSaturation = 0;
  
  // Build histogram and calculate statistics
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const alpha = data[i + 3];
    
    // Skip transparent pixels
    if (alpha === 0) continue;
    
    // Calculate luminance using standard formula
    const luminance = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    
    // Update histograms
    histogram.luminance[luminance]++;
    histogram.red[r]++;
    histogram.green[g]++;
    histogram.blue[b]++;
    
    totalLuminance += luminance;
    
    // Calculate saturation
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    totalSaturation += saturation;
  }
  
  // Calculate averages
  const averageLuminance = totalLuminance / pixelCount;
  const averageSaturation = totalSaturation / pixelCount;
  
  // Calculate contrast level by analyzing histogram spread
  const contrastLevel = calculateContrastLevel(histogram.luminance);
  
  // Determine recommended adjustments
  const recommendedBrightness = calculateBrightnessAdjustment(averageLuminance);
  const recommendedContrast = calculateContrastAdjustment(contrastLevel);
  const recommendedSaturation = calculateSaturationAdjustment(averageSaturation);
  
  return {
    averageLuminance,
    contrastLevel,
    saturationLevel: averageSaturation,
    recommendedBrightness,
    recommendedContrast,
    recommendedSaturation
  };
};

const calculateContrastLevel = (luminanceHistogram: number[]): number => {
  // Find the range of significant luminance values
  let minSignificant = 0;
  let maxSignificant = 255;
  
  const totalPixels = luminanceHistogram.reduce((sum, count) => sum + count, 0);
  const threshold = totalPixels * 0.01; // Ignore outliers (1% on each end)
  
  let cumulative = 0;
  for (let i = 0; i < 256; i++) {
    cumulative += luminanceHistogram[i];
    if (cumulative > threshold) {
      minSignificant = i;
      break;
    }
  }
  
  cumulative = 0;
  for (let i = 255; i >= 0; i--) {
    cumulative += luminanceHistogram[i];
    if (cumulative > threshold) {
      maxSignificant = i;
      break;
    }
  }
  
  // Return contrast level as a percentage of full range
  return (maxSignificant - minSignificant) / 255;
};

const calculateBrightnessAdjustment = (averageLuminance: number): number => {
  // Target luminance around 128 (middle gray)
  const targetLuminance = 128;
  const difference = targetLuminance - averageLuminance;
  
  // Convert to percentage adjustment (-100 to +100)
  // Scale the adjustment to be more conservative
  return Math.max(-80, Math.min(80, (difference / 128) * 60));
};

const calculateContrastAdjustment = (contrastLevel: number): number => {
  // If contrast is too low (histogram is narrow), increase it
  const targetContrast = 0.8; // Target 80% of full range
  const difference = targetContrast - contrastLevel;
  
  // Convert to percentage adjustment
  if (difference > 0) {
    // Need more contrast
    return Math.min(50, difference * 100);
  } else {
    // Contrast might be too high, reduce slightly
    return Math.max(-20, difference * 50);
  }
};

const calculateSaturationAdjustment = (averageSaturation: number): number => {
  // Target saturation around 0.4 (40%)
  const targetSaturation = 0.4;
  const difference = targetSaturation - averageSaturation;
  
  // Convert to percentage adjustment
  if (difference > 0) {
    // Need more saturation
    return Math.min(40, difference * 150);
  } else if (averageSaturation > 0.6) {
    // Too saturated, reduce slightly
    return Math.max(-20, difference * 100);
  }
  
  return 0;
};

export const getImageDataFromCanvas = (canvas: HTMLCanvasElement): ImageData => {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to get canvas context');
  }
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
};