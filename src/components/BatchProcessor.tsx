import React, { useState, useCallback } from 'react';
import { Upload, Play, Download, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface BatchProcessorProps {
  isVisible: boolean;
  onClose: () => void;
}

interface BatchFile {
  id: string;
  file: File;
  image: HTMLImageElement;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: string; // Base64 result
  error?: string;
}

interface ProcessingOptions {
  autoEnhance: boolean;
  removeBackground: boolean;
  sharpen: boolean;
  format: 'png' | 'jpeg' | 'webp';
  quality: number;
  resize: {
    enabled: boolean;
    width: number;
    height: number;
    maintainAspectRatio: boolean;
  };
}

export const BatchProcessor: React.FC<BatchProcessorProps> = ({
  isVisible,
  onClose
}) => {
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [options, setOptions] = useState<ProcessingOptions>({
    autoEnhance: true,
    removeBackground: false,
    sharpen: false,
    format: 'png',
    quality: 90,
    resize: {
      enabled: false,
      width: 1920,
      height: 1080,
      maintainAspectRatio: true
    }
  });

  const handleFileUpload = useCallback((uploadedFiles: FileList) => {
    const newFiles: BatchFile[] = [];
    
    Array.from(uploadedFiles).forEach((file, index) => {
      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          const batchFile: BatchFile = {
            id: `${Date.now()}-${index}`,
            file,
            image: img,
            status: 'pending'
          };
          newFiles.push(batchFile);
          
          if (newFiles.length === uploadedFiles.length) {
            setFiles(prev => [...prev, ...newFiles]);
          }
        };
        img.src = URL.createObjectURL(file);
      }
    });
  }, []);

  const processImage = async (batchFile: BatchFile): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      let { width, height } = batchFile.image;
      
      // Apply resize if enabled
      if (options.resize.enabled) {
        if (options.resize.maintainAspectRatio) {
          const aspectRatio = width / height;
          if (options.resize.width / options.resize.height > aspectRatio) {
            width = options.resize.height * aspectRatio;
            height = options.resize.height;
          } else {
            width = options.resize.width;
            height = options.resize.width / aspectRatio;
          }
        } else {
          width = options.resize.width;
          height = options.resize.height;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw base image
      ctx.drawImage(batchFile.image, 0, 0, width, height);
      
      // Apply filters based on options
      let filters = [];
      
      if (options.autoEnhance) {
        filters.push('contrast(1.1)', 'brightness(1.05)', 'saturate(1.1)');
      }
      
      if (options.sharpen) {
        // Simple sharpening using CSS filter
        filters.push('contrast(1.2)');
      }
      
      if (filters.length > 0) {
        ctx.filter = filters.join(' ');
        ctx.drawImage(canvas, 0, 0);
        ctx.filter = 'none';
      }
      
      // Export in specified format
      const quality = options.quality / 100;
      let mimeType = `image/${options.format}`;
      
      if (options.format === 'jpeg') {
        // Fill background for JPEG (no transparency)
        const imageData = ctx.getImageData(0, 0, width, height);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.putImageData(imageData, 0, 0);
      }
      
      const result = canvas.toDataURL(mimeType, quality);
      resolve(result);
    });
  };

  const startBatchProcessing = async () => {
    setIsProcessing(true);
    
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    for (let i = 0; i < pendingFiles.length; i++) {
      const file = pendingFiles[i];
      
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'processing' } : f
      ));
      
      try {
        const result = await processImage(file);
        
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'completed', result } : f
        ));
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { 
            ...f, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Processing failed'
          } : f
        ));
      }
    }
    
    setIsProcessing(false);
  };

  const downloadAll = () => {
    const completedFiles = files.filter(f => f.status === 'completed' && f.result);
    
    completedFiles.forEach((file, index) => {
      const link = document.createElement('a');
      link.download = `${file.file.name.split('.')[0]}_processed.${options.format}`;
      link.href = file.result!;
      link.click();
      
      // Small delay between downloads
      setTimeout(() => {}, index * 100);
    });
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearAll = () => {
    setFiles([]);
  };

  const getStatusIcon = (status: BatchFile['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 rounded-full bg-gray-300"></div>;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const completedCount = files.filter(f => f.status === 'completed').length;
  const errorCount = files.filter(f => f.status === 'error').length;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg">
                <Play className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Batch Processor</h3>
                <p className="text-sm text-gray-600">🚀 Apply edits to 100+ images at once! Upload multiple photos → Choose effects → Process all simultaneously</p>
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
            {/* Upload & Settings */}
            <div className="lg:col-span-1 space-y-6">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Upload Images</label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer"
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFileUpload(e.dataTransfer.files);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files) handleFileUpload(files);
                    };
                    input.click();
                  }}
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Drop images or click to browse</p>
                </div>
              </div>

              {/* Processing Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Processing Options</label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={options.autoEnhance}
                      onChange={(e) => setOptions(prev => ({ ...prev, autoEnhance: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Auto Enhance</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={options.removeBackground}
                      onChange={(e) => setOptions(prev => ({ ...prev, removeBackground: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Remove Background</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={options.sharpen}
                      onChange={(e) => setOptions(prev => ({ ...prev, sharpen: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Sharpen</span>
                  </label>
                </div>
              </div>

              {/* Export Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Export Settings</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Format</label>
                    <select
                      value={options.format}
                      onChange={(e) => setOptions(prev => ({ ...prev, format: e.target.value as any }))}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="png">PNG</option>
                      <option value="jpeg">JPEG</option>
                      <option value="webp">WebP</option>
                    </select>
                  </div>
                  
                  {(options.format === 'jpeg' || options.format === 'webp') && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Quality ({options.quality}%)</label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={options.quality}
                        onChange={(e) => setOptions(prev => ({ ...prev, quality: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Resize Options */}
              <div>
                <label className="flex items-center space-x-2 mb-3">
                  <input
                    type="checkbox"
                    checked={options.resize.enabled}
                    onChange={(e) => setOptions(prev => ({ 
                      ...prev, 
                      resize: { ...prev.resize, enabled: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Resize Images</span>
                </label>
                
                {options.resize.enabled && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Width</label>
                        <input
                          type="number"
                          value={options.resize.width}
                          onChange={(e) => setOptions(prev => ({ 
                            ...prev, 
                            resize: { ...prev.resize, width: parseInt(e.target.value) }
                          }))}
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Height</label>
                        <input
                          type="number"
                          value={options.resize.height}
                          onChange={(e) => setOptions(prev => ({ 
                            ...prev, 
                            resize: { ...prev.resize, height: parseInt(e.target.value) }
                          }))}
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={options.resize.maintainAspectRatio}
                        onChange={(e) => setOptions(prev => ({ 
                          ...prev, 
                          resize: { ...prev.resize, maintainAspectRatio: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-700">Maintain Aspect Ratio</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* File List */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">
                  Files ({files.length})
                </h4>
                <div className="flex space-x-2">
                  {files.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                  {completedCount > 0 && (
                    <button
                      onClick={downloadAll}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download All</span>
                    </button>
                  )}
                </div>
              </div>

              {files.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Upload className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No files uploaded yet</p>
                  <p className="text-sm">Upload images to start batch processing</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                        <img
                          src={URL.createObjectURL(file.file)}
                          alt={file.file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {file.image.width}×{file.image.height} • {(file.file.size / 1024 / 1024).toFixed(1)}MB
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(file.status)}
                        <button
                          onClick={() => removeFile(file.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Progress Summary */}
              {files.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Progress: {completedCount + errorCount} / {files.length}
                    </span>
                    <div className="flex space-x-4">
                      <span className="text-green-600">✓ {completedCount} completed</span>
                      {errorCount > 0 && (
                        <span className="text-red-600">✗ {errorCount} failed</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((completedCount + errorCount) / files.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Process Button */}
              {files.length > 0 && (
                <div className="mt-6">
                  <button
                    onClick={startBatchProcessing}
                    disabled={isProcessing || files.filter(f => f.status === 'pending').length === 0}
                    className="w-full p-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        <span>Start Processing</span>
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