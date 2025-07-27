import React, { useEffect, useRef, useCallback } from 'react';
import { ImageState, FilterType, Layer } from '../types/editor';
import { ColorPalette } from './ColorPalette';

interface CanvasProps {
  image: HTMLImageElement | null;
  layers?: Layer[];
  imageState: ImageState;
  zoom: number;
  pan: { x: number; y: number };
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onZoomChange: (zoom: number) => void;
  onPanChange: (pan: { x: number; y: number }) => void;
  activeLayerId?: string | null;
  onLayerPositionChange?: (layerId: string, position: { x: number; y: number }) => void;
  colorPalette?: {r: number, g: number, b: number}[];
  paletteStats?: {processingTime: number, totalPixelsAnalyzed: number, samplingRate: number} | null;
  onClearColorPalette?: () => void;
  vignetteIntensity?: number;
  vignetteRadius?: number;
}

export const Canvas: React.FC<CanvasProps> = ({
  image,
  layers = [],
  imageState,
  zoom,
  pan,
  canvasRef,
  onZoomChange,
  onPanChange,
  activeLayerId,
  onLayerPositionChange,
  colorPalette = [],
  paletteStats,
  onClearColorPalette,
  vignetteIntensity = 0,
  vignetteRadius = 50
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const isDraggingLayer = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const originalLayerPos = useRef({ x: 0, y: 0 });
  const lastMousePos = useRef({ x: 0, y: 0 });

  const drawCheckerboard = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const squareSize = 20;
    const lightColor = '#f8f9fa';
    const darkColor = '#e9ecef';

    for (let x = 0; x < width; x += squareSize) {
      for (let y = 0; y < height; y += squareSize) {
        const isEven = (Math.floor(x / squareSize) + Math.floor(y / squareSize)) % 2 === 0;
        ctx.fillStyle = isEven ? lightColor : darkColor;
        ctx.fillRect(x, y, squareSize, squareSize);
      }
    }
  };

  const applyImageAdjustments = (ctx: CanvasRenderingContext2D, layerImageState: ImageState) => {
    const filters = [];

    if (layerImageState.brightness !== 0) {
      filters.push(`brightness(${100 + layerImageState.brightness}%)`);
    }
    if (layerImageState.contrast !== 0) {
      filters.push(`contrast(${100 + layerImageState.contrast}%)`);
    }
    if (layerImageState.saturation !== 0) {
      filters.push(`saturate(${100 + layerImageState.saturation}%)`);
    }
    if (layerImageState.blur > 0) {
      filters.push(`blur(${layerImageState.blur}px)`);
    }

    switch (layerImageState.filter) {
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

  const applyVignette = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (vignetteIntensity === 0) return;

    ctx.save();
    
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
    const vignetteRadiusPixels = (vignetteRadius / 100) * maxRadius;

    const gradient = ctx.createRadialGradient(
      centerX, centerY, vignetteRadiusPixels,
      centerX, centerY, maxRadius
    );
    
    const vignetteAlpha = vignetteIntensity / 100;
    gradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
    gradient.addColorStop(1, `rgba(0, 0, 0, ${vignetteAlpha})`);

    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    ctx.restore();
  };

  const applyBlendMode = (ctx: CanvasRenderingContext2D, blendMode: string) => {
    switch (blendMode) {
      case 'multiply':
        ctx.globalCompositeOperation = 'multiply';
        break;
      case 'screen':
        ctx.globalCompositeOperation = 'screen';
        break;
      case 'overlay':
        ctx.globalCompositeOperation = 'overlay';
        break;
      case 'soft-light':
        ctx.globalCompositeOperation = 'soft-light';
        break;
      case 'hard-light':
        ctx.globalCompositeOperation = 'hard-light';
        break;
      case 'color-dodge':
        ctx.globalCompositeOperation = 'color-dodge';
        break;
      case 'color-burn':
        ctx.globalCompositeOperation = 'color-burn';
        break;
      case 'darken':
        ctx.globalCompositeOperation = 'darken';
        break;
      case 'lighten':
        ctx.globalCompositeOperation = 'lighten';
        break;
      case 'difference':
        ctx.globalCompositeOperation = 'difference';
        break;
      case 'exclusion':
        ctx.globalCompositeOperation = 'exclusion';
        break;
      default:
        ctx.globalCompositeOperation = 'source-over';
    }
  };

  const calculateOptimalCanvasSize = (img: HTMLImageElement) => {
    const container = containerRef.current;
    if (!container) return { width: 800, height: 600 };

    const containerRect = container.getBoundingClientRect();
    const maxWidth = Math.min(1400, containerRect.width - 40);
    const maxHeight = Math.min(900, containerRect.height - 40);
    
    const aspectRatio = img.width / img.height;
    
    let canvasWidth, canvasHeight;
    
    if (aspectRatio > maxWidth / maxHeight) {
      canvasWidth = maxWidth;
      canvasHeight = maxWidth / aspectRatio;
    } else {
      canvasHeight = maxHeight;
      canvasWidth = maxHeight * aspectRatio;
    }
    
    // Ensure minimum size for small images
    const minSize = 400;
    if (canvasWidth < minSize && canvasHeight < minSize) {
      if (aspectRatio > 1) {
        canvasWidth = minSize;
        canvasHeight = minSize / aspectRatio;
      } else {
        canvasHeight = minSize;
        canvasWidth = minSize * aspectRatio;
      }
    }
    
    return {
      width: Math.round(canvasWidth),
      height: Math.round(canvasHeight)
    };
  };

  const drawImageWithAdjustments = (
    ctx: CanvasRenderingContext2D, 
    img: HTMLImageElement, 
    adjustments: ImageState, 
    canvasWidth: number, 
    canvasHeight: number
  ) => {
    ctx.save();

    // Calculate image size to fill canvas optimally
    const imgAspect = img.width / img.height;
    const canvasAspect = canvasWidth / canvasHeight;
    
    let drawWidth, drawHeight;
    
    // Cover canvas completely while maintaining aspect ratio
    if (imgAspect > canvasAspect) {
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imgAspect;
    } else {
      drawHeight = canvasHeight;
      drawWidth = canvasHeight * imgAspect;
    }

    // Apply transformations
    ctx.translate(canvasWidth / 2 + pan.x, canvasHeight / 2 + pan.y);
    ctx.scale(zoom, zoom);

    // Apply rotation
    ctx.rotate((adjustments.rotation * Math.PI) / 180);

    // Apply flips
    ctx.scale(adjustments.flipX ? -1 : 1, adjustments.flipY ? -1 : 1);

    // Apply filters with high quality rendering
    applyImageAdjustments(ctx, adjustments);
    
    // Enable high quality image rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

    ctx.restore();
  };

  // Renamed function for drawing the base/primary image that covers the canvas
  const drawBaseImage = (
    ctx: CanvasRenderingContext2D, 
    img: HTMLImageElement, 
    adjustments: ImageState, 
    canvasWidth: number, 
    canvasHeight: number
  ) => {
    ctx.save();

    // Calculate image size to cover canvas completely
    const imgAspect = img.width / img.height;
    const canvasAspect = canvasWidth / canvasHeight;
    
    let drawWidth, drawHeight;
    
    // Cover mode: fill entire canvas, crop if necessary
    if (imgAspect > canvasAspect) {
      // Image is wider than canvas - fit to height and crop width
      drawHeight = canvasHeight;
      drawWidth = canvasHeight * imgAspect;
    } else {
      // Image is taller than canvas - fit to width and crop height
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imgAspect;
    }

    // Apply transformations
    ctx.translate(canvasWidth / 2 + pan.x, canvasHeight / 2 + pan.y);
    ctx.scale(zoom, zoom);

    // Apply rotation
    ctx.rotate((adjustments.rotation * Math.PI) / 180);

    // Apply flips
    ctx.scale(adjustments.flipX ? -1 : 1, adjustments.flipY ? -1 : 1);

    // Apply filters with high quality rendering
    applyImageAdjustments(ctx, adjustments);
    
    // Enable high quality image rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

    ctx.restore();
  };

  const drawLayer = (ctx: CanvasRenderingContext2D, layer: Layer, canvasWidth: number, canvasHeight: number) => {
    if (!layer.visible || layer.opacity === 0) return;

    ctx.save();

    // Get layer dimensions
    const layerWidth = layer.image.width;
    const layerHeight = layer.image.height;
    

    // Apply layer transforms (position is absolute, not relative to pan)
    ctx.translate(layer.position.x + pan.x, layer.position.y + pan.y);
    ctx.scale(zoom * layer.scale.x, zoom * layer.scale.y);
    ctx.rotate((layer.rotation * Math.PI) / 180);

    // Apply image state transforms
    ctx.rotate((layer.imageState.rotation * Math.PI) / 180);
    ctx.scale(layer.imageState.flipX ? -1 : 1, layer.imageState.flipY ? -1 : 1);

    // Apply opacity and blend mode
    ctx.globalAlpha = layer.opacity;
    applyBlendMode(ctx, layer.blendMode);

    // Apply image adjustments
    applyImageAdjustments(ctx, layer.imageState);

    // High quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw the layer image at its natural size, centered on the position
    ctx.drawImage(layer.image, -layerWidth / 2, -layerHeight / 2, layerWidth, layerHeight);

    ctx.restore();
  };

  // Get mouse position relative to canvas
  const getCanvasMousePos = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom - pan.x;
    const y = (e.clientY - rect.top) / zoom - pan.y;
    
    return { x, y };
  }, [zoom, pan]);

  // Check if mouse is over a layer
  const getLayerUnderMouse = useCallback((mouseX: number, mouseY: number): string | null => {
    if (!activeLayerId) return null;
    
    const activeLayer = layers.find(l => l.id === activeLayerId);
    if (!activeLayer || !activeLayer.visible) return null;
    
    // Simple bounds check for the active layer
    const layerBounds = {
      x: activeLayer.position.x - activeLayer.image.width / 2,
      y: activeLayer.position.y - activeLayer.image.height / 2,
      width: activeLayer.image.width,
      height: activeLayer.image.height
    };
    
    if (mouseX >= layerBounds.x && mouseX <= layerBounds.x + layerBounds.width &&
        mouseY >= layerBounds.y && mouseY <= layerBounds.y + layerBounds.height) {
      return activeLayer.id;
    }
    
    return null;
  }, [activeLayerId, layers]);

  const drawImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Determine canvas size based on image
    const primaryImage = layers.length > 0 ? layers[0].image : image;
    if (!primaryImage) return;

    const optimalSize = calculateOptimalCanvasSize(primaryImage);
    
    // Only resize if significantly different to avoid constant redraws
    if (Math.abs(canvas.width - optimalSize.width) > 10 || Math.abs(canvas.height - optimalSize.height) > 10) {
      canvas.width = optimalSize.width;
      canvas.height = optimalSize.height;
    }

    // Clear and draw background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCheckerboard(ctx, canvas.width, canvas.height);

    if (layers.length > 0) {
      // Draw the first layer as base image (covers entire canvas)
      const baseLayer = layers[0];
      drawBaseImage(ctx, baseLayer.image, baseLayer.imageState, canvas.width, canvas.height);
      
      // Draw remaining layers as overlays at their natural size
      layers.slice(1).forEach(layer => {
        drawLayer(ctx, layer, canvas.width, canvas.height);
      });
    } else if (image) {
      // Single image mode
      drawBaseImage(ctx, image, imageState, canvas.width, canvas.height);
    }

    // Apply vignette effect
    if (vignetteIntensity > 0) {
      applyVignette(ctx, canvas.width, canvas.height);
    }
  };

  useEffect(() => {
    drawImage();
  }, [image, layers, imageState, zoom, pan, vignetteIntensity, vignetteRadius]);

  // Redraw on container resize
  useEffect(() => {
    const handleResize = () => {
      setTimeout(drawImage, 100); // Debounce resize
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, zoom * delta));
    onZoomChange(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const mousePos = getCanvasMousePos(e);
    const layerUnderMouse = getLayerUnderMouse(mousePos.x, mousePos.y);
    
    if (layerUnderMouse && onLayerPositionChange) {
      // Start dragging the layer
      isDraggingLayer.current = true;
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      
      const activeLayer = layers.find(l => l.id === layerUnderMouse);
      if (activeLayer) {
        originalLayerPos.current = { ...activeLayer.position };
      }
    } else {
      // Start panning the canvas
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingLayer.current && activeLayerId && onLayerPositionChange) {
      // Drag the active layer
      const deltaX = (e.clientX - dragStartPos.current.x) / zoom;
      const deltaY = (e.clientY - dragStartPos.current.y) / zoom;
      
      const newPosition = {
        x: originalLayerPos.current.x + deltaX,
        y: originalLayerPos.current.y + deltaY
      };
      
      onLayerPositionChange(activeLayerId, newPosition);
    } else if (isDragging.current) {
      // Pan the canvas
      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;

      onPanChange({
        x: pan.x + deltaX,
        y: pan.y + deltaY
      });

      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    isDraggingLayer.current = false;
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="flex items-center justify-between p-3 sm:p-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-600">
          <span>Zoom: {Math.round(zoom * 100)}%</span>
          {layers.length > 0 && (
            <span>• Layers: {layers.length}</span>
          )}
          {vignetteIntensity > 0 && (
            <span>• Vignette: {vignetteIntensity}%</span>
          )}
          <button
            onClick={() => { onZoomChange(1); onPanChange({ x: 0, y: 0 }); }}
            className="text-blue-600 hover:text-blue-700 transition-colors text-xs sm:text-sm font-medium"
          >
            Reset View
          </button>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => onZoomChange(Math.max(0.1, zoom - 0.1))}
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-2 sm:px-3 py-1 rounded-lg transition-all duration-300 text-sm hover:shadow-sm"
          >
            -
          </button>
          <button
            onClick={() => onZoomChange(Math.min(5, zoom + 0.1))}
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-2 sm:px-3 py-1 rounded-lg transition-all duration-300 text-sm hover:shadow-sm"
          >
            +
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className={`flex-1 flex items-center justify-center overflow-hidden p-4 sm:p-6 lg:p-8 bg-white ${
          isDraggingLayer.current ? 'cursor-move' : isDragging.current ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas
          ref={canvasRef}
          className={`border border-gray-300 rounded-lg shadow-lg max-w-full max-h-full transition-all duration-300 hover:shadow-xl ${
            activeLayerId ? 'cursor-pointer' : ''
          }`}
          style={{ 
            imageRendering: 'high-quality',
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        />
        
        {/* Layer Selection Indicator */}
        {activeLayerId && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
            Selected Layer: {layers.find(l => l.id === activeLayerId)?.name || 'Unknown'}
            <div className="text-blue-300 text-xs">Click and drag to move</div>
          </div>
        )}
      </div>
      
      {/* Color Palette Display */}
      {colorPalette.length > 0 && (
        <div className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
          <ColorPalette
            colors={colorPalette}
            processingTime={paletteStats?.processingTime}
            totalPixelsAnalyzed={paletteStats?.totalPixelsAnalyzed}
            samplingRate={paletteStats?.samplingRate}
            onClose={onClearColorPalette}
          />
        </div>
      )}
    </div>
  );
};