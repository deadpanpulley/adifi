import React, { useCallback } from 'react';
import { Upload, Image } from 'lucide-react';

interface DropZoneProps {
  onFileSelect: (file: File | File[]) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileSelect }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        onFileSelect(imageFiles.length === 1 ? imageFiles[0] : imageFiles);
      }
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      onFileSelect(files.length === 1 ? files[0] : files);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="w-full max-w-2xl mx-4 sm:mx-8 border-2 border-dashed border-gray-300 rounded-xl p-8 sm:p-12 lg:p-16 text-center hover:border-blue-500 transition-all duration-300 hover:bg-blue-50/50 bg-white shadow-sm"
      >
        <div className="space-y-4 sm:space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <Image className="w-16 h-16 sm:w-20 lg:w-24 sm:h-20 lg:h-24 text-gray-400 transition-all duration-300" />
              <Upload className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-blue-600 absolute -bottom-1 -right-1 bg-white border border-gray-200 rounded-full p-1 transition-all duration-300 shadow-sm" />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              Drop your images here
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              Upload single or multiple images to create layers
            </p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileInput}
              className="hidden"
              id="drop-zone-input"
            />
            <label
              htmlFor="drop-zone-input"
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg cursor-pointer transition-all duration-300 font-medium text-sm sm:text-base shadow-sm hover:shadow-md"
            >
              <Upload className="w-5 h-5" />
              <span>Choose Images</span>
            </label>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            Supports JPG, PNG, GIF, and WebP • Multiple files supported
          </p>
        </div>
      </div>
    </div>
  );
};