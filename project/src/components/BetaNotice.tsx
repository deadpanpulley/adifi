import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Check, Zap, Clock, Wrench } from 'lucide-react';

interface BetaNoticeProps {
  isOpen: boolean;
  onClose: () => void;
}

const BetaNotice: React.FC<BetaNoticeProps> = ({ isOpen, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Small delay for animation
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const features = [
    { icon: <Check className="w-5 h-5 text-green-500" />, text: 'Basic image editing tools' },
    { icon: <Check className="w-5 h-5 text-green-500" />, text: 'Layer management' },
    { icon: <Check className="w-5 h-5 text-green-500" />, text: 'Export functionality' },
    { icon: <Wrench className="w-5 h-5 text-yellow-500" />, text: 'Advanced filters (in development)' },
    { icon: <Clock className="w-5 h-5 text-yellow-500" />, text: 'Batch processing (coming soon)' },
    { icon: <Zap className="w-5 h-5 text-yellow-500" />, text: 'AI-powered tools (coming soon)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div 
        className={`bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Beta Version Notice</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-4 text-gray-700">
            <p>
              Thank you for trying out our beta version! This is an early preview of our photo editor, and we're actively working on adding more features and improving performance.
            </p>
            
            <div className="mt-6">
              <h3 className="font-semibold text-lg mb-3 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-blue-500" />
                What's Working
              </h3>
              <ul className="space-y-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    {feature.icon}
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">I'd love your feedback!</h4>
              <p className="text-sm text-blue-700">
                Found a bug or have suggestions? Please let ME know at advick100@gmail.com
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Editing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BetaNotice;
