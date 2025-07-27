import React, { useState, useRef, useEffect } from 'react';
import { Eye, Split, RotateCcw } from 'lucide-react';
import { ImageState } from '../types/editor';

interface BeforeAfterCompareProps {
  originalImage: HTMLImageElement;
  currentState: ImageState;
  isVisible: boolean;
  onToggle: () => void;
}

export const BeforeAfterCompare: React.FC<BeforeAfterCompareProps> = ({
  originalImage,
  currentState,
  isVisible,
  onToggle
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [compareMode, setCompareMode] = useState<'side-by-side' | 'split' | 'overlay'>('side-by-side');
  const [splitPosition, setSplitPosition] = useState(50);
  const [overlayOpacity, setOverlayOpacity] = useState(50);

  useEffect(() => {
    if (isVisible && originalImage) {
      drawComparison();
    }
  }, [isVisible, originalImage, currentState, compareMode, splitPosition, overlayOpacity]);

  const applyFilters = (ctx: CanvasRenderingContext2D) => {
    const filters = [];

    if (currentState.brightness !== 0) {
      filters.push(`brightness(${100 + currentState.brightness}%)`);
    }
    if (currentState.contrast !== 0) {
      filters.push(`contrast(${100 + currentState.contrast}%)`);
    }
    if (currentState.saturation !== 0) {
      filters.push(`saturate(${100 + currentState.saturation}%)`);
    }
    if (currentState.blur > 0) {
      filters.push(`blur(${currentState.blur}px)`);
    }

    switch (currentState.filter) {
      case 'grayscale':
        filters.push('grayscale(100%)');
        break;
      case 'sepia':
        filters.push('sepia(100%)');
        break;
      case 'vintage':
        filters.push('sepia(60%) contrast(1.2) brightness(0.9)');
        break;
      case 'vibrant':
        filters.push('saturate(1.5) contrast(1.1)');
        break;
      case 'cool':
        filters.push('hue-rotate(180deg) saturate(1.2)');
        break;
      case 'warm':
        filters.push('hue-rotate(30deg) saturate(1.1) brightness(1.1)');
        break;
    }

    ctx.filter = filters.length > 0 ? filters.join(' ') : 'none';
  };

  const drawComparison = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !originalImage) return;

    const width = 400;
    const height = 300;
    canvas.width = width;
    canvas.height = height;

    const aspectRatio = originalImage.width / originalImage.height;
    let drawWidth = width;
    let drawHeight = width / aspectRatio;

    if (drawHeight > height) {
      drawHeight = height;
      drawWidth = height * aspectRatio;
    }

    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    switch (compareMode) {
      case 'side-by-side':
        // Draw original (left half)
        ctx.save();
        ctx.filter = 'none';
        ctx.drawImage(
          originalImage,
          offsetX,
          offsetY,
          drawWidth / 2,
          drawHeight,
          0,
          0,
          width / 2,
          height
        );
        ctx.restore();

        // Draw processed (right half)
        ctx.save();
        applyFilters(ctx);
        ctx.drawImage(
          originalImage,
          offsetX + drawWidth / 2,
          offsetY,
          drawWidth / 2,
          drawHeight,
          width / 2,
          0,
          width / 2,
          height
        );
        ctx.restore();

        // Draw center line
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();
        break;

      case 'split':
        const splitX = (splitPosition / 100) * width;

        // Draw original (left side)
        ctx.save();
        ctx.filter = 'none';
        ctx.drawImage(originalImage, offsetX, offsetY, drawWidth, drawHeight);
        ctx.restore();

        // Draw processed (right side with clipping)
        ctx.save();
        ctx.beginPath();
        ctx.rect(splitX, 0, width - splitX, height);
        ctx.clip();
        applyFilters(ctx);
        ctx.drawImage(originalImage, offsetX, offsetY, drawWidth, drawHeight);
        ctx.restore();

        // Draw split line
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(splitX, 0);
        ctx.lineTo(splitX, height);
        ctx.stroke();
        break;

      case 'overlay':
        // Draw original
        ctx.save();
        ctx.filter = 'none';
        ctx.drawImage(originalImage, offsetX, offsetY, drawWidth, drawHeight);
        ctx.restore();

        // Draw processed with opacity
        ctx.save();
        ctx.globalAlpha = overlayOpacity / 100;
        applyFilters(ctx);
        ctx.drawImage(originalImage, offsetX, offsetY, drawWidth, drawHeight);
        ctx.restore();
        break;
    }

    // Draw labels
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('Before', 8, 20);
    ctx.fillText('After', width - 35, 20);
  };

  const handleSplitDrag = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newPosition = (x / canvas.offsetWidth) * 100;
    setSplitPosition(Math.max(0, Math.min(100, newPosition)));
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 left-4 p-3 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 z-30"
      >
        <Split className="w-5 h-5 text-gray-600" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white rounded-xl shadow-xl border border-gray-200 z-30 overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Split className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Before/After</span>
          </div>
          <button
            onClick={onToggle}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <Eye className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Mode Controls */}
        <div className="flex space-x-1">
          {[
            { key: 'side-by-side', label: 'Side' },
            { key: 'split', label: 'Split' },
            { key: 'overlay', label: 'Overlay' }
          ].map((mode) => (
            <button
              key={mode.key}
              onClick={() => setCompareMode(mode.key as any)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                compareMode === mode.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="p-3">
        <canvas
          ref={canvasRef}
          className="border border-gray-200 rounded cursor-crosshair"
          onClick={compareMode === 'split' ? handleSplitDrag : undefined}
          onMouseMove={compareMode === 'split' ? handleSplitDrag : undefined}
        />
      </div>

      {/* Controls */}
      <div className="p-3 pt-0">
        {compareMode === 'split' && (
          <div>
            <label className="block text-xs text-gray-600 mb-1">Split Position</label>
            <input
              type="range"
              min="0"
              max="100"
              value={splitPosition}
              onChange={(e) => setSplitPosition(parseInt(e.target.value))}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        )}

        {compareMode === 'overlay' && (
          <div>
            <label className="block text-xs text-gray-600 mb-1">Overlay Opacity</label>
            <input
              type="range"
              min="0"
              max="100"
              value={overlayOpacity}
              onChange={(e) => setOverlayOpacity(parseInt(e.target.value))}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        )}
      </div>
    </div>
  );
};