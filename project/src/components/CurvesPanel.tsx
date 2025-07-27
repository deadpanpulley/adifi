import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TrendingUp, RotateCcw, Eye, EyeOff } from 'lucide-react';

interface CurvePoint {
  x: number;
  y: number;
}

interface CurvesPanelProps {
  isVisible: boolean;
  onToggle: () => void;
  onCurvesChange: (curves: { rgb: CurvePoint[], red: CurvePoint[], green: CurvePoint[], blue: CurvePoint[] }) => void;
}

export const CurvesPanel: React.FC<CurvesPanelProps> = ({
  isVisible,
  onToggle,
  onCurvesChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeChannel, setActiveChannel] = useState<'rgb' | 'red' | 'green' | 'blue'>('rgb');
  const [curves, setCurves] = useState({
    rgb: [{ x: 0, y: 0 }, { x: 128, y: 128 }, { x: 255, y: 255 }],
    red: [{ x: 0, y: 0 }, { x: 128, y: 128 }, { x: 255, y: 255 }],
    green: [{ x: 0, y: 0 }, { x: 128, y: 128 }, { x: 255, y: 255 }],
    blue: [{ x: 0, y: 0 }, { x: 128, y: 128 }, { x: 255, y: 255 }]
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragPointIndex, setDragPointIndex] = useState(-1);

  const drawCurves = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

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
    
    // Grid lines every 25%
    for (let i = 0; i <= 4; i++) {
      const pos = (i / 4) * width;
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, height);
      ctx.stroke();
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(width, pos);
      ctx.stroke();
    }

    // Draw diagonal reference line (1:1 mapping)
    ctx.strokeStyle = '#9CA3AF';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // Get current channel curves
    const channelCurves = curves[activeChannel];
    const colors = {
      rgb: '#6B7280',
      red: '#EF4444',
      green: '#10B981',
      blue: '#3B82F6'
    };

    // Draw smooth curve using all points
    ctx.strokeStyle = colors[activeChannel];
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    // Create smooth curve using cardinal spline interpolation
    const smoothPoints = generateSmoothCurve(channelCurves, width, height);
    
    smoothPoints.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    
    ctx.stroke();

    // Draw control points
    ctx.fillStyle = colors[activeChannel];
    channelCurves.forEach((point, index) => {
      const x = (point.x / 255) * width;
      const y = height - (point.y / 255) * height;
      
      ctx.beginPath();
      ctx.arc(x, y, index === 0 || index === channelCurves.length - 1 ? 5 : 7, 0, 2 * Math.PI);
      ctx.fill();
      
      // White border
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [curves, activeChannel]);

  // Generate smooth curve points using spline interpolation
  const generateSmoothCurve = (points: CurvePoint[], width: number, height: number): {x: number, y: number}[] => {
    const smoothPoints: {x: number, y: number}[] = [];
    
    for (let x = 0; x <= width; x += 2) {
      const inputValue = (x / width) * 255;
      const outputValue = interpolateCurveSmooth(points, inputValue);
      const y = height - (outputValue / 255) * height;
      smoothPoints.push({ x, y });
    }
    
    return smoothPoints;
  };

  // Smooth curve interpolation using cubic splines
  const interpolateCurveSmooth = (points: CurvePoint[], x: number): number => {
    if (points.length < 2) return x;
    
    // Find the segment
    let i = 0;
    for (i = 0; i < points.length - 1; i++) {
      if (x >= points[i].x && x <= points[i + 1].x) {
        break;
      }
    }
    
    if (i >= points.length - 1) {
      return points[points.length - 1].y;
    }
    
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    
    // Normalize t to [0, 1] within the segment
    const t = (x - p1.x) / (p2.x - p1.x);
    
    // Catmull-Rom spline interpolation
    const t2 = t * t;
    const t3 = t2 * t;
    
    const y = 0.5 * (
      (2 * p1.y) +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
    );
    
    return Math.max(0, Math.min(255, y));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const inputValue = (x / canvas.width) * 255;
    const outputValue = 255 - (y / canvas.height) * 255;

    // Check if clicking on existing point
    const channelCurves = curves[activeChannel];
    let pointIndex = -1;
    
    for (let i = 0; i < channelCurves.length; i++) {
      const pointX = (channelCurves[i].x / 255) * canvas.width;
      const pointY = canvas.height - (channelCurves[i].y / 255) * canvas.height;
      
      if (Math.abs(x - pointX) < 12 && Math.abs(y - pointY) < 12) {
        pointIndex = i;
        break;
      }
    }

    if (pointIndex >= 0) {
      // Start dragging existing point
      setDragPointIndex(pointIndex);
      setIsDragging(true);
    } else {
      // Add new point
      const newCurves = { ...curves };
      const newPoint = { x: inputValue, y: outputValue };
      const newChannelCurves = [...channelCurves, newPoint].sort((a, b) => a.x - b.x);
      newCurves[activeChannel] = newChannelCurves;
      setCurves(newCurves);
      onCurvesChange(newCurves);
      
      // Start dragging the new point
      const newIndex = newChannelCurves.findIndex(p => p.x === inputValue && p.y === outputValue);
      setDragPointIndex(newIndex);
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || dragPointIndex < 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const inputValue = Math.max(0, Math.min(255, (x / canvas.width) * 255));
    const outputValue = Math.max(0, Math.min(255, 255 - (y / canvas.height) * 255));

    const newCurves = { ...curves };
    const channelCurves = [...newCurves[activeChannel]];
    
    // Don't allow moving first and last points horizontally
    if (dragPointIndex === 0) {
      channelCurves[dragPointIndex] = { x: 0, y: outputValue };
    } else if (dragPointIndex === channelCurves.length - 1) {
      channelCurves[dragPointIndex] = { x: 255, y: outputValue };
    } else {
      // Constrain movement to prevent crossing other points
      const leftPoint = channelCurves[dragPointIndex - 1];
      const rightPoint = channelCurves[dragPointIndex + 1];
      const constrainedX = Math.max(leftPoint.x + 1, Math.min(rightPoint.x - 1, inputValue));
      channelCurves[dragPointIndex] = { x: constrainedX, y: outputValue };
    }
    
    newCurves[activeChannel] = channelCurves;
    setCurves(newCurves);
    onCurvesChange(newCurves);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragPointIndex(-1);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if double-clicking on a point (not first or last)
    const channelCurves = curves[activeChannel];
    
    for (let i = 1; i < channelCurves.length - 1; i++) {
      const pointX = (channelCurves[i].x / 255) * canvas.width;
      const pointY = canvas.height - (channelCurves[i].y / 255) * canvas.height;
      
      if (Math.abs(x - pointX) < 12 && Math.abs(y - pointY) < 12) {
        // Remove the point
        const newCurves = { ...curves };
        newCurves[activeChannel] = channelCurves.filter((_, index) => index !== i);
        setCurves(newCurves);
        onCurvesChange(newCurves);
        break;
      }
    }
  };

  const resetCurves = () => {
    const defaultCurves = {
      rgb: [{ x: 0, y: 0 }, { x: 128, y: 128 }, { x: 255, y: 255 }],
      red: [{ x: 0, y: 0 }, { x: 128, y: 128 }, { x: 255, y: 255 }],
      green: [{ x: 0, y: 0 }, { x: 128, y: 128 }, { x: 255, y: 255 }],
      blue: [{ x: 0, y: 0 }, { x: 128, y: 128 }, { x: 255, y: 255 }]
    };
    setCurves(defaultCurves);
    onCurvesChange(defaultCurves);
  };

  useEffect(() => {
    drawCurves();
  }, [drawCurves]);

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-20 p-3 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 z-30"
      >
        <TrendingUp className="w-5 h-5 text-gray-600" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-20 bg-white rounded-xl shadow-xl border border-gray-200 z-30 overflow-hidden w-80">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <span className="text-lg font-semibold text-gray-900">RGB Curves</span>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={resetCurves}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              title="Reset curves"
            >
              <RotateCcw className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={onToggle}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
            >
              <EyeOff className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Channel Selection */}
        <div className="flex space-x-1">
          {(['rgb', 'red', 'green', 'blue'] as const).map((channel) => (
            <button
              key={channel}
              onClick={() => setActiveChannel(channel)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                activeChannel === channel
                  ? channel === 'rgb' 
                    ? 'bg-gray-600 text-white'
                    : channel === 'red'
                    ? 'bg-red-600 text-white'
                    : channel === 'green'
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {channel.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Curves Canvas */}
      <div className="p-4">
        <canvas
          ref={canvasRef}
          width={240}
          height={240}
          className="border border-gray-200 rounded cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
        />
        
        <div className="mt-3 text-xs text-gray-500 text-center space-y-1">
          <div>Click to add points • Drag to adjust</div>
          <div>Double-click points to remove</div>
          <div>Input (X) → Output (Y) mapping</div>
        </div>
      </div>
    </div>
  );
};