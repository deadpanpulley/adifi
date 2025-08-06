import React from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
          Photo Editor
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-10">
          Edit your photos with our powerful online editor
        </p>
        <button
          onClick={onGetStarted}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-lg transition-colors duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default LandingPage;