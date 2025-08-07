import React, { useState, useEffect } from 'react';
import { Activity, Clock, Cpu, Zap, X } from 'lucide-react';

interface PerformanceStatsProps {
  isVisible: boolean;
  onToggle: () => void;
  processingTimes: {
    [key: string]: number;
  };
}

export const PerformanceStats: React.FC<PerformanceStatsProps> = ({
  isVisible,
  onToggle,
  processingTimes
}) => {
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [frameRate, setFrameRate] = useState(0);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measurePerformance = () => {
      const currentTime = performance.now();
      frameCount++;
      
      if (currentTime - lastTime >= 1000) {
        setFrameRate(Math.round((frameCount * 1000) / (currentTime - lastTime)));
        frameCount = 0;
        lastTime = currentTime;
      }

      // Memory usage (approximate)
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryUsage(Math.round(memory.usedJSHeapSize / 1024 / 1024));
      }

      if (isVisible) {
        requestAnimationFrame(measurePerformance);
      }
    };

    if (isVisible) {
      measurePerformance();
    }
  }, [isVisible]);

  const getTotalProcessingTime = () => {
    return Object.values(processingTimes).reduce((sum, time) => sum + time, 0);
  };

  const getAverageProcessingTime = () => {
    const times = Object.values(processingTimes);
    return times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0;
  };

  const getPerformanceGrade = () => {
    const avgTime = getAverageProcessingTime();
    if (avgTime < 100) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-100' };
    if (avgTime < 500) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-100' };
    if (avgTime < 1000) return { grade: 'B', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (avgTime < 2000) return { grade: 'C', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { grade: 'D', color: 'text-red-600', bg: 'bg-red-100' };
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-20 right-4 p-3 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 z-30"
      >
        <Activity className="w-5 h-5 text-gray-600" />
      </button>
    );
  }

  const performanceGrade = getPerformanceGrade();

  return (
    <div className="fixed bottom-20 right-4 bg-white rounded-xl shadow-xl border border-gray-200 z-30 overflow-hidden w-64">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">Performance</span>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-bold ${performanceGrade.bg} ${performanceGrade.color}`}>
          {performanceGrade.grade}
        </div>
        <button
          onClick={onToggle}
          className="p-1 rounded hover:bg-gray-100 transition-colors ml-2"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Stats */}
      <div className="p-3 space-y-3">
        {/* Real-time Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Zap className="w-3 h-3 text-blue-600" />
              <span className="text-xs text-gray-600">FPS</span>
            </div>
            <div className="text-lg font-bold text-gray-900">{frameRate}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Cpu className="w-3 h-3 text-purple-600" />
              <span className="text-xs text-gray-600">Memory</span>
            </div>
            <div className="text-lg font-bold text-gray-900">{memoryUsage}MB</div>
          </div>
        </div>

        {/* Processing Times */}
        <div className="border-t border-gray-200 pt-3">
          <div className="flex items-center space-x-1 mb-2">
            <Clock className="w-3 h-3 text-green-600" />
            <span className="text-xs font-medium text-gray-700">Processing Times</span>
          </div>
          
          <div className="space-y-2 text-xs">
            {Object.entries(processingTimes).map(([operation, time]) => (
              <div key={operation} className="flex justify-between">
                <span className="text-gray-600 capitalize">
                  {operation.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="font-mono text-gray-900">
                  {time.toFixed(1)}ms
                </span>
              </div>
            ))}
            
            {Object.keys(processingTimes).length > 1 && (
              <>
                <hr className="border-gray-200" />
                <div className="flex justify-between font-medium">
                  <span className="text-gray-700">Average</span>
                  <span className="font-mono text-gray-900">
                    {getAverageProcessingTime().toFixed(1)}ms
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-gray-700">Total</span>
                  <span className="font-mono text-gray-900">
                    {getTotalProcessingTime().toFixed(1)}ms
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Performance Tips */}
        <div className="border-t border-gray-200 pt-3">
          <div className="text-xs text-gray-600">
            <div className="font-medium mb-1">Optimization Tips:</div>
            <ul className="space-y-1">
              <li>• Use smaller images for faster processing</li>
              <li>• Apply multiple adjustments at once</li>
              <li>• Export in WebP for smaller files</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};