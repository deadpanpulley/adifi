import React, { useState } from 'react';
import { rgbToHex, getColorName } from '../services/colorAnalysis';

interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

interface ColorPaletteProps {
  colors: ColorRGB[];
  processingTime?: number;
  totalPixelsAnalyzed?: number;
  samplingRate?: number;
  onClose?: () => void;
}

interface ColorSwatchProps {
  color: ColorRGB;
  index: number;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ color, index }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const hexColor = rgbToHex(color.r, color.g, color.b);
  const colorName = getColorName(color.r, color.g, color.b);
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(hexColor);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy color to clipboard:', err);
    }
  };
  
  return (
    <div className="relative">
      <div
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-110 hover:-translate-y-1 border-2 border-white/20 hover:border-white/40 card-interactive"
        style={{ backgroundColor: hexColor }}
        onClick={copyToClipboard}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl pointer-events-none" />
        
        {/* Copy feedback */}
        {copied && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl backdrop-blur-sm">
            <span className="text-white text-xs font-medium">Copied!</span>
          </div>
        )}
      </div>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-out">
          <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
            <div className="font-semibold">{colorName}</div>
            <div className="text-gray-200">{hexColor}</div>
            <div className="text-gray-300 text-xs mt-1">RGB({color.r}, {color.g}, {color.b})</div>
            <div className="text-gray-400 text-xs">Click to copy</div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 -mt-1"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ColorPalette: React.FC<ColorPaletteProps> = ({ 
  colors, 
  processingTime, 
  totalPixelsAnalyzed, 
  samplingRate,
  onClose 
}) => {
  if (colors.length === 0) return null;
  
  return (
    <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-sm"></div>
          <h3 className="text-lg font-semibold text-gray-900">Dominant Colors</h3>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded hover:bg-gray-100"
          >
            ×
          </button>
        )}
      </div>
      
      {/* Color Swatches */}
      <div className="flex items-center justify-center space-x-3 sm:space-x-4 mb-4">
        {colors.map((color, index) => (
          <ColorSwatch key={index} color={color} index={index} />
        ))}
      </div>
      
      {/* Processing Stats */}
      {processingTime && (
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500 border-t border-gray-200 pt-3">
          <span>
            Processed in {processingTime.toFixed(1)}ms
          </span>
          {totalPixelsAnalyzed && (
            <span>
              •  {totalPixelsAnalyzed.toLocaleString()} pixels analyzed
            </span>
          )}
          {samplingRate && (
            <span>
              •  {(samplingRate * 100).toFixed(1)}% sampling
            </span>
          )}
        </div>
      )}
      
      <div className="text-center mt-2">
        <p className="text-xs text-gray-500">
          Click any color to copy its hex code • Generated using K-means clustering
        </p>
      </div>
    </div>
  );
};