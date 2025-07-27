import { useState, useCallback, useRef } from 'react';
import { ImageState, HistoryState, FilterType, Layer, BlendMode } from '../types/editor';
import { removeBackground } from '../services/backgroundRemover';
import { analyzeImageHistogram, getImageDataFromCanvas } from '../services/imageAnalysis';
import { sharpenImage, analyzeImageSharpness } from '../services/imageSharpening';
import { autoCropImage, centerCropImage } from '../services/autoCrop';
import { extractColorPalette } from '../services/colorAnalysis';

const initialImageState: ImageState = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0,
  rotation: 0,
  flipX: false,
  flipY: false,
  filter: 'none',
  crop: null,
};

const generateLayerId = (): string => {
  return `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const generateThumbnail = (image: HTMLImageElement): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  const size = 48;
  canvas.width = size;
  canvas.height = size;
  
  const aspectRatio = image.width / image.height;
  let drawWidth = size;
  let drawHeight = size;
  
  if (aspectRatio > 1) {
    drawHeight = size / aspectRatio;
  } else {
    drawWidth = size * aspectRatio;
  }
  
  const offsetX = (size - drawWidth) / 2;
  const offsetY = (size - drawHeight) / 2;
  
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  return canvas.toDataURL();
};

export const useImageEditor = () => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: initialImageState,
    future: []
  });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingBackground, setIsProcessingBackground] = useState(false);
  const [colorPalette, setColorPalette] = useState<{r: number, g: number, b: number}[]>([]);
  const [paletteStats, setPaletteStats] = useState<{processingTime: number, totalPixelsAnalyzed: number, samplingRate: number} | null>(null);
  const [vignetteIntensity, setVignetteIntensity] = useState(0);
  const [vignetteRadius, setVignetteRadius] = useState(50);
  const [processingTimes, setProcessingTimes] = useState<{[key: string]: number}>({});

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const processedImageRef = useRef<HTMLCanvasElement | null>(null);
  const [textElements, setTextElements] = useState<Map<string, any>>(new Map());

  const updateProcessingTime = useCallback((operation: string, time: number) => {
    setProcessingTimes(prev => ({
      ...prev,
      [operation]: time
    }));
  }, []);

  const updateVignette = useCallback((intensity: number, radius: number) => {
    setVignetteIntensity(intensity);
    setVignetteRadius(radius);
  }, []);

  const createLayerFromImage = useCallback((img: HTMLImageElement, name?: string): Layer => {
    const layerId = generateLayerId();
    return {
      id: layerId,
      name: name || `Layer ${layers.length + 1}`,
      image: img,
      visible: true,
      opacity: 1,
      blendMode: 'normal',
      position: { x: 0, y: 0 },
      scale: { x: 1, y: 1 },
      rotation: 0,
      imageState: { ...initialImageState },
      locked: false,
      thumbnail: generateThumbnail(img)
    };
  }, [layers.length]);

  const addToHistory = useCallback((newState: ImageState) => {
    setHistory(prev => ({
      past: [...prev.past, prev.present],
      present: newState,
      future: []
    }));
  }, []);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, prev.past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future]
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture
      };
    });
  }, []);

  const updateImageState = useCallback((updates: Partial<ImageState>) => {
    // Update global state for single image mode
    const newState = { ...history.present, ...updates };
    addToHistory(newState);
    
    // Also update active layer's image state if in layer mode
    if (activeLayerId) {
      setLayers(prev => prev.map(layer => 
        layer.id === activeLayerId 
          ? { ...layer, imageState: { ...layer.imageState, ...updates } }
          : layer
      ));
    }
  }, [history.present, addToHistory]);

  const loadImage = useCallback((file: File | File[]) => {
    setIsLoading(true);
    
    const files = Array.isArray(file) ? file : [file];
    let loadedCount = 0;
    const newLayers: Layer[] = [];
    
    const handleImageLoad = () => {
      loadedCount++;
      if (loadedCount === files.length) {
        // All images loaded
        if (newLayers.length > 0) {
          setLayers(prev => [...prev, ...newLayers]);
          setActiveLayerId(newLayers[0].id);
          
          // Set main image to first layer for backward compatibility
          setImage(newLayers[0].image);
          originalImageRef.current = newLayers[0].image;
        }
        
        setHistory({
          past: [],
          present: initialImageState,
          future: []
        });
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setIsLoading(false);
      }
    };
    
    files.forEach((f, index) => {
      const img = new Image();
      img.onload = () => {
        const layer = createLayerFromImage(img, `${f.name.split('.')[0]} ${index + 1}`);
        newLayers.push(layer);
        handleImageLoad();
      };
      img.onerror = () => {
        console.error(`Error loading ${f.name}`);
        handleImageLoad();
      };
      img.src = URL.createObjectURL(f);
    });
  }, []);

  const addLayer = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) {
        loadImage(files);
      }
    };
    input.click();
  }, [loadImage]);

  const layerOperations = {
    selectLayer: useCallback((layerId: string) => {
      setActiveLayerId(layerId);
      const layer = layers.find(l => l.id === layerId);
      if (layer) {
        setImage(layer.image);
        setHistory(prev => ({
          ...prev,
          present: layer.imageState
        }));
      }
    }, [layers]),
    
    toggleVisibility: useCallback((layerId: string) => {
      setLayers(prev => prev.map(layer => 
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      ));
    }, []),
    
    changeOpacity: useCallback((layerId: string, opacity: number) => {
      setLayers(prev => prev.map(layer => 
        layer.id === layerId ? { ...layer, opacity } : layer
      ));
    }, []),
    
    changeBlendMode: useCallback((layerId: string, blendMode: BlendMode) => {
      setLayers(prev => prev.map(layer => 
        layer.id === layerId ? { ...layer, blendMode } : layer
      ));
    }, []),
    
    deleteLayer: useCallback((layerId: string) => {
      setLayers(prev => {
        const newLayers = prev.filter(layer => layer.id !== layerId);
        if (newLayers.length === 0) {
          setActiveLayerId(null);
          setImage(null);
          return [];
        }
        
        // If deleting active layer, select another one
        if (layerId === activeLayerId) {
          const newActiveLayer = newLayers[0];
          setActiveLayerId(newActiveLayer.id);
          setImage(newActiveLayer.image);
        }
        
        return newLayers;
      });
    }, [activeLayerId]),
    
    duplicateLayer: useCallback((layerId: string) => {
      const layer = layers.find(l => l.id === layerId);
      if (layer) {
        const duplicatedLayer: Layer = {
          ...layer,
          id: generateLayerId(),
          name: `${layer.name} Copy`
        };
        setLayers(prev => [...prev, duplicatedLayer]);
      }
    }, [layers]),
    
    reorderLayer: useCallback((layerId: string, direction: 'up' | 'down') => {
      setLayers(prev => {
        const index = prev.findIndex(l => l.id === layerId);
        if (index === -1) return prev;
        
        const newIndex = direction === 'up' ? index + 1 : index - 1;
        if (newIndex < 0 || newIndex >= prev.length) return prev;
        
        const newLayers = [...prev];
        [newLayers[index], newLayers[newIndex]] = [newLayers[newIndex], newLayers[index]];
        return newLayers;
      });
    }, []),
    
    toggleLock: useCallback((layerId: string) => {
      setLayers(prev => prev.map(layer => 
        layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
      ));
    }, []),
    
    renameLayer: useCallback((layerId: string, newName: string) => {
      setLayers(prev => prev.map(layer => 
        layer.id === layerId ? { ...layer, name: newName } : layer
      ));
    }, []),
    
    updateLayerImage: useCallback((layerId: string, newImage: HTMLImageElement) => {
      setLayers(prev => prev.map(layer => 
        layer.id === layerId 
          ? { ...layer, image: newImage, thumbnail: generateThumbnail(newImage) }
          : layer
      ));
    }, []),

    updateLayerPosition: useCallback((layerId: string, position: { x: number; y: number }) => {
      setLayers(prev => prev.map(layer => 
        layer.id === layerId 
          ? { ...layer, position }
          : layer
      ));
    }, []),
    
    addLayerFromImage: useCallback((image: HTMLImageElement, name?: string) => {
      const newLayer = createLayerFromImage(image, name);
      setLayers(prev => [...prev, newLayer]);
      setActiveLayerId(newLayer.id);
      return newLayer;
    }, [createLayerFromImage]),

    addTextLayer: useCallback((textData: any) => {
      const layerId = generateLayerId();
      
      console.log(`🎯 ADDING TEXT: Input position (${textData.x}, ${textData.y})`);
      
      // Create a canvas sized for the text content only
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Set up text rendering to measure the text first
      let fontStyle = '';
      if (textData.italic) fontStyle += 'italic ';
      if (textData.bold) fontStyle += 'bold ';
      
      ctx.font = `${fontStyle}${textData.fontSize}px ${textData.fontFamily}`;
      
      // Apply text transform
      let displayText = textData.text;
      switch (textData.textTransform) {
        case 'uppercase': displayText = displayText.toUpperCase(); break;
        case 'lowercase': displayText = displayText.toLowerCase(); break;
        case 'capitalize': 
          displayText = displayText.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
          break;
      }
      
      // Measure text dimensions
      const lines = displayText.split('\n');
      const lineHeight = textData.fontSize * textData.lineHeight;
      let maxWidth = 0;
      
      lines.forEach(line => {
        const metrics = ctx.measureText(line);
        maxWidth = Math.max(maxWidth, metrics.width);
      });
      
      const textWidth = maxWidth + textData.fontSize; // Add padding
      const textHeight = lines.length * lineHeight + textData.fontSize; // Add padding
      
      // Set canvas size to fit the text content
      canvas.width = textWidth;
      canvas.height = textHeight;
      
      console.log(`📝 Creating text canvas: ${textWidth}x${textHeight} for "${textData.text}"`);
      
      // Set up text rendering with high quality
      ctx.textRenderingOptimization = 'optimizeQuality';
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Clear canvas with transparent background
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Reapply text styling (canvas was resized)
      fontStyle = '';
      if (textData.italic) fontStyle += 'italic ';
      if (textData.bold) fontStyle += 'bold ';
      
      ctx.font = `${fontStyle}${textData.fontSize}px ${textData.fontFamily}`;
      ctx.textAlign = textData.align;
      ctx.textBaseline = 'middle';
      
      // Handle multi-line text
      const totalHeight = lines.length * lineHeight;
      const startY = canvas.height / 2 - totalHeight / 2 + lineHeight / 2;
      
      lines.forEach((line, index) => {
        const lineY = startY + index * lineHeight;
        const centerX = canvas.width / 2;
        
        // Apply glow effect if enabled
        if (textData.glow && textData.glow.blur > 0) {
          ctx.save();
          ctx.shadowColor = textData.glow.color;
          ctx.shadowBlur = textData.glow.blur;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          for (let i = 0; i < textData.glow.intensity * 3; i++) {
            ctx.fillStyle = textData.glow.color;
            ctx.fillText(line, centerX, lineY);
          }
          ctx.restore();
        }
        
        // Apply shadow if enabled
        if (textData.shadow && (textData.shadow.offsetX !== 0 || textData.shadow.offsetY !== 0)) {
          ctx.save();
          ctx.shadowOffsetX = textData.shadow.offsetX;
          ctx.shadowOffsetY = textData.shadow.offsetY;
          ctx.shadowBlur = textData.shadow.blur;
          ctx.shadowColor = textData.shadow.color;
        }
        
        // Draw stroke if enabled
        if (textData.strokeWidth && textData.strokeWidth > 0) {
          ctx.strokeStyle = textData.strokeColor || '#FFFFFF';
          ctx.lineWidth = textData.strokeWidth;
          ctx.lineJoin = 'round';
          ctx.strokeText(line, centerX, lineY);
        }
        
        // Draw main text
        if (textData.gradient?.enabled) {
          const metrics = ctx.measureText(line);
          let gradient;
          
          if (textData.gradient.type === 'linear') {
            const angle = (textData.gradient.angle * Math.PI) / 180;
            const length = Math.max(metrics.width, lineHeight);
            gradient = ctx.createLinearGradient(
              centerX - Math.cos(angle) * length / 2,
              lineY - Math.sin(angle) * length / 2,
              centerX + Math.cos(angle) * length / 2,
              lineY + Math.sin(angle) * length / 2
            );
          } else {
            gradient = ctx.createRadialGradient(
              centerX, lineY, 0, 
              centerX, lineY, Math.max(metrics.width, lineHeight) / 2
            );
          }
          
          textData.gradient.colors.forEach((color: string, i: number) => {
            gradient.addColorStop(i / (textData.gradient!.colors.length - 1), color);
          });
          
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = textData.color;
        }
        
        ctx.fillText(line, centerX, lineY);
        
        // Draw underline if enabled
        if (textData.underline) {
          const metrics = ctx.measureText(line);
          const underlineY = lineY + textData.fontSize * 0.15;
          ctx.beginPath();
          
          let startX = centerX;
          if (textData.align === 'center') startX -= metrics.width / 2;
          else if (textData.align === 'right') startX -= metrics.width;
          
          ctx.moveTo(startX, underlineY);
          ctx.lineTo(startX + metrics.width, underlineY);
          ctx.strokeStyle = textData.gradient?.enabled ? 'currentColor' : textData.color;
          ctx.lineWidth = Math.max(1, textData.fontSize * 0.08);
          ctx.stroke();
        }
        
        if (textData.shadow && (textData.shadow.offsetX !== 0 || textData.shadow.offsetY !== 0)) {
          ctx.restore();
        }
      });
      
      // Generate thumbnail for layer panel
      const thumbnailCanvas = document.createElement('canvas');
      const thumbCtx = thumbnailCanvas.getContext('2d')!;
      thumbnailCanvas.width = 48;
      thumbnailCanvas.height = 48;
      
      thumbCtx.fillStyle = '#F3F4F6';
      thumbCtx.fillRect(0, 0, 48, 48);
      
      thumbCtx.fillStyle = textData.color;
      thumbCtx.font = '12px Arial';
      thumbCtx.textAlign = 'center';
      thumbCtx.textBaseline = 'middle';
      thumbCtx.fillText('T', 24, 24);
      
      // Calculate center position for the layer - use the textData coordinates!
      let centerX = textData.x || 400; // Use passed coordinates or fallback
      let centerY = textData.y || 300; // Use passed coordinates or fallback
      
      console.log(`🎯 FINAL TEXT POSITION: (${centerX}, ${centerY})`);
      
      // Create image from canvas
      const img = new Image();
      img.onload = () => {
        const textLayer: Layer = {
          id: layerId,
          name: `Text: ${textData.text.substring(0, 20)}${textData.text.length > 20 ? '...' : ''}`,
          image: img,
          visible: true,
          opacity: 1,
          blendMode: 'normal',
          position: { x: centerX, y: centerY }, // Position layer at center
          scale: { x: 1, y: 1 },
          rotation: 0,
          imageState: { ...initialImageState },
          locked: false,
          thumbnail: thumbnailCanvas.toDataURL()
        };
        
        setLayers(prev => [...prev, textLayer]);
        setActiveLayerId(layerId);
        
        // Store text data for editing
        setTextElements(prev => new Map(prev.set(layerId, textData)));
        
        console.log(`✅ TEXT ADDED AT CENTER: (${centerX}, ${centerY})`);
      };
      img.src = canvas.toDataURL();
      return layerId;
    }, []),

    updateTextLayer: useCallback((layerId: string, textData: any) => {
      console.log(`🔄 UPDATING TEXT: Position (${textData.x}, ${textData.y})`);
      
      // Re-render text with same logic as addTextLayer
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Set up text rendering to measure the text first
      let fontStyle = '';
      if (textData.italic) fontStyle += 'italic ';
      if (textData.bold) fontStyle += 'bold ';
      
      ctx.font = `${fontStyle}${textData.fontSize}px ${textData.fontFamily}`;
      
      // Apply text transform
      let displayText = textData.text;
      switch (textData.textTransform) {
        case 'uppercase': displayText = displayText.toUpperCase(); break;
        case 'lowercase': displayText = displayText.toLowerCase(); break;
        case 'capitalize': 
          displayText = displayText.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
          break;
      }
      
      // Measure text dimensions
      const lines = displayText.split('\n');
      const lineHeight = textData.fontSize * textData.lineHeight;
      let maxWidth = 0;
      
      lines.forEach(line => {
        const metrics = ctx.measureText(line);
        maxWidth = Math.max(maxWidth, metrics.width);
      });
      
      const textWidth = maxWidth + textData.fontSize;
      const textHeight = lines.length * lineHeight + textData.fontSize;
      
      // Set canvas size to fit the text content
      canvas.width = textWidth;
      canvas.height = textHeight;
      
      // Apply same rendering logic as addTextLayer
      ctx.textRenderingOptimization = 'optimizeQuality';
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Reapply text styling
      fontStyle = '';
      if (textData.italic) fontStyle += 'italic ';
      if (textData.bold) fontStyle += 'bold ';
      
      ctx.font = `${fontStyle}${textData.fontSize}px ${textData.fontFamily}`;
      ctx.textAlign = textData.align;
      ctx.textBaseline = 'middle';
      
      const totalHeight = lines.length * lineHeight;
      const startY = canvas.height / 2 - totalHeight / 2 + lineHeight / 2;
      
      lines.forEach((line, index) => {
        const lineY = startY + index * lineHeight;
        const centerX = canvas.width / 2;
        
        if (textData.glow && textData.glow.blur > 0) {
          ctx.save();
          ctx.shadowColor = textData.glow.color;
          ctx.shadowBlur = textData.glow.blur;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          for (let i = 0; i < textData.glow.intensity * 3; i++) {
            ctx.fillStyle = textData.glow.color;
            ctx.fillText(line, centerX, lineY);
          }
          ctx.restore();
        }
        
        if (textData.shadow && (textData.shadow.offsetX !== 0 || textData.shadow.offsetY !== 0)) {
          ctx.save();
          ctx.shadowOffsetX = textData.shadow.offsetX;
          ctx.shadowOffsetY = textData.shadow.offsetY;
          ctx.shadowBlur = textData.shadow.blur;
          ctx.shadowColor = textData.shadow.color;
        }
        
        if (textData.strokeWidth && textData.strokeWidth > 0) {
          ctx.strokeStyle = textData.strokeColor || '#FFFFFF';
          ctx.lineWidth = textData.strokeWidth;
          ctx.lineJoin = 'round';
          ctx.strokeText(line, centerX, lineY);
        }
        
        if (textData.gradient?.enabled) {
          const metrics = ctx.measureText(line);
          let gradient;
          
          if (textData.gradient.type === 'linear') {
            const angle = (textData.gradient.angle * Math.PI) / 180;
            const length = Math.max(metrics.width, lineHeight);
            gradient = ctx.createLinearGradient(
              centerX - Math.cos(angle) * length / 2,
              lineY - Math.sin(angle) * length / 2,
              centerX + Math.cos(angle) * length / 2,
              lineY + Math.sin(angle) * length / 2
            );
          } else {
            gradient = ctx.createRadialGradient(
              centerX, lineY, 0, 
              centerX, lineY, Math.max(metrics.width, lineHeight) / 2
            );
          }
          
          textData.gradient.colors.forEach((color: string, i: number) => {
            gradient.addColorStop(i / (textData.gradient!.colors.length - 1), color);
          });
          
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = textData.color;
        }
        
        ctx.fillText(line, centerX, lineY);
        
        if (textData.underline) {
          const metrics = ctx.measureText(line);
          const underlineY = lineY + textData.fontSize * 0.15;
          ctx.beginPath();
          
          let startX = centerX;
          if (textData.align === 'center') startX -= metrics.width / 2;
          else if (textData.align === 'right') startX -= metrics.width;
          
          ctx.moveTo(startX, underlineY);
          ctx.lineTo(startX + metrics.width, underlineY);
          ctx.strokeStyle = textData.gradient?.enabled ? 'currentColor' : textData.color;
          ctx.lineWidth = Math.max(1, textData.fontSize * 0.08);
          ctx.stroke();
        }
        
        if (textData.shadow && (textData.shadow.offsetX !== 0 || textData.shadow.offsetY !== 0)) {
          ctx.restore();
        }
      });
      
      const thumbnailCanvas = document.createElement('canvas');
      const thumbCtx = thumbnailCanvas.getContext('2d')!;
      thumbnailCanvas.width = 48;
      thumbnailCanvas.height = 48;
      
      thumbCtx.fillStyle = '#F3F4F6';
      thumbCtx.fillRect(0, 0, 48, 48);
      
      thumbCtx.fillStyle = textData.color;
      thumbCtx.font = '12px Arial';
      thumbCtx.textAlign = 'center';
      thumbCtx.textBaseline = 'middle';
      thumbCtx.fillText('T', 24, 24);
      
      const img = new Image();
      img.onload = () => {
        setLayers(prev => prev.map(layer => 
          layer.id === layerId 
            ? { 
                ...layer, 
                image: img, 
                name: `Text: ${textData.text.substring(0, 20)}${textData.text.length > 20 ? '...' : ''}`,
                position: { x: textData.x, y: textData.y }, // Use the coordinates from textData
                rotation: 0,
                thumbnail: thumbnailCanvas.toDataURL()
              }
            : layer
        ));
        
        // Update stored text data
        setTextElements(prev => new Map(prev.set(layerId, textData)));
      };
      img.src = canvas.toDataURL();
    }, []),

    getTextData: useCallback((layerId: string) => {
      return textElements.get(layerId);
    }, [textElements]),

    isTextLayer: useCallback((layerId: string) => {
      return textElements.has(layerId);
    }, [textElements])
  };

  const resetImage = useCallback(() => {
    setHistory({
      past: [],
      present: initialImageState,
      future: []
    });
    setLayers([]);
    setActiveLayerId(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const exportImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = canvas.toDataURL();
    link.click();
  }, []);

  const handleRemoveBackground = useCallback(async () => {
    if (!image || isProcessingBackground || !activeLayerId) return;

    setIsProcessingBackground(true);
    try {
      // Process background removal with pixel alpha masking
      const processedImageData = await removeBackground(image, {
        segmentationThreshold: 0.5,
        flipHorizontal: false
      });

      // Create a canvas with the processed image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = processedImageData.width;
      canvas.height = processedImageData.height;
      ctx.putImageData(processedImageData, 0, 0);
      
      // Create a new image element from the processed canvas
      const processedImage = new Image();
      processedImage.onload = () => {
        // Update the active layer
        setLayers(prev => prev.map(layer => 
          layer.id === activeLayerId 
            ? { ...layer, image: processedImage, thumbnail: generateThumbnail(processedImage) }
            : layer
        ));
        setImage(processedImage);
      };
      processedImage.src = canvas.toDataURL();
      
    } catch (error) {
      console.error('Background removal failed:', error);
      alert('Background removal failed. Please try again.');
    } finally {
      setIsProcessingBackground(false);
    }
  }, [image, isProcessingBackground, activeLayerId]);

  const handleAutoEnhance = useCallback(async () => {
    if (!image || !canvasRef.current || !activeLayerId) return;

    setIsLoading(true);
    try {
      // Get current image data from canvas
      const imageData = getImageDataFromCanvas(canvasRef.current);
      
      // Analyze the image
      const analysis = analyzeImageHistogram(imageData);
      
      console.log('Image Analysis Results:', {
        averageLuminance: analysis.averageLuminance.toFixed(1),
        contrastLevel: (analysis.contrastLevel * 100).toFixed(1) + '%',
        saturationLevel: (analysis.saturationLevel * 100).toFixed(1) + '%',
        recommendedBrightness: analysis.recommendedBrightness.toFixed(1),
        recommendedContrast: analysis.recommendedContrast.toFixed(1),
        recommendedSaturation: analysis.recommendedSaturation.toFixed(1)
      });
      
      // Apply the recommended adjustments
      const enhancedState = {
        brightness: Math.round(analysis.recommendedBrightness),
        contrast: Math.round(analysis.recommendedContrast),
        saturation: Math.round(analysis.recommendedSaturation)
      };
      
      updateImageState(enhancedState);
      
    } catch (error) {
      console.error('Auto enhance failed:', error);
      alert('Auto enhance failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [image, canvasRef, activeLayerId, updateImageState]);

  const handleSharpenImage = useCallback(async () => {
    if (!image || !canvasRef.current || !activeLayerId) return;

    setIsLoading(true);
    try {
      console.log('🔥 STARTING IMAGE SHARPENING...');
      
      // Get image data directly from the source image
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCanvas.width = image.width;
      tempCanvas.height = image.height;
      tempCtx.drawImage(image, 0, 0);
      
      const imageData = tempCtx.getImageData(0, 0, image.width, image.height);
      
      // Analyze current sharpness
      const currentSharpness = analyzeImageSharpness(imageData);
      console.log(`Current image sharpness: ${currentSharpness.toFixed(1)}/100`);
      
      // Determine optimal sharpening intensity
      let intensity = 1.0;
      
      if (currentSharpness < 20) {
        intensity = 2.0; // Very blurry
      } else if (currentSharpness < 40) {
        intensity = 1.5; // Moderately blurry
      } else {
        intensity = 0.8; // Already fairly sharp
      }
      
      console.log(`🚀 Applying sharpening with intensity ${intensity}`);
      
      // Apply sharpening
      const result = await sharpenImage(imageData, { intensity });
      
      console.log(`✅ SHARPENING COMPLETED in ${result.processingTime.toFixed(2)}ms`);
      updateProcessingTime('sharpening', result.processingTime);
      
      // Create canvas with sharpened data
      tempCtx.putImageData(result.imageData, 0, 0);
      
      // Create new image element
      const sharpenedImage = new Image();
      sharpenedImage.onload = () => {
        console.log('✅ SHARPENING SUCCESS! Image updated.');
        
        // Update the active layer
        layerOperations.updateLayerImage(activeLayerId, sharpenedImage);
        setImage(sharpenedImage);
      };
      sharpenedImage.src = tempCanvas.toDataURL();
      
    } catch (error) {
      console.error('Image sharpening failed:', error);
      console.log('❌ SHARPENING FAILED');
    } finally {
      setIsLoading(false);
    }
  }, [image, canvasRef, activeLayerId, layerOperations, updateProcessingTime]);

  const handleAutoCrop = useCallback(async () => {
    if (!image || !canvasRef.current || !activeLayerId) return;

    setIsLoading(true);
    try {
      console.log('Starting auto-crop process...');
      
      // Try AI-powered auto-crop first
      let result;
      try {
        result = await autoCropImage(image, {
          segmentationThreshold: 0.6,
          paddingPercentage: 0.15,
          minCropSize: 200,
          flipHorizontal: false
        });
        
        console.log('Auto-crop results:', {
          subjectDetected: result.subjectDetected,
          subjectCoverage: `${result.subjectCoverage.toFixed(1)}%`,
          cropDimensions: `${result.cropBounds.width}x${result.cropBounds.height}`,
          processingTime: `${result.processingTime.toFixed(2)}ms`
        });
        
      } catch (aiError) {
        console.warn('AI auto-crop failed, falling back to center crop:', aiError);
        // Fallback to center crop
        result = await centerCropImage(image, 0.8);
      }
      
      // Create a canvas with the cropped image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = result.croppedImageData.width;
      canvas.height = result.croppedImageData.height;
      ctx.putImageData(result.croppedImageData, 0, 0);
      
      // Create a new image element from the cropped canvas
      const croppedImage = new Image();
      croppedImage.onload = () => {
        // Update the active layer
        setLayers(prev => prev.map(layer => 
          layer.id === activeLayerId 
            ? { ...layer, image: croppedImage, thumbnail: generateThumbnail(croppedImage) }
            : layer
        ));
        setImage(croppedImage);
        
        // Reset zoom and pan for the new crop
        setZoom(1);
        setPan({ x: 0, y: 0 });
        
        // Show user feedback
        if (result.subjectDetected) {
          console.log(`✅ Subject detected! Cropped to ${result.cropBounds.width}×${result.cropBounds.height} with ${result.subjectCoverage.toFixed(1)}% subject coverage.`);
        } else {
          console.log(`ℹ️ No clear subject detected. Applied center crop to ${result.cropBounds.width}×${result.cropBounds.height}.`);
        }
      };
      croppedImage.src = canvas.toDataURL();
      
    } catch (error) {
      console.error('Auto-crop failed:', error);
      alert('Auto-crop failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [image, canvasRef, activeLayerId]);

  const handleColorPalette = useCallback(async () => {
    if (!image || !canvasRef.current) return;

    setIsLoading(true);
    try {
      // Get current image data from canvas
      const imageData = getImageDataFromCanvas(canvasRef.current);
      
      console.log('Extracting color palette using K-means clustering...');
      
      // Extract dominant colors using K-means clustering
      const result = await extractColorPalette(imageData, 5);
      
      console.log('Color palette extraction completed:', {
        colors: result.colors.map(c => `rgb(${c.r}, ${c.g}, ${c.b})`),
        processingTime: `${result.processingTime.toFixed(2)}ms`,
        pixelsAnalyzed: result.totalPixelsAnalyzed.toLocaleString(),
        samplingRate: `${(result.samplingRate * 100).toFixed(2)}%`
      });
      
      // Update state with extracted colors and stats
      setColorPalette(result.colors);
      setPaletteStats({
        processingTime: result.processingTime,
        totalPixelsAnalyzed: result.totalPixelsAnalyzed,
        samplingRate: result.samplingRate
      });
      
    } catch (error) {
      console.error('Color palette extraction failed:', error);
      alert('Color palette extraction failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [image, canvasRef]);

  const clearColorPalette = useCallback(() => {
    setColorPalette([]);
    setPaletteStats(null);
  }, []);

  return {
    image,
    layers,
    activeLayerId,
    imageState: history.present,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    zoom,
    pan,
    isLoading,
    isProcessingBackground,
    canvasRef,
    originalImageRef,
    loadImage,
    addLayer,
    layerOperations,
    updateImageState,
    undo,
    redo,
    resetImage,
    exportImage,
    setZoom,
    setPan,
    handleRemoveBackground,
    handleAutoEnhance,
    handleSharpenImage,
    handleAutoCrop,
    handleColorPalette,
    colorPalette,
    paletteStats,
    clearColorPalette,
    vignetteIntensity,
    vignetteRadius,
    updateVignette,
    processingTimes,
    updateProcessingTime,
    textElements
  };
}