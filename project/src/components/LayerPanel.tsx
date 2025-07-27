import React, { useState } from 'react';
import { Layers, Eye, EyeOff, Trash2, Copy, Lock, Unlock, ChevronUp, ChevronDown, Plus, Image as ImageIcon, Type } from 'lucide-react';
import { Layer, BlendMode } from '../types/editor';

interface LayerPanelProps {
  layers: Layer[];
  activeLayerId: string | null;
  onLayerSelect: (layerId: string) => void;
  onLayerVisibilityToggle: (layerId: string) => void;
  onLayerOpacityChange: (layerId: string, opacity: number) => void;
  onLayerBlendModeChange: (layerId: string, blendMode: BlendMode) => void;
  onLayerDelete: (layerId: string) => void;
  onLayerDuplicate: (layerId: string) => void;
  onLayerReorder: (layerId: string, direction: 'up' | 'down') => void;
  onLayerLockToggle: (layerId: string) => void;
  onAddLayer: () => void;
  onLayerRename: (layerId: string, newName: string) => void;
  onLayerPositionChange?: (layerId: string, position: { x: number; y: number }) => void;
}

const blendModes: { value: BlendMode; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'soft-light', label: 'Soft Light' },
  { value: 'hard-light', label: 'Hard Light' },
  { value: 'color-dodge', label: 'Color Dodge' },
  { value: 'color-burn', label: 'Color Burn' },
  { value: 'darken', label: 'Darken' },
  { value: 'lighten', label: 'Lighten' },
  { value: 'difference', label: 'Difference' },
  { value: 'exclusion', label: 'Exclusion' },
];

export const LayerPanel: React.FC<LayerPanelProps> = ({
  layers,
  activeLayerId,
  onLayerSelect,
  onLayerVisibilityToggle,
  onLayerOpacityChange,
  onLayerBlendModeChange,
  onLayerDelete,
  onLayerDuplicate,
  onLayerReorder,
  onLayerLockToggle,
  onAddLayer,
  onLayerRename,
  onLayerPositionChange
}) => {
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleNameEdit = (layer: Layer) => {
    setEditingLayerId(layer.id);
    setEditingName(layer.name);
  };

  const handleNameSave = (layerId: string) => {
    onLayerRename(layerId, editingName);
    setEditingLayerId(null);
  };

  const handleNameCancel = () => {
    setEditingLayerId(null);
    setEditingName('');
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 h-full overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">Layers</h3>
          </div>
          <span className="text-sm text-gray-500">{layers.length}</span>
        </div>
        
        {/* Add Layer Button */}
        <button
          onClick={onAddLayer}
          className="w-full p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Layer</span>
        </button>
      </div>

      {/* Active Layer Controls */}
      {activeLayerId && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          {(() => {
            const activeLayer = layers.find(l => l.id === activeLayerId);
            if (!activeLayer) return null;
            
            return (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Opacity ({Math.round(activeLayer.opacity * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={activeLayer.opacity * 100}
                    onChange={(e) => onLayerOpacityChange(activeLayer.id, parseInt(e.target.value) / 100)}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Blend Mode
                  </label>
                  <select
                    value={activeLayer.blendMode}
                    onChange={(e) => onLayerBlendModeChange(activeLayer.id, e.target.value as BlendMode)}
                    className="w-full p-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {blendModes.map((mode) => (
                      <option key={mode.value} value={mode.value}>
                        {mode.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto">
        {layers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No layers yet</p>
            <p className="text-xs text-gray-400">Add an image to get started</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {/* Render layers in reverse order (top layer first) */}
            {[...layers].reverse().map((layer, displayIndex) => {
              const actualIndex = layers.length - 1 - displayIndex;
              const isActive = layer.id === activeLayerId;
              const isEditing = editingLayerId === layer.id;
              
              return (
                <div
                  key={layer.id}
                  className={`group relative border rounded-lg transition-all duration-200 hover:shadow-sm ${
                    isActive 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div
                    className="p-3 cursor-pointer"
                    onClick={() => onLayerSelect(layer.id)}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Thumbnail */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                        {layer.thumbnail ? (
                          <img
                            src={layer.thumbnail}
                            alt={layer.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      {/* Layer Info */}
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={() => handleNameSave(layer.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleNameSave(layer.id);
                              if (e.key === 'Escape') handleNameCancel();
                            }}
                            className="w-full text-sm font-medium bg-white border border-indigo-500 rounded px-2 py-1"
                            autoFocus
                          />
                        ) : (
                          <h4
                            className="text-sm font-medium text-gray-900 truncate cursor-pointer hover:text-indigo-600"
                            onDoubleClick={() => handleNameEdit(layer)}
                          >
                            {layer.name}
                          </h4>
                        )}
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {Math.round(layer.opacity * 100)}%
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500 capitalize">
                            {layer.blendMode}
                          </span>
                        </div>
                      </div>
                      
                      {/* Lock Status */}
                      {layer.locked && (
                        <Lock className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  {/* Layer Controls */}
                  <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Visibility Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLayerVisibilityToggle(layer.id);
                      }}
                      className={`p-1 rounded transition-colors ${
                        layer.visible 
                          ? 'text-gray-600 hover:text-gray-800' 
                          : 'text-gray-300 hover:text-gray-500'
                      }`}
                      title={layer.visible ? 'Hide layer' : 'Show layer'}
                    >
                      {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    
                    {/* Lock Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLayerLockToggle(layer.id);
                      }}
                      className="p-1 rounded text-gray-600 hover:text-gray-800 transition-colors"
                      title={layer.locked ? 'Unlock layer' : 'Lock layer'}
                    >
                      {layer.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {/* Bottom Controls */}
                  {isActive && (
                    <div className="border-t border-gray-200 p-2 bg-gray-50">
                      <div className="flex items-center justify-between">
                        {/* Reorder Controls */}
                        <div className="flex space-x-1">
                          <button
                            onClick={() => onLayerReorder(layer.id, 'up')}
                            disabled={actualIndex === layers.length - 1}
                            className="p-1 rounded text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Move up"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onLayerReorder(layer.id, 'down')}
                            disabled={actualIndex === 0}
                            className="p-1 rounded text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Move down"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Action Controls */}
                        <div className="flex space-x-1">
                          <button
                            onClick={() => onLayerDuplicate(layer.id)}
                            className="p-1 rounded text-gray-500 hover:text-gray-700"
                            title="Duplicate layer"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onLayerDelete(layer.id)}
                            disabled={layers.length === 1}
                            className="p-1 rounded text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete layer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};