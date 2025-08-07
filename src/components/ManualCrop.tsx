import React, { useState, useRef, useEffect } from 'react';
import { Check, X, RotateCw, Square, Maximize } from 'lucide-react';

interface CropBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ManualCropProps {
  image: HTMLImageElement;
  onCrop: (bounds: CropBounds) => void;
  onCancel: () => void;
  isActive: boolean;
}

const aspectRatios = [
  { name: 'Free', ratio: null },
  { name: '1:1', ratio: 1 },
  { name: '4:3', ratio: 4/3 },
  { name: '16:9', ratio: 16/9 },
  { name: '3:2', ratio: 3/2 },
  { name: '2:3', ratio: 2/3 },
];

export const ManualCrop: React.FC<ManualCropProps> = ({
  image,
  onCrop,
  onCancel,
  isActive
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cropBounds, setCropBounds] = useState<CropBounds>({
    x: 50,
    y: 50,
    width: 200,
    height: 200
  });
  const [selectedRatio, setSelectedRatio] = useState(aspectRatios[0]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);

  useEffect(() => {
    if (isActive && image) {
      drawCropInterface();
    }
  }, [isActive, image, cropBounds, showGrid]);

  const drawCropInterface = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !image) return;

    canvas.width = 800;
    canvas.height = 600;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    const aspectRatio = image.width / image.height;
    let drawWidth = Math.min(400, image.width);
    let drawHeight = drawWidth / aspectRatio;

    if (drawHeight > 300) {
      drawHeight = 300;
      drawWidth = drawHeight * aspectRatio;
    }

    const imageX = (canvas.width - drawWidth) / 2;
    const imageY = (canvas.height - drawHeight) / 2;

    ctx.drawImage(image, imageX, imageY, drawWidth, drawHeight);

    // Draw crop overlay
    const cropX = imageX + (cropBounds.x / image.width) * drawWidth;
    const cropY = imageY + (cropBounds.y / image.height) * drawHeight;
    const cropW = (cropBounds.width / image.width) * drawWidth;
    const cropH = (cropBounds.height / image.height) * drawHeight;

    // Darken areas outside crop
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.clearRect(cropX, cropY, cropW, cropH);
    ctx.drawImage(image, imageX, imageY, drawWidth, drawHeight);
    
    // Redraw darkened areas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, cropX, canvas.height);
    ctx.fillRect(cropX + cropW, 0, canvas.width - cropX - cropW, canvas.height);
    ctx.fillRect(cropX, 0, cropW, cropY);
    ctx.fillRect(cropX, cropY + cropH, cropW, canvas.height - cropY - cropH);

    // Draw crop border
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropX, cropY, cropW, cropH);

    // Draw corner handles
    const handleSize = 8;
    ctx.fillStyle = '#3B82F6';
    ctx.fillRect(cropX - handleSize/2, cropY - handleSize/2, handleSize, handleSize);
    ctx.fillRect(cropX + cropW - handleSize/2, cropY - handleSize/2, handleSize, handleSize);
    ctx.fillRect(cropX - handleSize/2, cropY + cropH - handleSize/2, handleSize, handleSize);
    ctx.fillRect(cropX + cropW - handleSize/2, cropY + cropH - handleSize/2, handleSize, handleSize);

    // Draw rule of thirds grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(cropX + cropW/3, cropY);
      ctx.lineTo(cropX + cropW/3, cropY + cropH);
      ctx.moveTo(cropX + 2*cropW/3, cropY);
      ctx.lineTo(cropX + 2*cropW/3, cropY + cropH);
      
      // Horizontal lines
      ctx.moveTo(cropX, cropY + cropH/3);
      ctx.lineTo(cropX + cropW, cropY + cropH/3);
      ctx.moveTo(cropX, cropY + 2*cropH/3);
      ctx.lineTo(cropX + cropW, cropY + 2*cropH/3);
      ctx.stroke();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDragging(true);
    setDragStart({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;

    setCropBounds(prev => ({
      ...prev,
      x: Math.max(0, Math.min(image.width - prev.width, prev.x + deltaX * 2)),
      y: Math.max(0, Math.min(image.height - prev.height, prev.y + deltaY * 2))
    }));

    setDragStart({ x, y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const applyCrop = () => {
    onCrop(cropBounds);
  };

  const resetCrop = () => {
    setCropBounds({
      x: image.width * 0.1,
      y: image.height * 0.1,
      width: image.width * 0.8,
      height: image.height * 0.8
    });
  };

  const applyAspectRatio = (ratio: typeof aspectRatios[0]) => {
    setSelectedRatio(ratio);
    
    if (ratio.ratio) {
      const currentAspect = cropBounds.width / cropBounds.height;
      if (Math.abs(currentAspect - ratio.ratio) > 0.1) {
        const newHeight = cropBounds.width / ratio.ratio;
        setCropBounds(prev => ({
          ...prev,
          height: Math.min(newHeight, image.height - prev.y)
        }));
      }
    }
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Crop Image</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-lg transition-colors ${
                showGrid ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Square className="w-4 h-4" />
            </button>
            <button
              onClick={resetCrop}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={onCancel}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex">
          {/* Canvas */}
          <div className="flex-1 p-6 flex items-center justify-center bg-gray-50">
            <canvas
              ref={canvasRef}
              className="border border-gray-300 rounded-lg shadow-lg cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>

          {/* Controls */}
          <div className="w-64 p-6 bg-white border-l border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-4">Aspect Ratio</h4>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {aspectRatios.map((ratio) => (
                <button
                  key={ratio.name}
                  onClick={() => applyAspectRatio(ratio)}
                  className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedRatio.name === ratio.name
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {ratio.name}
                </button>
              ))}
            </div>

            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Position:</span>
                <div>X: {Math.round(cropBounds.x)}px</div>
                <div>Y: {Math.round(cropBounds.y)}px</div>
              </div>
              <div>
                <span className="font-medium">Size:</span>
                <div>W: {Math.round(cropBounds.width)}px</div>
                <div>H: {Math.round(cropBounds.height)}px</div>
              </div>
            </div>

            <div className="mt-8 flex space-x-2">
              <button
                onClick={onCancel}
                className="flex-1 p-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={applyCrop}
                className="flex-1 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
              >
                <Check className="w-4 h-4" />
                <span>Apply</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};