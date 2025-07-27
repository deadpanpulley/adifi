import React, { useEffect, useRef, useState } from 'react';
import { BarChart3, Eye, EyeOff } from 'lucide-react';

interface HistogramProps {
  imageData?: ImageData;
  isVisible: boolean;
  onToggle: () => void;
}

interface HistogramData {
  red: number[];
  green: number[];
  blue: number[];
  luminance: number[];
  stats: {
    redMean: number;
    greenMean: number;
    blueMean: number;
    luminanceMean: number;
    redStd: number;
    greenStd: number;
    blueStd: number;
    luminanceStd: number;
  };
}

export const Histogram: React.FC<HistogramProps> = ({
  imageData,
  isVisible,
  onToggle
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [histogramData, setHistogramData] = useState<HistogramData | null>(null);
  const [activeChannel, setActiveChannel] = useState<'rgb' | 'red' | 'green' | 'blue' | 'luminance'>('rgb');

  useEffect(() => {
    if (imageData && isVisible) {
      const data = calculateHistogram(imageData);
      setHistogramData(data);
    }
  }, [imageData, isVisible]);

  useEffect(() => {
    if (histogramData && isVisible) {
      drawHistogram();
    }
  }, [histogramData, activeChannel, isVisible]);

  const calculateHistogram = (imgData: ImageData): HistogramData => {
    const { data, width, height } = imgData;
    const red = new Array(256).fill(0);
    const green = new Array(256).fill(0);
    const blue = new Array(256).fill(0);
    const luminance = new Array(256).fill(0);

    let redSum = 0, greenSum = 0, blueSum = 0, luminanceSum = 0;
    let pixelCount = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const alpha = data[i + 3];

      if (alpha > 0) {
        red[r]++;
        green[g]++;
        blue[b]++;

        const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        luminance[lum]++;

        redSum += r;
        greenSum += g;
        blueSum += b;
        luminanceSum += lum;
        pixelCount++;
      }
    }

    const redMean = redSum / pixelCount;
    const greenMean = greenSum / pixelCount;
    const blueMean = blueSum / pixelCount;
    const luminanceMean = luminanceSum / pixelCount;

    // Calculate standard deviations
    let redVariance = 0, greenVariance = 0, blueVariance = 0, luminanceVariance = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const alpha = data[i + 3];

      if (alpha > 0) {
        const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        redVariance += Math.pow(r - redMean, 2);
        greenVariance += Math.pow(g - greenMean, 2);
        blueVariance += Math.pow(b - blueMean, 2);
        luminanceVariance += Math.pow(lum - luminanceMean, 2);
      }
    }

    return {
      red,
      green,
      blue,
      luminance,
      stats: {
        redMean,
        greenMean,
        blueMean,
        luminanceMean,
        redStd: Math.sqrt(redVariance / pixelCount),
        greenStd: Math.sqrt(greenVariance / pixelCount),
        blueStd: Math.sqrt(blueVariance / pixelCount),
        luminanceStd: Math.sqrt(luminanceVariance / pixelCount)
      }
    };
  };

  const drawHistogram = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !histogramData) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#F9FAFB';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      const y = (i / 10) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const drawChannel = (data: number[], color: string, alpha: number = 1) => {
      const maxValue = Math.max(...data);
      if (maxValue === 0) return;

      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;

      const barWidth = width / 256;
      
      for (let i = 0; i < 256; i++) {
        const barHeight = (data[i] / maxValue) * height * 0.9;
        const x = (i / 256) * width;
        const y = height - barHeight;
        
        ctx.fillRect(x, y, barWidth, barHeight);
      }
    };

    switch (activeChannel) {
      case 'rgb':
        drawChannel(histogramData.red, '#EF4444', 0.6);
        drawChannel(histogramData.green, '#10B981', 0.6);
        drawChannel(histogramData.blue, '#3B82F6', 0.6);
        break;
      case 'red':
        drawChannel(histogramData.red, '#EF4444');
        break;
      case 'green':
        drawChannel(histogramData.green, '#10B981');
        break;
      case 'blue':
        drawChannel(histogramData.blue, '#3B82F6');
        break;
      case 'luminance':
        drawChannel(histogramData.luminance, '#6B7280');
        break;
    }

    ctx.globalAlpha = 1;
  };

  const channels = [
    { key: 'rgb' as const, label: 'RGB', color: 'text-gray-600' },
    { key: 'red' as const, label: 'Red', color: 'text-red-600' },
    { key: 'green' as const, label: 'Green', color: 'text-green-600' },
    { key: 'blue' as const, label: 'Blue', color: 'text-blue-600' },
    { key: 'luminance' as const, label: 'Luma', color: 'text-gray-600' }
  ];

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 p-3 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 z-30"
      >
        <BarChart3 className="w-5 h-5 text-gray-600" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-xl shadow-xl border border-gray-200 z-30 overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">Histogram</span>
        </div>
        <button
          onClick={onToggle}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
        >
          <EyeOff className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Canvas */}
      <div className="p-3">
        <canvas
          ref={canvasRef}
          width={240}
          height={120}
          className="border border-gray-200 rounded"
        />
      </div>

      {/* Channel Controls */}
      <div className="p-3 pt-0">
        <div className="flex space-x-1">
          {channels.map((channel) => (
            <button
              key={channel.key}
              onClick={() => setActiveChannel(channel.key)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                activeChannel === channel.key
                  ? 'bg-gray-200 text-gray-900'
                  : `${channel.color} hover:bg-gray-100`
              }`}
            >
              {channel.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      {histogramData && (
        <div className="p-3 pt-0 text-xs text-gray-600 space-y-1">
          <div>Mean: {Math.round(histogramData.stats.luminanceMean)}</div>
          <div>Std: {Math.round(histogramData.stats.luminanceStd)}</div>
        </div>
      )}
    </div>
  );
};