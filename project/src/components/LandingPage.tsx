import React, { useState, useEffect } from 'react';
import { 
  Image,
  User,
  Wand2, 
  Scissors, 
  Focus, 
  Crop, 
  Layers, 
  Pipette, 
  BarChart3, 
  Zap, 
  Activity, 
  Download, 
  Star, 
  CheckCircle, 
  ArrowRight, 
  Play,
  Github,
  Sparkles,
  Brain,
  Target,
  Palette,
  Type,
  Keyboard,
  TrendingUp,
  Users,
  Trophy,
  Rocket,
  Code,
  Cpu,
  Globe,
  Shield,
  Timer,
  Sliders,
  Camera,
  Paintbrush,
  AlertTriangle,
  X,
  Info
} from 'lucide-react';

import { LandingPageProps } from '../types/editor';

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  delay: number;
}> = ({ icon, title, description, gradient, delay }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={`transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
      <div className="relative card-elevated p-6 group hover:ring-2 hover:ring-primary-500 hover:ring-opacity-30 transition-all duration-500 border border-secondary-100 hover:border-secondary-200">
        <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-soft`}>
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

const TechBadge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = "bg-blue-100 text-blue-800" }) => (
  <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${color} mr-2 mb-2 border border-transparent hover:border-blue-300 transition-all duration-300 hover:scale-105 shadow-soft hover:shadow-medium cursor-pointer`}>
    {children}
  </span>
);

const StatCard: React.FC<{ icon: React.ReactNode; number: string; label: string; gradient: string }> = ({
  icon, number, label, gradient
}) => (
  <div className="text-center group">
    <div className={`w-16 h-16 ${gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-medium group-hover:shadow-large transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}>
      {icon}
    </div>
    <div className="text-3xl font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors duration-300">{number}</div>
    <div className="text-sm text-secondary-600">{label}</div>
  </div>
);

const TestimonialCard: React.FC<{ quote: string; author: string; role: string; avatar: string }> = ({
  quote, author, role, avatar
}) => (
  <div className="card-elevated p-6 border border-secondary-100 group">
    <div className="flex items-center mb-4">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current group-hover:text-yellow-500 transition-colors duration-300" />
      ))}
    </div>
    <p className="text-secondary-700 mb-4 italic leading-relaxed">"{quote}"</p>
    <div className="flex items-center">
      <div className={`w-10 h-10 ${avatar} rounded-full mr-3`}></div>
      <div>
        <div className="font-semibold text-gray-900">{author}</div>
        <div className="text-sm text-secondary-600">{role}</div>
      </div>
    </div>
  </div>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showBetaNotification, setShowBetaNotification] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const features = [
    "AI-Powered Background Removal",
    "Professional Curves Panel",
    "Advanced Typography Tools",
    "Batch Processing Engine",
    "AI Style Transfer",
    "Multi-Layer Editing",
    "Smart Auto-Enhancement",
    "Real-time Performance Monitoring"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [features.length]);

  const handleStartCreating = () => {
    setShowBetaNotification(true);
  };

  const handleProceedToApp = () => {
    setShowBetaNotification(false);
    onGetStarted();
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Ambient background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-primary-200/20 to-secondary-200/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-200/20 to-pink-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-3/4 left-1/3 w-64 h-64 bg-gradient-to-r from-blue-200/20 to-cyan-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        
        {/* Navigation */}
        <nav className="relative z-20 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3 ml-20 md:ml-32">
              <div className="p-2 bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl shadow-soft animate-pulse-glow">
                <Image className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PhotoStudio Pro
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleStartCreating}
                className="btn-primary px-6 py-2 rounded-lg font-medium"
              >
                Try Now
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-20 px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <div className={`transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                
                <h1 className="text-5xl md:text-8xl font-bold text-gray-900 mb-6 leading-tight">
                  The Future of
                  <br />
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  <span className="text-blue-600">
                    Photo Editing
                  </span>
                  </span>
                  <br />
                  <span className="text-4xl md:text-5xl">In Your Browser</span>
                </h1>
                
                <div className="h-12 mb-8">
                  <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                    Professional tools meet AI power:{" "}
                    <span className="font-semibold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text transition-all duration-500">
                      {features[currentFeature]}
                    </span>
                  </p>
                </div>
              </div>

              <div className={`transform transition-all duration-1000 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12">
                  <button 
                    onClick={handleStartCreating}
                    className="group px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all duration-300 font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-3"
                  >
                    <span>Start Creating Magic</span>
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Enhanced Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                  <StatCard
                    icon={<Brain className="w-8 h-8 text-white" />}
                    number="25+"
                    label="AI Features"
                    gradient="bg-gradient-to-r from-pink-500 to-violet-500"
                  />
                  <StatCard
                    icon={<Layers className="w-8 h-8 text-white" />}
                    number="∞"
                    label="Layers"
                    gradient="bg-gradient-to-r from-blue-500 to-cyan-500"
                  />
                  <StatCard
                    icon={<Zap className="w-8 h-8 text-white" />}
                    number="<1s"
                    label="Processing"
                    gradient="bg-gradient-to-r from-yellow-500 to-orange-500"
                  />
                  <StatCard
                    icon={<Shield className="w-8 h-8 text-white" />}
                    number="100%"
                    label="Privacy"
                    gradient="bg-gradient-to-r from-green-500 to-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-10 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-20 w-16 h-16 bg-gradient-to-r from-green-400 to-blue-400 rounded-full opacity-10 animate-pulse delay-2000"></div>
      </div>

      {/* Professional Features Showcase */}
      <div className="py-24 bg-white relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-100 to-purple-100 rounded-full mb-4 shadow-soft">
              <Code className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">Professional Tools</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Desktop-Class Features
              <br />
              <span className="text-blue-600">In Your Browser</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every tool professionals need, powered by cutting-edge AI and optimized for lightning-fast performance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6 text-white" />}
              title="Professional Curves"
              description="RGB + individual channel curves with real-time preview. Professional color grading just like Photoshop."
              gradient="bg-gradient-to-r from-indigo-500 to-purple-500"
              delay={100}
            />
            
            <FeatureCard
              icon={<Type className="w-6 h-6 text-white" />}
              title="Advanced Typography"
              description="12+ fonts, stroke, shadow, rotation. Complete text design toolkit with real-time preview."
              gradient="bg-gradient-to-r from-purple-500 to-pink-500"
              delay={150}
            />
            
            <FeatureCard
              icon={<Keyboard className="w-6 h-6 text-white" />}
              title="Pro Keyboard Shortcuts"
              description="30+ shortcuts for professional workflow. Context-aware and desktop-app experience."
              gradient="bg-gradient-to-r from-green-500 to-blue-500"
              delay={200}
            />
            
            <FeatureCard
              icon={<Zap className="w-6 h-6 text-white" />}
              title="Batch Processing"
              description="Process dozens of images simultaneously. Enterprise-level efficiency with progress tracking."
              gradient="bg-gradient-to-r from-yellow-500 to-red-500"
              delay={250}
            />

            <FeatureCard
              icon={<Paintbrush className="w-6 h-6 text-white" />}
              title="AI Style Transfer"
              description="8 artistic styles including Van Gogh, Monet, Picasso. Real-time preview with intensity control."
              gradient="bg-gradient-to-r from-pink-500 to-purple-500"
              delay={300}
            />
            
            <FeatureCard
              icon={<Brain className="w-6 h-6 text-white" />}
              title="AI Background Removal"
              description="BodyPix neural networks for perfect person segmentation. Adjustable thresholds and precision."
              gradient="bg-gradient-to-r from-pink-500 to-red-500"
              delay={350}
            />
            
            <FeatureCard
              icon={<Wand2 className="w-6 h-6 text-white" />}
              title="Smart Auto-Enhancement"
              description="Histogram analysis for optimal brightness, contrast, and saturation. One-click perfection."
              gradient="bg-gradient-to-r from-yellow-500 to-orange-500"
              delay={400}
            />
            
            <FeatureCard
              icon={<Focus className="w-6 h-6 text-white" />}
              title="TensorFlow Sharpening"
              description="Advanced unsharp masking, Laplacian filters, and edge enhancement algorithms."
              gradient="bg-gradient-to-r from-cyan-500 to-blue-500"
              delay={450}
            />
            
            <FeatureCard
              icon={<Target className="w-6 h-6 text-white" />}
              title="Intelligent Auto-Crop"
              description="AI subject detection with smart cropping, padding, and aspect ratio optimization."
              gradient="bg-gradient-to-r from-violet-500 to-purple-500"
              delay={500}
            />
            
            <FeatureCard
              icon={<Palette className="w-6 h-6 text-white" />}
              title="K-Means Color Analysis"
              description="Extract dominant colors using advanced clustering with optimized sampling algorithms."
              gradient="bg-gradient-to-r from-teal-500 to-green-500"
              delay={550}
            />
            
            <FeatureCard
              icon={<Layers className="w-6 h-6 text-white" />}
              title="Professional Layers"
              description="Unlimited layers with 12 blend modes, opacity controls, and advanced compositing."
              gradient="bg-gradient-to-r from-indigo-500 to-blue-500"
              delay={600}
            />
            
            <FeatureCard
              icon={<Activity className="w-6 h-6 text-white" />}
              title="Performance Monitoring"
              description="Real-time stats, memory usage, processing times, and optimization insights."
              gradient="bg-gradient-to-r from-orange-500 to-red-500"
              delay={650}
            />
          </div>
        </div>
      </div>

      {/* Technology Showcase */}
      <div className="py-24 bg-white relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-100 to-blue-100 rounded-full mb-4">
              <Cpu className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800">Cutting-Edge Technology</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powered by the Latest AI & Web Tech
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Enterprise-grade performance meets consumer simplicity
            </p>
            
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              <TechBadge color="bg-red-100 text-red-800">TensorFlow.js</TechBadge>
              <TechBadge color="bg-purple-100 text-purple-800">BodyPix AI</TechBadge>
              <TechBadge color="bg-blue-100 text-blue-800">React 18</TechBadge>
              <TechBadge color="bg-green-100 text-green-800">TypeScript</TechBadge>
              <TechBadge color="bg-yellow-100 text-yellow-800">Canvas API</TechBadge>
              <TechBadge color="bg-pink-100 text-pink-800">WebGL</TechBadge>
              <TechBadge color="bg-indigo-100 text-indigo-800">K-means Clustering</TechBadge>
              <TechBadge color="bg-cyan-100 text-cyan-800">Histogram Analysis</TechBadge>
              <TechBadge color="bg-orange-100 text-orange-800">Edge Detection</TechBadge>
              <TechBadge color="bg-teal-100 text-teal-800">Unsharp Masking</TechBadge>
              <TechBadge color="bg-rose-100 text-rose-800">Neural Networks</TechBadge>
              <TechBadge color="bg-violet-100 text-violet-800">Computer Vision</TechBadge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center card-elevated p-8 group">
              <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-6 transition-transform duration-500 shadow-medium">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">AI-First Architecture</h3>
              <p className="text-secondary-600 leading-relaxed">Built from the ground up with machine learning at its core. Every feature leverages AI for intelligent, context-aware editing.</p>
            </div>
            
            <div className="text-center card-elevated p-8 group">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-6 transition-transform duration-500 shadow-medium">
                <Timer className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Lightning Performance</h3>
              <p className="text-secondary-600 leading-relaxed">Optimized algorithms and smart caching deliver desktop-class performance. Most operations complete in under 200ms.</p>
            </div>
            
            <div className="text-center card-elevated p-8 group">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-6 transition-transform duration-500 shadow-medium">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Privacy by Design</h3>
              <p className="text-secondary-600 leading-relaxed">All processing happens locally in your browser. Your images never leave your device. Zero server uploads, complete privacy.</p>
            </div>
          </div>
        </div>
      </div>



      {/* Beta Notification Modal */}
      {showBetaNotification && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-orange-50 to-yellow-50 border-b border-orange-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg">
                    <Info className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Beta Version Notice</h3>
                    <p className="text-sm text-orange-700">Important information before you start</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBetaNotification(false)}
                  className="p-1 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">PhotoStudio Pro is in Beta</h4>
                    <p className="text-sm text-gray-600">
                      We're actively developing new features and improvements. Most editing tools are fully functional and ready to use.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Scissors className="w-5 h-5 text-blue-500 mt-0.5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Background Remover Limitation</h4>
                    <p className="text-sm text-gray-600">
                      The AI background removal feature currently works best on images with <strong>people/humans</strong>. It may not work effectively on objects, animals, or other subjects.
                    </p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">What's Working Great:</span>
                  </div>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• All image adjustments (brightness, contrast, saturation, etc.)</li>
                    <li>• Professional filters and effects</li>
                    <li>• Layer system with blend modes</li>
                    <li>• Text tools and typography</li>
                    <li>• Auto-enhancement and sharpening</li>
                    <li>• Color palette extraction</li>
                    <li>• Export in multiple formats</li>
                  </ul>
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="p-6 pt-0">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowBetaNotification(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Maybe Later
                </button>
                <button
                  onClick={handleProceedToApp}
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <span>Continue to App</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};