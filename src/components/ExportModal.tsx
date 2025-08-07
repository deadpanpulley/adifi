import React, { useState } from 'react';
import { Download, X, FileImage, Settings, Zap, Image, FileText, Layers } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export interface ExportOptions {
  format: 'png' | 'jpeg' | 'webp' | 'avif' | 'bmp' | 'gif' | 'pdf' | 'ico';
  quality: number;
  width?: number;
  height?: number;
  maintainAspectRatio: boolean;
  backgroundColor?: string;
  compression?: 'none' | 'low' | 'medium' | 'high';
  metadata?: boolean;
}

const exportFormats = [
  { value: 'png', label: 'PNG', icon: <FileImage className="w-4 h-4" />, description: 'Lossless, supports transparency' },
  { value: 'jpeg', label: 'JPEG', icon: <Image className="w-4 h-4" />, description: 'Best for photos, smaller files' },
  { value: 'webp', label: 'WebP', icon: <Zap className="w-4 h-4" />, description: 'Modern format, best compression' },
  { value: 'avif', label: 'AVIF', icon: <Zap className="w-4 h-4" />, description: 'Next-gen format, excellent quality' },
  { value: 'bmp', label: 'BMP', icon: <FileImage className="w-4 h-4" />, description: 'Uncompressed bitmap' },
  { value: 'gif', label: 'GIF', icon: <Image className="w-4 h-4" />, description: 'Simple graphics, limited colors' },
  { value: 'pdf', label: 'PDF', icon: <FileText className="w-4 h-4" />, description: 'Document format' },
  { value: 'ico', label: 'ICO', icon: <Image className="w-4 h-4" />, description: 'Windows icon format' }
];

const presets = [
  { name: 'Original Size', width: null, height: null },
  { name: 'Instagram Square', width: 1080, height: 1080 },
  { name: 'Instagram Story', width: 1080, height: 1920 },
  { name: 'Instagram Post', width: 1080, height: 1350 },
  { name: 'Facebook Cover', width: 820, height: 312 },
  { name: 'Facebook Post', width: 1200, height: 630 },
  { name: 'Twitter Header', width: 1500, height: 500 },
  { name: 'Twitter Post', width: 1200, height: 675 },
  { name: 'LinkedIn Cover', width: 1584, height: 396 },
  { name: 'LinkedIn Post', width: 1200, height: 627 },
  { name: 'YouTube Thumbnail', width: 1280, height: 720 },
  { name: 'YouTube Banner', width: 2560, height: 1440 },
  { name: 'Desktop Wallpaper HD', width: 1920, height: 1080 },
  { name: 'Desktop Wallpaper 4K', width: 3840, height: 2160 },
  { name: 'Mobile Wallpaper', width: 1125, height: 2436 },
  { name: 'Print A4 (300 DPI)', width: 2480, height: 3508 },
  { name: 'Print Letter (300 DPI)', width: 2550, height: 3300 },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  canvasRef
}) => {
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp' | 'avif' | 'bmp' | 'gif' | 'pdf' | 'ico'>('png');
  const [quality, setQuality] = useState(90);
  const [customWidth, setCustomWidth] = useState<number | undefined>();
  const [customHeight, setCustomHeight] = useState<number | undefined>();
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [compression, setCompression] = useState<'none' | 'low' | 'medium' | 'high'>('medium');
  const [includeMetadata, setIncludeMetadata] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(presets[0]);

  const getOriginalDimensions = () => {
    const canvas = canvasRef.current;
    if (!canvas) return { width: 800, height: 600 };
    return { width: canvas.width, height: canvas.height };
  };

  const getFileSize = (dimensions: { width: number; height: number }) => {
    const pixels = dimensions.width * dimensions.height;
    let sizeBytes: number;

    switch (format) {
      case 'png':
        sizeBytes = pixels * 4; // Rough estimate for PNG
        break;
      case 'jpeg':
        sizeBytes = pixels * (quality / 100) * 0.8;
        break;
      case 'webp':
        sizeBytes = pixels * (quality / 100) * 0.6;
        break;
      case 'avif':
        sizeBytes = pixels * (quality / 100) * 0.4;
        break;
      case 'bmp':
        sizeBytes = pixels * 3; // 24-bit BMP
        break;
      case 'gif':
        sizeBytes = pixels * 1; // 8-bit GIF
        break;
      case 'pdf':
        sizeBytes = pixels * 0.5; // PDF compression
        break;
      case 'ico':
        sizeBytes = Math.min(pixels * 4, 16384); // ICO size limit
        break;
    }

    if (sizeBytes < 1024) return `${Math.round(sizeBytes)} B`;
    if (sizeBytes < 1024 * 1024) return `${Math.round(sizeBytes / 1024)} KB`;
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handlePresetSelect = (preset: typeof presets[0]) => {
    setSelectedPreset(preset);
    setCustomWidth(preset.width || undefined);
    setCustomHeight(preset.height || undefined);
  };

  const handleExport = () => {
    const exportOptions: ExportOptions = {
      format,
      quality,
      width: customWidth,
      height: customHeight,
      maintainAspectRatio,
      backgroundColor: format === 'jpeg' || format === 'bmp' ? backgroundColor : undefined,
      compression,
      metadata: includeMetadata
    };

    onExport(exportOptions);
    onClose();
  };

  const formatSupportsQuality = ['jpeg', 'webp', 'avif'].includes(format);
  const formatSupportsBackground = ['jpeg', 'bmp', 'pdf'].includes(format);
  const formatSupportsTransparency = ['png', 'webp', 'avif', 'gif', 'ico'].includes(format);

  const currentDimensions = {
    width: customWidth || getOriginalDimensions().width,
    height: customHeight || getOriginalDimensions().height
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Advanced Export</h3>
                <p className="text-sm text-gray-600">Export in any format with professional options</p>
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

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Format Selection */}
            <div className="space-y-6">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
                <div className="grid grid-cols-2 gap-3">
                  {exportFormats.map((fmt) => (
                    <button
                      key={fmt.value}
                      onClick={() => setFormat(fmt.value as any)}
                      className={`p-4 rounded-lg border text-left transition-all hover:shadow-md ${
                        format === fmt.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        {fmt.icon}
                        <span className="font-medium">{fmt.label}</span>
                      </div>
                      <p className="text-xs text-gray-500">{fmt.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality Settings */}
              {formatSupportsQuality && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality ({quality}%)
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={quality}
                    onChange={(e) => setQuality(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Smaller file</span>
                    <span>Best quality</span>
                  </div>
                </div>
              )}

              {/* Background Color */}
              {formatSupportsBackground && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-lg text-sm font-mono"
                      placeholder="#ffffff"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Used for transparent areas in {format.toUpperCase()} format
                  </p>
                </div>
              )}

              {/* Compression Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compression Level
                </label>
                <select
                  value={compression}
                  onChange={(e) => setCompression(e.target.value as any)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="none">None (Largest file)</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium (Recommended)</option>
                  <option value="high">High (Smallest file)</option>
                </select>
              </div>

              {/* Metadata */}
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={includeMetadata}
                    onChange={(e) => setIncludeMetadata(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Include Metadata</span>
                    <p className="text-xs text-gray-500">Embed creation date and software info</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Right Column - Size & Presets */}
            <div className="space-y-6">
              {/* Size Presets */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Size Presets</label>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {presets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handlePresetSelect(preset)}
                      className={`p-3 text-left rounded-lg text-sm transition-all ${
                        selectedPreset.name === preset.name
                          ? 'border-blue-500 bg-blue-50 text-blue-700 border'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 border'
                      }`}
                    >
                      <div className="font-medium">{preset.name}</div>
                      {preset.width && (
                        <div className="text-gray-500 text-xs mt-1">
                          {preset.width}×{preset.height}px
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Dimensions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Custom Dimensions</label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Width (px)</label>
                    <input
                      type="number"
                      value={customWidth || ''}
                      onChange={(e) => setCustomWidth(e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Auto"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Height (px)</label>
                    <input
                      type="number"
                      value={customHeight || ''}
                      onChange={(e) => setCustomHeight(e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Auto"
                    />
                  </div>
                </div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={maintainAspectRatio}
                    onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-600">Lock aspect ratio</span>
                </label>
              </div>

              {/* Export Summary */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2 mb-3">
                  <Settings className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Export Summary</span>
                </div>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Format:</span>
                    <span className="font-medium text-gray-900">{format.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dimensions:</span>
                    <span className="font-medium text-gray-900">
                      {currentDimensions.width}×{currentDimensions.height}px
                    </span>
                  </div>
                  {formatSupportsQuality && (
                    <div className="flex justify-between">
                      <span>Quality:</span>
                      <span className="font-medium text-gray-900">{quality}%</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Estimated size:</span>
                    <span className="font-medium text-gray-900">{getFileSize(currentDimensions)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transparency:</span>
                    <span className="font-medium text-gray-900">
                      {formatSupportsTransparency ? 'Supported' : 'Not supported'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 p-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              className="flex-1 p-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center justify-center space-x-2 font-medium"
            >
              <Download className="w-4 h-4" />
              <span>Export {format.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};