import React, { useState, useRef, useEffect } from 'react';
import { Palette, Wand2, Download, X, Loader2, AlertTriangle } from 'lucide-react';

interface StyleTransferProps {
  sourceImage: HTMLImageElement | null;
  isVisible: boolean;
  onClose: () => void;
  onApplyStyle: (styledImageData: ImageData) => void;
}

interface StylePreset {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  filters: string[];
  intensity: number;
  disclaimer: string;
}

const stylePresets: StylePreset[] = [
  {
    id: 'impressionist',
    name: 'Impressionist',
    description: 'Soft, painterly effect with enhanced colors',
    thumbnail: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="impressionist" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%2306B6D4"/><stop offset="50%" style="stop-color:%2310B981"/><stop offset="100%" style="stop-color:%23F59E0B"/></linearGradient></defs><rect width="100" height="100" fill="url(%23impressionist)"/></svg>',
    filters: ['blur(0.8px)', 'contrast(1.15)', 'saturate(1.3)', 'brightness(1.05)'],
    intensity: 0.7,
    disclaimer: 'Simulated impressionist effect using image processing'
  },
  {
    id: 'dramatic',
    name: 'Dramatic',
    description: 'High contrast with bold shadows and highlights',
    thumbnail: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="dramatic"><stop offset="0%" style="stop-color:%23FFF"/><stop offset="70%" style="stop-color:%23666"/><stop offset="100%" style="stop-color:%23000"/></radialGradient></defs><rect width="100" height="100" fill="url(%23dramatic)"/></svg>',
    filters: ['contrast(1.8)', 'brightness(0.9)', 'saturate(1.2)'],
    intensity: 0.9,
    disclaimer: 'Enhanced contrast and lighting effects'
  },
  {
    id: 'vintage',
    name: 'Vintage Film',
    description: 'Classic film photography look',
    thumbnail: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="vintage" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23FED7AA"/><stop offset="100%" style="stop-color:%23A78BFA"/></linearGradient></defs><rect width="100" height="100" fill="url(%23vintage)"/></svg>',
    filters: ['sepia(40%)', 'contrast(1.1)', 'brightness(1.1)', 'saturate(0.8)'],
    intensity: 0.8,
    disclaimer: 'Vintage color grading simulation'
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Neon-enhanced digital aesthetic',
    thumbnail: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23000"/><rect x="10" y="20" width="80" height="5" fill="%23FF007F"/><rect x="10" y="40" width="60" height="3" fill="%2300FFFF"/><rect x="10" y="60" width="70" height="4" fill="%23FFFF00"/></svg>',
    filters: ['contrast(1.6)', 'saturate(1.8)', 'hue-rotate(180deg)', 'brightness(0.8)'],
    intensity: 0.9,
    disclaimer: 'Digital color enhancement and contrast adjustment'
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    description: 'Soft, flowing watercolor painting effect',
    thumbnail: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="watercolor"><stop offset="0%" style="stop-color:%23FF6B9D;stop-opacity:0.6"/><stop offset="50%" style="stop-color:%234ECDC4;stop-opacity:0.4"/><stop offset="100%" style="stop-color:%23FFE66D;stop-opacity:0.3"/></radialGradient></defs><rect width="100" height="100" fill="url(%23watercolor)"/></svg>',
    filters: ['blur(1px)', 'contrast(0.9)', 'saturate(1.4)', 'brightness(1.1)'],
    intensity: 0.6,
    disclaimer: 'Watercolor-inspired softening and color blending'
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    description: 'High-contrast black and white',
    thumbnail: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="mono" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23FFF"/><stop offset="100%" style="stop-color:%23000"/></linearGradient></defs><rect width="100" height="100" fill="url(%23mono)"/></svg>',
    filters: ['grayscale(100%)', 'contrast(1.5)', 'brightness(1.1)'],
    intensity: 1.0,
    disclaimer: 'Monochrome conversion with enhanced contrast'
  },
  {
    id: 'technicolor',
    name: 'Technicolor',
    description: 'Vibrant, saturated color like classic films',
    thumbnail: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="33" height="100" fill="%23FF0000"/><rect x="33" width="34" height="100" fill="%2300FF00"/><rect x="67" width="33" height="100" fill="%230000FF"/></svg>',
    filters: ['saturate(2)', 'contrast(1.3)', 'brightness(1.1)'],
    intensity: 0.8,
    disclaimer: 'Enhanced color saturation and vibrancy'
  },
  {
    id: 'dreamy',
    name: 'Dreamy',
    description: 'Soft, ethereal glow effect',
    thumbnail: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="dreamy"><stop offset="0%" style="stop-color:%23FFE5F1"/><stop offset="100%" style="stop-color:%23E0BBE4"/></radialGradient></defs><rect width="100" height="100" fill="url(%23dreamy)"/></svg>',
    filters: ['blur(0.5px)', 'contrast(0.9)', 'saturate(1.2)', 'brightness(1.15)'],
    intensity: 0.7,
    disclaimer: 'Soft focus and color enhancement'
  }
];

export const StyleTransfer: React.FC<StyleTransferProps> = ({
  sourceImage,
  isVisible,
  onClose,
  onApplyStyle
}) => {
  const [selectedStyle, setSelectedStyle] = useState<StylePreset | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [intensity, setIntensity] = useState(0.8);
  const [previewCanvas, setPreviewCanvas] = useState<HTMLCanvasElement | null>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (previewRef.current) {
      setPreviewCanvas(previewRef.current);
    }
  }, []);

  const generatePreview = async (style: StylePreset, customIntensity?: number) => {
    if (!sourceImage || !previewCanvas) return;

    const canvas = previewCanvas;
    const ctx = canvas.getContext('2d')!;
    
    // Set preview size
    const maxSize = 250;
    let { width, height } = sourceImage;
    
    if (width > maxSize || height > maxSize) {
      const scale = Math.min(maxSize / width, maxSize / height);
      width *= scale;
      height *= scale;
    }
    
    canvas.width = width;
    canvas.height = height;
    
    try {
      // Clear and draw original
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      
      // High quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      const finalIntensity = customIntensity ?? intensity;
      
      // Apply style filters
      ctx.save();
      ctx.filter = style.filters.join(' ');
      ctx.globalAlpha = 0.3 + (finalIntensity * 0.7); // Blend with original
      ctx.drawImage(sourceImage, 0, 0, width, height);
      ctx.restore();
      
      // Blend with original
      ctx.save();
      ctx.globalAlpha = 1 - finalIntensity;
      ctx.filter = 'none';
      ctx.drawImage(sourceImage, 0, 0, width, height);
      ctx.restore();
      
      console.log(`Preview generated: ${style.name} at ${Math.round(finalIntensity * 100)}%`);
    } catch (error) {
      console.error('Preview failed:', error);
      // Fallback: just draw original
      ctx.filter = 'none';
      ctx.drawImage(sourceImage, 0, 0, width, height);
    }
  };

  const handleStyleSelect = async (style: StylePreset) => {
    setSelectedStyle(style);
    setIntensity(style.intensity);
    await generatePreview(style);
  };

  const handleIntensityChange = async (newIntensity: number) => {
    setIntensity(newIntensity);
    if (selectedStyle) {
      await generatePreview(selectedStyle, newIntensity);
    }
  };

  const applyStyleToFullImage = async () => {
    if (!selectedStyle || !sourceImage) return;

    setIsProcessing(true);
    
    try {
      console.log(`Applying ${selectedStyle.name} style processing...`);
      
      // Create full-size canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = sourceImage.width;
      canvas.height = sourceImage.height;
      
      // High quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Fill background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Apply style with blending
      ctx.save();
      ctx.filter = selectedStyle.filters.join(' ');
      ctx.globalAlpha = 0.3 + (intensity * 0.7);
      ctx.drawImage(sourceImage, 0, 0);
      ctx.restore();
      
      // Blend with original
      ctx.save();
      ctx.globalAlpha = 1 - intensity;
      ctx.filter = 'none';
      ctx.drawImage(sourceImage, 0, 0);
      ctx.restore();
      
      // Get final image data
      const finalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      console.log(`Style "${selectedStyle.name}" applied successfully!`);
      onApplyStyle(finalImageData);
      onClose();
      
    } catch (error) {
      console.error('Style processing failed:', error);
      alert(`Style processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isVisible || !sourceImage) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Style Processing</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <p className="text-sm text-gray-600">Advanced image processing - not neural network AI</p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Style Selection */}
            <div className="lg:col-span-2">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Choose Processing Style</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stylePresets.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => handleStyleSelect(style)}
                    className={`group relative p-4 rounded-xl border-2 transition-all duration-300 ${
                      selectedStyle?.id === style.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div
                      className="w-full h-16 rounded-lg mb-3 bg-gray-100"
                      style={{ backgroundImage: `url("${style.thumbnail}")`, backgroundSize: 'cover' }}
                    />
                    <h5 className="font-semibold text-gray-900 text-sm">{style.name}</h5>
                    <p className="text-xs text-gray-600 mt-1">{style.description}</p>
                    <p className="text-xs text-gray-500 mt-2 italic">{style.disclaimer}</p>
                    
                    {selectedStyle?.id === style.id && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                          <Wand2 className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              {selectedStyle && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Processing Intensity ({Math.round(intensity * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={intensity}
                    onChange={(e) => handleIntensityChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Subtle</span>
                    <span>Strong</span>
                  </div>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="lg:col-span-1">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Preview</h4>
              <div className="bg-gray-100 rounded-lg p-4 aspect-square flex items-center justify-center">
                {selectedStyle ? (
                  <canvas
                    ref={previewRef}
                    className="max-w-full max-h-full rounded-lg shadow-md"
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <Palette className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Select a style to see preview</p>
                  </div>
                )}
              </div>
              
              {selectedStyle && (
                <div className="mt-4 space-y-3">
                  <div className="text-sm text-gray-600 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800">Processing Method</p>
                        <p className="text-amber-700">{selectedStyle.disclaimer}</p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={applyStyleToFullImage}
                    disabled={isProcessing}
                    className="w-full p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        <span>Apply Style</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};