import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Type, Plus, Edit3 } from 'lucide-react';
import { TextTool, TextData } from './TextTool';

interface TextManagerProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  zoom: number;
  pan: { x: number; y: number };
  isActive: boolean;
  onToggle: () => void;
  layers: any[];
  activeLayerId: string | null;
  layerOperations: any;
  textElements: Map<string, any>;
}

export const TextManager: React.FC<TextManagerProps> = ({
  canvasRef,
  zoom,
  pan,
  isActive,
  onToggle,
  layers,
  activeLayerId,
  layerOperations,
  textElements
}) => {
  const [showTextTool, setShowTextTool] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  const handleAddText = useCallback((textData: TextData) => {
    // If no canvas exists yet, create a default canvas size
    if (!canvasRef.current) {
      console.log('Creating text without existing canvas - will be positioned for 1920x1080');
    }
    
    if (editingTextId) {
      // Update existing text layer
      layerOperations.updateTextLayer(editingTextId, textData);
      setEditingTextId(null);
    } else {
      // Add new text layer
      layerOperations.addTextLayer(textData);
    }
    setShowTextTool(false);
  }, [editingTextId, layerOperations]);

  const handleNewText = useCallback(() => {
    setEditingTextId(null);
    setShowTextTool(true);
  }, []);

  const handleEditActiveText = useCallback(() => {
    if (activeLayerId && layerOperations.isTextLayer(activeLayerId)) {
      setEditingTextId(activeLayerId);
      setShowTextTool(true);
    }
  }, [activeLayerId, layerOperations]);

  // Get initial text data for editing
  const getInitialTextData = (): TextData => {
    if (editingTextId) {
      const storedTextData = layerOperations.getTextData(editingTextId);
      if (storedTextData) {
        return storedTextData;
      }
    }
    
    // Calculate center position based on actual canvas size
    const canvas = canvasRef.current;
    let defaultX = 960; // Fallback center position for 1920x1080
    let defaultY = 540; // Fallback center position for 1920x1080
    
    if (canvas) {
      defaultX = canvas.width / 2;
      defaultY = canvas.height / 2;
      console.log(`📍 TEXT AT CANVAS CENTER: ${defaultX}, ${defaultY} (Canvas: ${canvas.width}x${canvas.height})`);
    } else {
      // If no canvas yet, try to get dimensions from first layer
      const firstLayer = layers[0];
      if (firstLayer) {
        defaultX = firstLayer.image.width / 2;
        defaultY = firstLayer.image.height / 2;
        console.log(`📍 TEXT AT IMAGE CENTER: ${defaultX}, ${defaultY} (Image: ${firstLayer.image.width}x${firstLayer.image.height})`);
      } else {
        console.log(`📍 TEXT AT FALLBACK CENTER: ${defaultX}, ${defaultY}`);
      }
    }

    return {
      text: 'Your Amazing Text',
      x: defaultX,
      y: defaultY,
      fontSize: 32,
      fontFamily: 'Arial',
      color: '#000000',
      bold: false,
      italic: false,
      underline: false,
      align: 'center',
      rotation: 0,
      letterSpacing: 0,
      lineHeight: 1.2,
      textTransform: 'none',
      strokeColor: '#FFFFFF',
      strokeWidth: 0,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        blur: 0,
        color: '#00000040'
      },
      glow: {
        blur: 0,
        color: '#FFFFFF',
        intensity: 0
      },
      gradient: {
        enabled: false,
        type: 'linear',
        colors: ['#FF0000', '#0000FF'],
        angle: 45
      },
      background: {
        enabled: false,
        color: '#FFFFFF',
        padding: 10,
        borderRadius: 5
      }
    };
  };

  // Check if active layer is a text layer
  const activeLayerIsText = activeLayerId && layerOperations.isTextLayer(activeLayerId);
  const textLayersCount = layers.filter(layer => layerOperations.isTextLayer(layer.id)).length;

  if (!isActive) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 left-20 p-3 bg-blue-600 text-white rounded-xl shadow-lg border border-blue-200 hover:shadow-xl hover:bg-blue-700 transition-all duration-300 z-30"
        title="Text Tool (T)"
      >
        <Type className="w-5 h-5" />
      </button>
    );
  }

  return (
    <>
      {/* Text Tool Panel */}
      <div className="fixed bottom-4 left-20 z-30">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-3 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Type className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">Text Tool</span>
              </div>
              <button
                onClick={onToggle}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="p-3 space-y-2">
            {/* Add New Text Button */}
            <button
              onClick={handleNewText}
              className="w-full p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Text Layer</span>
            </button>
            
            {/* Edit Active Text Button */}
            {activeLayerIsText && (
              <button
                onClick={handleEditActiveText}
                className="w-full p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Selected Text</span>
              </button>
            )}
            
            {/* Instructions */}
            <div className="text-xs text-gray-600 space-y-1 pt-2 border-t border-gray-200">
              <div className="font-medium text-gray-700 mb-1">How to Move Text:</div>
              <div>1. Select a text layer in Layers panel</div>
              <div>2. Click and DRAG the text on canvas</div>
              <div>3. Text moves freely anywhere!</div>
              <div>4. Text is independent of photo</div>
              {textLayersCount > 0 && (
                <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                  <div className="text-green-700 font-medium text-xs">
                    {textLayersCount} text layer{textLayersCount > 1 ? 's' : ''} created
                  </div>
                  {activeLayerIsText ? (
                    <div className="text-green-600 text-xs">Text layer selected - DRAG IT to move!</div>
                  ) : (
                    <div className="text-blue-600 text-xs">Select text layer first, then drag!</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Text Tool Modal */}
      {showTextTool && (
        <TextTool
          isActive={showTextTool}
          onClose={() => {
            setShowTextTool(false);
            setEditingTextId(null);
          }}
          onAddText={handleAddText}
          initialData={getInitialTextData()}
        />
      )}
    </>
  );
};