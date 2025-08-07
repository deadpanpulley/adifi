import React, { useState } from 'react';
import { Sliders, Palette, RotateCw, ChevronDown, ChevronUp, X, Scissors, Loader2, Wand2, Focus, Crop, Pipette, Circle, Type, Layers } from 'lucide-react';
import { ImageState, FilterType } from '../types/editor';
import { VignetteControl } from './VignetteControl';

interface ToolPanelProps {
  imageState: ImageState;
  onUpdateState: (updates: Partial<ImageState>) => void;
  onRemoveBackground: () => Promise<void>;
  isProcessingBackground: boolean;
  onAutoEnhance: () => Promise<void>;
  onSharpenImage: () => Promise<void>;
  onAutoCrop: () => Promise<void>;
  onColorPalette: () => Promise<void>;
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
  vignetteIntensity?: number;
  vignetteRadius?: number;
  onVignetteChange?: (intensity: number, radius: number) => void;
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  isOpen,
  onToggle,
  children
}) => {
  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-all duration-300"
      >
        <div className="flex items-center space-x-3">
          {icon}
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="text-gray-600 transition-transform duration-300 ease-out">
          {isOpen ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </div>
      </button>
      
      <div 
        className={`transition-all duration-300 ease-out overflow-hidden ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 pt-0 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  min,
  max,
  onChange
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} ({value})
      </label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider transition-all duration-300"
      />
    </div>
  );
};

export const ToolPanel: React.FC<ToolPanelProps> = ({ 
  imageState, 
  onUpdateState, 
  onRemoveBackground,
  isProcessingBackground,
  onAutoEnhance,
  onSharpenImage,
  onAutoCrop,
  onColorPalette,
  isMobile, 
  isOpen, 
  onClose,
  vignetteIntensity = 0,
  vignetteRadius = 50,
  onVignetteChange
}) => {
  const [adjustmentsOpen, setAdjustmentsOpen] = useState(true);
  const [effectsOpen, setEffectsOpen] = useState(false);

  const filters: { name: string; value: FilterType }[] = [
    { name: 'None', value: 'none' },
    { name: 'Grayscale', value: 'grayscale' },
    { name: 'Sepia', value: 'sepia' },
    { name: 'Vintage', value: 'vintage' },
    { name: 'Vibrant', value: 'vibrant' },
    { name: 'Cool', value: 'cool' },
    { name: 'Warm', value: 'warm' },
  ];

  return (
    <div className={`${isMobile ? 'w-full h-full' : 'w-80'} bg-white ${isMobile ? '' : 'border-r'} border-gray-200 h-full overflow-y-auto`}>
      {/* Mobile Header */}
      {isMobile && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-gray-900">Edit Tools</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className={`${isMobile ? 'p-4' : 'p-6'} space-y-4 sm:space-y-6`}>
        {/* Auto Enhance */}
        <div>
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <Type className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Add Text</h3>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Type className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-blue-800">Text Tool Active!</span>
            </div>
            <p className="text-sm text-blue-700">
              Use the <strong>Text button</strong> in header toolbar or press <kbd className="px-1 bg-blue-200 rounded text-xs font-mono">T</kbd> to add text layers
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <Layers className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Layers</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Layer panel automatically opens when you add images or text. Toggle with <kbd className="px-1 bg-gray-200 rounded text-xs">L</kbd> key
          </p>
        </div>

        <div>
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <Wand2 className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">Auto Enhance</h3>
          </div>
          <button
            onClick={onAutoEnhance}
            className="w-full p-3 rounded-lg font-medium transition-all duration-300 bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-center space-x-2">
              <Wand2 className="w-5 h-5" />
              <span>Auto Enhance</span>
            </div>
          </button>
        </div>

        {/* Image Sharpening */}
        <div>
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <Focus className="w-5 h-5 text-cyan-600" />
            <h3 className="text-lg font-semibold text-gray-900">Sharpen</h3>
          </div>
          <button
            onClick={onSharpenImage}
            className="w-full p-3 rounded-lg font-medium transition-all duration-300 bg-cyan-500 hover:bg-cyan-600 text-white shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-center space-x-2">
              <Focus className="w-5 h-5" />
              <span>Sharpen Image</span>
            </div>
          </button>
        </div>

        {/* Auto Crop */}
        <div>
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <Crop className="w-5 h-5 text-violet-600" />
            <h3 className="text-lg font-semibold text-gray-900">Auto Crop</h3>
          </div>
          <button
            onClick={onAutoCrop}
            className="w-full p-3 rounded-lg font-medium transition-all duration-300 bg-violet-500 hover:bg-violet-600 text-white shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-center space-x-2">
              <Crop className="w-5 h-5" />
              <span>Auto Crop</span>
            </div>
          </button>
        </div>

        {/* Color Palette */}
        <div>
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <Pipette className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Color Palette</h3>
          </div>
          <button
            onClick={onColorPalette}
            className="w-full p-3 rounded-lg font-medium transition-all duration-300 bg-purple-500 hover:bg-purple-600 text-white shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-center space-x-2">
              <Pipette className="w-5 h-5" />
              <span>Extract Colors</span>
            </div>
          </button>
        </div>

        {/* Collapsible Adjustments */}
        <CollapsibleSection
          title="Adjustments"
          icon={<Sliders className="w-5 h-5 text-blue-600" />}
          isOpen={adjustmentsOpen}
          onToggle={() => setAdjustmentsOpen(!adjustmentsOpen)}
        >
          <SliderControl
            label="Brightness"
            value={imageState.brightness}
            min={-100}
            max={100}
            onChange={(value) => onUpdateState({ brightness: value })}
          />
          
          <SliderControl
            label="Contrast"
            value={imageState.contrast}
            min={-100}
            max={100}
            onChange={(value) => onUpdateState({ contrast: value })}
          />
          
          <SliderControl
            label="Saturation"
            value={imageState.saturation}
            min={-100}
            max={100}
            onChange={(value) => onUpdateState({ saturation: value })}
          />
          
          <SliderControl
            label="Blur"
            value={imageState.blur}
            min={0}
            max={20}
            onChange={(value) => onUpdateState({ blur: value })}
          />
        </CollapsibleSection>

        {/* Effects & Vignette */}
        <CollapsibleSection
          title="Effects"
          icon={<Circle className="w-5 h-5 text-indigo-600" />}
          isOpen={effectsOpen}
          onToggle={() => setEffectsOpen(!effectsOpen)}
        >
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-3">
              <Circle className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Vignette</h3>
            </div>
          </div>
          {onVignetteChange && (
            <VignetteControl
              intensity={vignetteIntensity}
              radius={vignetteRadius}
              onIntensityChange={(intensity) => onVignetteChange(intensity, vignetteRadius)}
              onRadiusChange={(radius) => onVignetteChange(vignetteIntensity, radius)}
            />
          )}
        </CollapsibleSection>

        {/* Filters */}
        <div>
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <Palette className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => onUpdateState({ filter: filter.value })}
                className={`p-2 sm:p-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 shadow-sm hover:shadow-md ${
                  imageState.filter === filter.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                {filter.name}
              </button>
            ))}
          </div>
        </div>

        {/* Background Removal */}
        <div>
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <Scissors className="w-5 h-5 text-pink-600" />
            <h3 className="text-lg font-semibold text-gray-900">Background</h3>
          </div>
          <button
            onClick={onRemoveBackground}
            disabled={isProcessingBackground}
            className={`w-full p-3 rounded-lg font-medium transition-all duration-300 ripple card-interactive hover:scale-105 ${
              isProcessingBackground
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                : 'bg-pink-500 hover:bg-pink-600 text-white shadow-sm hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              {isProcessingBackground ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Scissors className="w-5 h-5" />
                  <span>Remove Background</span>
                </>
              )}
            </div>
          </button>
        </div>

        {/* Transform */}
        <div>
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <RotateCw className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-gray-900">Transform</h3>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <SliderControl
              label="Rotation"
              value={imageState.rotation}
              min={0}
              max={360}
              onChange={(value) => onUpdateState({ rotation: value })}
            />

            <div className="flex space-x-2">
              <button
                onClick={() => onUpdateState({ flipX: !imageState.flipX })}
                className={`flex-1 p-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 shadow-sm hover:shadow-md ${
                  imageState.flipX
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                Flip X
              </button>
              <button
                onClick={() => onUpdateState({ flipY: !imageState.flipY })}
                className={`flex-1 p-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 shadow-sm hover:shadow-md ${
                  imageState.flipY
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                Flip Y
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};