import React from 'react';
import { Circle } from 'lucide-react';

interface VignetteControlProps {
  intensity: number;
  radius: number;
  onIntensityChange: (value: number) => void;
  onRadiusChange: (value: number) => void;
}

export const VignetteControl: React.FC<VignetteControlProps> = ({
  intensity,
  radius,
  onIntensityChange,
  onRadiusChange
}) => {
  return (
    <div className="space-y-4">

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Intensity ({intensity}%)
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={intensity}
          onChange={(e) => onIntensityChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>None</span>
          <span>Strong</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Size ({radius}%)
        </label>
        <input
          type="range"
          min="10"
          max="90"
          value={radius}
          onChange={(e) => onRadiusChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Small</span>
          <span>Large</span>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Creates a subtle darkening effect around the edges to draw focus to the center
      </p>
    </div>
  );
};