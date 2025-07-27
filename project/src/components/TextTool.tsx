import React, { useState, useRef, useEffect } from 'react';
import { 
  Type, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Palette, X, RotateCw, Move, Eye, EyeOff, Copy, Trash2, Settings, Download,
  Sparkles, Zap, Sun, Moon, Star, Heart, Target
} from 'lucide-react';

interface TextToolProps {
  isActive: boolean;
  onClose: () => void;
  onAddText: (textData: TextData) => void;
  initialData?: TextData;
}

export interface TextData {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: 'left' | 'center' | 'right' | 'justify';
  rotation: number;
  letterSpacing: number;
  lineHeight: number;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  strokeColor?: string;
  strokeWidth?: number;
  shadow?: {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
  };
  glow?: {
    blur: number;
    color: string;
    intensity: number;
  };
  gradient?: {
    enabled: boolean;
    type: 'linear' | 'radial';
    colors: string[];
    angle: number;
  };
  background?: {
    enabled: boolean;
    color: string;
    padding: number;
    borderRadius: number;
  };
}

const professionalFonts = [
  'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Trebuchet MS',
  'Arial Black', 'Impact', 'Comic Sans MS', 'Courier New', 'Lucida Console',
  'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Source Sans Pro', 'Raleway',
  'Oswald', 'Lora', 'Merriweather', 'Playfair Display', 'Dancing Script'
];

const textPresets = [
  {
    name: 'Headline Bold',
    icon: <Zap className="w-4 h-4" />,
    style: {
      fontSize: 48,
      fontFamily: 'Arial Black',
      bold: true,
      color: '#1F2937',
      letterSpacing: -1,
      textTransform: 'uppercase' as const
    }
  },
  {
    name: 'Elegant Script',
    icon: <Sparkles className="w-4 h-4" />,
    style: {
      fontSize: 36,
      fontFamily: 'Dancing Script',
      italic: true,
      color: '#7C3AED',
      letterSpacing: 1
    }
  },
  {
    name: 'Modern Clean',
    icon: <Target className="w-4 h-4" />,
    style: {
      fontSize: 32,
      fontFamily: 'Roboto',
      color: '#374151',
      letterSpacing: 0.5,
      lineHeight: 1.2
    }
  },
  {
    name: 'Neon Glow',
    icon: <Sun className="w-4 h-4" />,
    style: {
      fontSize: 40,
      fontFamily: 'Arial',
      bold: true,
      color: '#00FFFF',
      glow: {
        blur: 20,
        color: '#00FFFF',
        intensity: 0.8
      }
    }
  },
  {
    name: 'Vintage',
    icon: <Moon className="w-4 h-4" />,
    style: {
      fontSize: 32,
      fontFamily: 'Georgia',
      color: '#92400E',
      strokeColor: '#FEF3C7',
      strokeWidth: 1,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        blur: 4,
        color: '#00000040'
      }
    }
  },
  {
    name: 'Rainbow',
    icon: <Heart className="w-4 h-4" />,
    style: {
      fontSize: 36,
      fontFamily: 'Arial',
      bold: true,
      gradient: {
        enabled: true,
        type: 'linear' as const,
        colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'],
        angle: 45
      }
    }
  }
];

export const TextTool: React.FC<TextToolProps> = ({
  isActive,
  onClose,
  onAddText,
  initialData
}) => {
  const [textData, setTextData] = useState<TextData>(initialData || {
    text: 'Your Amazing Text',
    x: 400,
    y: 300,
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
  });

  // Update textData when initialData changes
  useEffect(() => {
    if (initialData) {
      setTextData(initialData);
    }
  }, [initialData]);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'effects' | 'background'>('basic');
  const previewRef = useRef<HTMLCanvasElement>(null);

  const updateTextData = (updates: Partial<TextData>) => {
    setTextData(prev => ({ ...prev, ...updates }));
  };

  const applyPreset = (preset: typeof textPresets[0]) => {
    setTextData(prev => ({
      ...prev,
      ...preset.style,
      text: prev.text // Keep existing text
    }));
  };

  const drawTextPreview = () => {
    const canvas = previewRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    canvas.width = 400;
    canvas.height = 200;

    // Enable high-quality text rendering
    ctx.textRenderingOptimization = 'optimizeQuality';
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background pattern
    ctx.fillStyle = '#F3F4F6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw checkerboard for transparency
    const checkSize = 10;
    for (let x = 0; x < canvas.width; x += checkSize) {
      for (let y = 0; y < canvas.height; y += checkSize) {
        if ((Math.floor(x / checkSize) + Math.floor(y / checkSize)) % 2) {
          ctx.fillStyle = '#E5E7EB';
          ctx.fillRect(x, y, checkSize, checkSize);
        }
      }
    }

    // Setup text properties
    let fontStyle = '';
    if (textData.italic) fontStyle += 'italic ';
    if (textData.bold) fontStyle += 'bold ';
    
    const adjustedFontSize = Math.min(textData.fontSize, 48); // Scale for preview
    ctx.font = `${fontStyle}${adjustedFontSize}px ${textData.fontFamily}`;
    ctx.textAlign = textData.align === 'justify' ? 'left' : textData.align;
    ctx.textBaseline = 'middle';

    const x = canvas.width / 2;
    const y = canvas.height / 2;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((textData.rotation * Math.PI) / 180);

    // Apply text transform
    let displayText = textData.text;
    switch (textData.textTransform) {
      case 'uppercase':
        displayText = displayText.toUpperCase();
        break;
      case 'lowercase':
        displayText = displayText.toLowerCase();
        break;
      case 'capitalize':
        displayText = displayText.replace(/\w\S*/g, (txt) => 
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
        break;
    }

    // Handle multi-line text
    const lines = displayText.split('\n');
    const lineHeight = adjustedFontSize * textData.lineHeight;
    const totalHeight = lines.length * lineHeight;
    const startY = -totalHeight / 2 + lineHeight / 2;

    lines.forEach((line, index) => {
      const lineY = startY + index * lineHeight;
      
      // Draw background if enabled
      if (textData.background?.enabled) {
        const metrics = ctx.measureText(line);
        const bgWidth = metrics.width + textData.background.padding * 2;
        const bgHeight = lineHeight + textData.background.padding;
        
        ctx.fillStyle = textData.background.color;
        ctx.beginPath();
        ctx.roundRect(
          -bgWidth / 2, 
          lineY - bgHeight / 2, 
          bgWidth, 
          bgHeight, 
          textData.background.borderRadius
        );
        ctx.fill();
      }

      // Apply glow effect
      if (textData.glow && textData.glow.blur > 0) {
        ctx.shadowColor = textData.glow.color;
        ctx.shadowBlur = textData.glow.blur;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Multiple passes for stronger glow
        for (let i = 0; i < textData.glow.intensity * 3; i++) {
          ctx.fillStyle = textData.glow.color;
          ctx.fillText(line, 0, lineY);
        }
        
        ctx.shadowBlur = 0;
      }

      // Apply shadow
      if (textData.shadow && (textData.shadow.offsetX !== 0 || textData.shadow.offsetY !== 0)) {
        ctx.shadowOffsetX = textData.shadow.offsetX;
        ctx.shadowOffsetY = textData.shadow.offsetY;
        ctx.shadowBlur = textData.shadow.blur;
        ctx.shadowColor = textData.shadow.color;
      }

      // Draw stroke
      if (textData.strokeWidth && textData.strokeWidth > 0) {
        ctx.strokeStyle = textData.strokeColor || '#FFFFFF';
        ctx.lineWidth = textData.strokeWidth;
        ctx.lineJoin = 'round';
        ctx.strokeText(line, 0, lineY);
      }

      // Draw text fill
      if (textData.gradient?.enabled) {
        // Create gradient
        const metrics = ctx.measureText(line);
        let gradient;
        
        if (textData.gradient.type === 'linear') {
          const angle = (textData.gradient.angle * Math.PI) / 180;
          const length = Math.max(metrics.width, lineHeight);
          gradient = ctx.createLinearGradient(
            -Math.cos(angle) * length / 2,
            -Math.sin(angle) * length / 2,
            Math.cos(angle) * length / 2,
            Math.sin(angle) * length / 2
          );
        } else {
          gradient = ctx.createRadialGradient(0, lineY, 0, 0, lineY, Math.max(metrics.width, lineHeight) / 2);
        }
        
        textData.gradient.colors.forEach((color, i) => {
          gradient.addColorStop(i / (textData.gradient!.colors.length - 1), color);
        });
        
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = textData.color;
      }
      
      ctx.fillText(line, 0, lineY);

      // Draw underline
      if (textData.underline) {
        const metrics = ctx.measureText(line);
        const underlineY = lineY + adjustedFontSize * 0.15;
        ctx.beginPath();
        ctx.moveTo(-metrics.width / 2, underlineY);
        ctx.lineTo(metrics.width / 2, underlineY);
        ctx.strokeStyle = textData.gradient?.enabled ? 'currentColor' : textData.color;
        ctx.lineWidth = Math.max(1, adjustedFontSize * 0.08);
        ctx.stroke();
      }
    });

    ctx.restore();
  };

  useEffect(() => {
    if (isActive) {
      drawTextPreview();
    }
  }, [textData, isActive]);

  const handleAddText = () => {
    onAddText(textData);
    onClose();
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full mx-4 max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Type className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Professional Typography</h3>
                <p className="text-sm text-gray-600">Create stunning text with advanced typography controls</p>
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

        <div className="flex overflow-hidden" style={{ height: 'calc(95vh - 120px)' }}>
          {/* Left Panel - Controls */}
          <div className="w-2/3 p-6 overflow-y-auto">
            {/* Quick Presets */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Quick Presets</h4>
              <div className="grid grid-cols-3 gap-3">
                {textPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 text-left group"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      {preset.icon}
                      <span className="font-medium text-sm">{preset.name}</span>
                    </div>
                    <div className="text-xs text-gray-500">Click to apply style</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Text Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Text Content</label>
              <textarea
                value={textData.text}
                onChange={(e) => updateTextData({ text: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
                placeholder="Enter your text... (Use \n for line breaks)"
              />
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 mb-6 border-b border-gray-200">
              {[
                { key: 'basic', label: 'Basic', icon: <Type className="w-4 h-4" /> },
                { key: 'effects', label: 'Effects', icon: <Sparkles className="w-4 h-4" /> },
                { key: 'background', label: 'Background', icon: <Target className="w-4 h-4" /> }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg transition-colors ${
                    activeTab === tab.key
                      ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                {/* Font Controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
                    <select
                      value={textData.fontFamily}
                      onChange={(e) => updateTextData({ fontFamily: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {professionalFonts.map(font => (
                        <option key={font} value={font} style={{ fontFamily: font }}>
                          {font}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Size ({textData.fontSize}px)</label>
                    <input
                      type="range"
                      min="12"
                      max="120"
                      value={textData.fontSize}
                      onChange={(e) => updateTextData({ fontSize: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Typography Controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Letter Spacing ({textData.letterSpacing}px)</label>
                    <input
                      type="range"
                      min="-5"
                      max="10"
                      step="0.5"
                      value={textData.letterSpacing}
                      onChange={(e) => updateTextData({ letterSpacing: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Line Height ({textData.lineHeight})</label>
                    <input
                      type="range"
                      min="0.8"
                      max="3"
                      step="0.1"
                      value={textData.lineHeight}
                      onChange={(e) => updateTextData({ lineHeight: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Style Controls */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Text Style</label>
                  <div className="flex space-x-2 mb-4">
                    <button
                      onClick={() => updateTextData({ bold: !textData.bold })}
                      className={`p-2 rounded-lg border transition-colors ${
                        textData.bold 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateTextData({ italic: !textData.italic })}
                      className={`p-2 rounded-lg border transition-colors ${
                        textData.italic 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateTextData({ underline: !textData.underline })}
                      className={`p-2 rounded-lg border transition-colors ${
                        textData.underline 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Underline className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Alignment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Text Alignment</label>
                  <div className="flex space-x-2">
                    {[
                      { value: 'left', icon: AlignLeft },
                      { value: 'center', icon: AlignCenter },
                      { value: 'right', icon: AlignRight },
                      { value: 'justify', icon: AlignJustify }
                    ].map(({ value, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => updateTextData({ align: value as any })}
                        className={`p-2 rounded-lg border transition-colors ${
                          textData.align === value 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Transform */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Text Transform</label>
                  <select
                    value={textData.textTransform}
                    onChange={(e) => updateTextData({ textTransform: e.target.value as any })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">None</option>
                    <option value="uppercase">UPPERCASE</option>
                    <option value="lowercase">lowercase</option>
                    <option value="capitalize">Capitalize Each Word</option>
                  </select>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={textData.color}
                      onChange={(e) => updateTextData({ color: e.target.value })}
                      className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={textData.color}
                      onChange={(e) => updateTextData({ color: e.target.value })}
                      className="flex-1 p-2 border border-gray-300 rounded-lg font-mono text-sm"
                    />
                  </div>
                </div>

                {/* Rotation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rotation ({textData.rotation}°)
                  </label>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={textData.rotation}
                    onChange={(e) => updateTextData({ rotation: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {activeTab === 'effects' && (
              <div className="space-y-6">
                {/* Gradient */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">Gradient Fill</label>
                    <button
                      onClick={() => updateTextData({ 
                        gradient: { ...textData.gradient!, enabled: !textData.gradient?.enabled }
                      })}
                      className={`p-1 rounded ${
                        textData.gradient?.enabled ? 'text-blue-600' : 'text-gray-400'
                      }`}
                    >
                      {textData.gradient?.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {textData.gradient?.enabled && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={textData.gradient.colors[0]}
                          onChange={(e) => updateTextData({
                            gradient: {
                              ...textData.gradient!,
                              colors: [e.target.value, textData.gradient!.colors[1]]
                            }
                          })}
                          className="w-8 h-8 rounded border"
                        />
                        <span className="text-sm text-gray-600">to</span>
                        <input
                          type="color"
                          value={textData.gradient.colors[1]}
                          onChange={(e) => updateTextData({
                            gradient: {
                              ...textData.gradient!,
                              colors: [textData.gradient!.colors[0], e.target.value]
                            }
                          })}
                          className="w-8 h-8 rounded border"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Angle ({textData.gradient.angle}°)</label>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          value={textData.gradient.angle}
                          onChange={(e) => updateTextData({
                            gradient: { ...textData.gradient!, angle: parseInt(e.target.value) }
                          })}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Stroke */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Text Stroke</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Color</label>
                      <input
                        type="color"
                        value={textData.strokeColor}
                        onChange={(e) => updateTextData({ strokeColor: e.target.value })}
                        className="w-full h-8 rounded border cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Width ({textData.strokeWidth}px)</label>
                      <input
                        type="range"
                        min="0"
                        max="8"
                        value={textData.strokeWidth}
                        onChange={(e) => updateTextData({ strokeWidth: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Shadow */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Drop Shadow</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">X Offset ({textData.shadow?.offsetX}px)</label>
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        value={textData.shadow?.offsetX}
                        onChange={(e) => updateTextData({ 
                          shadow: { ...textData.shadow!, offsetX: parseInt(e.target.value) }
                        })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Y Offset ({textData.shadow?.offsetY}px)</label>
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        value={textData.shadow?.offsetY}
                        onChange={(e) => updateTextData({ 
                          shadow: { ...textData.shadow!, offsetY: parseInt(e.target.value) }
                        })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Blur ({textData.shadow?.blur}px)</label>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        value={textData.shadow?.blur}
                        onChange={(e) => updateTextData({ 
                          shadow: { ...textData.shadow!, blur: parseInt(e.target.value) }
                        })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Color</label>
                      <input
                        type="color"
                        value={textData.shadow?.color.slice(0, 7)}
                        onChange={(e) => updateTextData({ 
                          shadow: { ...textData.shadow!, color: e.target.value + '80' }
                        })}
                        className="w-full h-8 rounded border cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Glow */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Glow Effect</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Blur ({textData.glow?.blur}px)</label>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={textData.glow?.blur}
                        onChange={(e) => updateTextData({ 
                          glow: { ...textData.glow!, blur: parseInt(e.target.value) }
                        })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Intensity ({Math.round((textData.glow?.intensity || 0) * 100)}%)</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={textData.glow?.intensity}
                        onChange={(e) => updateTextData({ 
                          glow: { ...textData.glow!, intensity: parseFloat(e.target.value) }
                        })}
                        className="w-full"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Glow Color</label>
                      <input
                        type="color"
                        value={textData.glow?.color}
                        onChange={(e) => updateTextData({ 
                          glow: { ...textData.glow!, color: e.target.value }
                        })}
                        className="w-full h-8 rounded border cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'background' && (
              <div className="space-y-6">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">Background</label>
                    <button
                      onClick={() => updateTextData({ 
                        background: { ...textData.background!, enabled: !textData.background?.enabled }
                      })}
                      className={`p-1 rounded ${
                        textData.background?.enabled ? 'text-blue-600' : 'text-gray-400'
                      }`}
                    >
                      {textData.background?.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {textData.background?.enabled && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Background Color</label>
                        <input
                          type="color"
                          value={textData.background.color}
                          onChange={(e) => updateTextData({
                            background: { ...textData.background!, color: e.target.value }
                          })}
                          className="w-full h-8 rounded border cursor-pointer"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Padding ({textData.background.padding}px)</label>
                        <input
                          type="range"
                          min="0"
                          max="30"
                          value={textData.background.padding}
                          onChange={(e) => updateTextData({
                            background: { ...textData.background!, padding: parseInt(e.target.value) }
                          })}
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Border Radius ({textData.background.borderRadius}px)</label>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={textData.background.borderRadius}
                          onChange={(e) => updateTextData({
                            background: { ...textData.background!, borderRadius: parseInt(e.target.value) }
                          })}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Preview */}
          <div className="w-1/3 border-l border-gray-200 p-6 bg-gray-50">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h4>
            <div className="bg-white rounded-lg p-4 shadow-inner">
              <canvas
                ref={previewRef}
                className="w-full border border-gray-200 rounded-lg"
              />
            </div>
            
            <div className="mt-6 space-y-3">
              <div className="text-sm text-gray-600">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Font: {textData.fontFamily}</div>
                  <div>Size: {textData.fontSize}px</div>
                  <div>Lines: {textData.text.split('\n').length}</div>
                  <div>Characters: {textData.text.length}</div>
                </div>
              </div>
              
              <button
                onClick={handleAddText}
                className="w-full p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <Type className="w-4 h-4" />
                <span>{initialData ? 'Update Text' : 'Add Text to Canvas'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};