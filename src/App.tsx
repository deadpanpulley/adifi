import React, { useState, useCallback, useRef, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { Header } from './components/Header';
import { Canvas } from './components/Canvas';
import { ToolPanel } from './components/ToolPanel';
import { LayerPanel } from './components/LayerPanel';
import { DropZone } from './components/DropZone';
import { ExportModal, ExportOptions } from './components/ExportModal';
import { BeforeAfterCompare } from './components/BeforeAfterCompare';
import { Histogram } from './components/Histogram';
import { CurvesPanel } from './components/CurvesPanel';
import { PerformanceStats } from './components/PerformanceStats';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
import { ManualCrop } from './components/ManualCrop';
import { StyleTransfer } from './components/StyleTransfer';
import { BatchProcessor } from './components/BatchProcessor';
import { TextManager } from './components/TextManager';
import { useImageEditor } from './hooks/useImageEditor';
import { exportAdvanced } from './services/advancedExport';

function App() {
  const {
    image,
    layers,
    activeLayerId,
    imageState,
    canUndo,
    canRedo,
    zoom,
    pan,
    isLoading,
    isProcessingBackground,
    canvasRef,
    originalImageRef,
    loadImage,
    addLayer,
    layerOperations,
    updateImageState,
    undo,
    redo,
    resetImage,
    exportImage,
    setZoom,
    setPan,
    handleRemoveBackground,
    handleAutoEnhance,
    handleSharpenImage,
    handleAutoCrop,
    handleColorPalette,
    colorPalette,
    paletteStats,
    clearColorPalette,
    vignetteIntensity,
    vignetteRadius,
    updateVignette,
    processingTimes,
    textElements
  } = useImageEditor();

  const [showLanding, setShowLanding] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [showHistogram, setShowHistogram] = useState(false);
  const [showCurves, setShowCurves] = useState(false);
  const [showPerformanceStats, setShowPerformanceStats] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showManualCrop, setShowManualCrop] = useState(false);
  const [showStyleTransfer, setShowStyleTransfer] = useState(false);
  const [showBatchProcessor, setShowBatchProcessor] = useState(false);
  const [showTextManager, setShowTextManager] = useState(false);

  // Auto-show layers panel when layers exist
  useEffect(() => {
    if (layers.length > 0) {
      setShowLayerPanel(true);
    }
  }, [layers.length, showLayerPanel]);

  // Handle keyboard shortcut for text tool
  useEffect(() => {
    const handleToggleTextTool = () => {
      setShowTextManager(prev => !prev);
    };

    window.addEventListener('toggleTextTool', handleToggleTextTool);
    return () => window.removeEventListener('toggleTextTool', handleToggleTextTool);
  }, []);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleGetStarted = useCallback(() => {
    setShowLanding(false);
  }, []);

  const handleFileSelect = useCallback((file: File | File[]) => {
    loadImage(file);
    setShowLanding(false);
    setIsMobileMenuOpen(false);
  }, [loadImage]);

  const handleExport = useCallback(() => {
    setShowExportModal(true);
  }, []);

  const handleAdvancedExport = useCallback(async (options: ExportOptions) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      await exportAdvanced(canvas, options);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  }, [canvasRef]);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(5, prev * 1.2));
  }, [setZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(0.1, prev / 1.2));
  }, [setZoom]);

  const handleZoomFit = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [setZoom, setPan]);

  const handleToggleLayerPanel = useCallback(() => {
    setShowLayerPanel(prev => !prev);
  }, []);

  const handleOpenFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) {
        handleFileSelect(files.length === 1 ? files[0] : files);
      }
    };
    input.click();
  }, [handleFileSelect]);

  const handleCopy = useCallback(() => {
    // Implement copy functionality
    console.log('Copy functionality to be implemented');
  }, []);

  const handlePaste = useCallback(() => {
    // Implement paste functionality
    console.log('Paste functionality to be implemented');
  }, []);

  const handleDelete = useCallback(() => {
    if (activeLayerId) {
      layerOperations.deleteLayer(activeLayerId);
    }
  }, [activeLayerId, layerOperations]);

  const handleSelectAll = useCallback(() => {
    // Implement select all functionality
    console.log('Select all functionality to be implemented');
  }, []);

  const handleSave = useCallback(() => {
    exportImage();
  }, [exportImage]);

  const handleCurvesChange = useCallback((curves: any) => {
    // Implement curves functionality
    console.log('Curves change:', curves);
  }, []);

  const handleCropApply = useCallback((bounds: any) => {
    console.log('Crop applied:', bounds);
    setShowManualCrop(false);
  }, []);

  const handleStyleTransferApply = useCallback((styledImageData: ImageData) => {
    if (!activeLayerId) return;
    
    // Create new image from styled data
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = styledImageData.width;
    canvas.height = styledImageData.height;
    ctx.putImageData(styledImageData, 0, 0);
    
    const styledImage = new Image();
    styledImage.onload = () => {
      layerOperations.updateLayerImage(activeLayerId, styledImage);
    };
    styledImage.src = canvas.toDataURL();
  }, [activeLayerId, layerOperations]);


  const handleKeyboardShortcut = useCallback((key: string) => {
    if (key === 't') {
      setShowTextManager(prev => !prev);
    }
  }, []);

  const handleToggleBatchProcessor = useCallback(() => {
    setShowBatchProcessor(prev => !prev);
  }, []);

  // Show landing page if no image loaded
  if (showLanding) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  const isMobile = window.innerWidth < 1024;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-secondary-50 via-white to-secondary-100 dark:from-secondary-900 dark:via-secondary-800 dark:to-secondary-900">
        {/* Header */}
        <Header
          onFileSelect={handleFileSelect}
          onExport={handleExport}
          onReset={resetImage}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          hasImage={!!image}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
          onToggleLayerPanel={handleToggleLayerPanel}
          onToggleTextTool={() => setShowTextManager(!showTextManager)}
          onToggleBatchProcessor={handleToggleBatchProcessor}
        />

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Mobile Menu Overlay */}
          {isMobile && isMobileMenuOpen && (
            <div className="fixed inset-0 bg-black/50 z-40 lg:hidden">
              <div className="absolute inset-y-0 left-0 w-80 bg-white shadow-xl">
                <ToolPanel
                  imageState={imageState}
                  onUpdateState={updateImageState}
                  onRemoveBackground={handleRemoveBackground}
                  isProcessingBackground={isProcessingBackground}
                  onAutoEnhance={handleAutoEnhance}
                  onSharpenImage={handleSharpenImage}
                  onAutoCrop={handleAutoCrop}
                  onColorPalette={handleColorPalette}
                  isMobile={true}
                  isOpen={isMobileMenuOpen}
                  onClose={() => setIsMobileMenuOpen(false)}
                  vignetteIntensity={vignetteIntensity}
                  vignetteRadius={vignetteRadius}
                  onVignetteChange={updateVignette}
                />
              </div>
            </div>
          )}

          {/* Left Panel - Tools (Desktop) */}
          {!isMobile && (
            <ToolPanel
              imageState={imageState}
              onUpdateState={updateImageState}
              onRemoveBackground={handleRemoveBackground}
              isProcessingBackground={isProcessingBackground}
              onAutoEnhance={handleAutoEnhance}
              onSharpenImage={handleSharpenImage}
              onAutoCrop={handleAutoCrop}
              onColorPalette={handleColorPalette}
              isMobile={false}
              isOpen={false}
              onClose={() => {}}
              vignetteIntensity={vignetteIntensity}
              vignetteRadius={vignetteRadius}
              onVignetteChange={updateVignette}
            />
          )}

          {/* Center - Canvas Area */}
          {image ? (
            <Canvas
              image={image}
              layers={layers}
              imageState={imageState}
              zoom={zoom}
              pan={pan}
              canvasRef={canvasRef}
              activeLayerId={activeLayerId}
              onLayerPositionChange={layerOperations.updateLayerPosition}
              onZoomChange={setZoom}
              onPanChange={setPan}
              colorPalette={colorPalette}
              paletteStats={paletteStats}
              onClearColorPalette={clearColorPalette}
              vignetteIntensity={vignetteIntensity}
              vignetteRadius={vignetteRadius}
            />
          ) : (
            <DropZone onFileSelect={handleFileSelect} />
          )}

          {/* Right Panel - Layers */}
          {(showLayerPanel || layers.length > 0) && (
            <LayerPanel
              layers={layers}
              activeLayerId={activeLayerId}
              onLayerSelect={layerOperations.selectLayer}
              onLayerVisibilityToggle={layerOperations.toggleVisibility}
              onLayerOpacityChange={layerOperations.changeOpacity}
              onLayerBlendModeChange={layerOperations.changeBlendMode}
              onLayerDelete={layerOperations.deleteLayer}
              onLayerDuplicate={layerOperations.duplicateLayer}
              onLayerReorder={layerOperations.reorderLayer}
              onLayerLockToggle={layerOperations.toggleLock}
              onAddLayer={addLayer}
              onLayerRename={layerOperations.renameLayer}
              onLayerPositionChange={layerOperations.updateLayerPosition}
            />
          )}
        </div>

        {/* Floating UI Elements */}
        {image && originalImageRef.current && (
          <BeforeAfterCompare
            originalImage={originalImageRef.current}
            currentState={imageState}
            isVisible={showBeforeAfter}
            onToggle={() => setShowBeforeAfter(!showBeforeAfter)}
          />
        )}

        <Histogram
          imageData={canvasRef.current?.getContext('2d')?.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)}
          isVisible={showHistogram}
          onToggle={() => setShowHistogram(!showHistogram)}
        />

        <CurvesPanel
          isVisible={showCurves}
          onToggle={() => setShowCurves(!showCurves)}
          onCurvesChange={handleCurvesChange}
        />

        <PerformanceStats
          isVisible={showPerformanceStats}
          onToggle={() => setShowPerformanceStats(!showPerformanceStats)}
          processingTimes={processingTimes}
        />

        {/* Modals */}
        {showExportModal && (
          <ExportModal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            onExport={handleAdvancedExport}
            canvasRef={canvasRef}
          />
        )}

        {showManualCrop && image && (
          <ManualCrop
            image={image}
            onCrop={handleCropApply}
            onCancel={() => setShowManualCrop(false)}
            isActive={showManualCrop}
          />
        )}

        {showStyleTransfer && image && (
          <StyleTransfer
            sourceImage={image}
            isVisible={showStyleTransfer}
            onClose={() => setShowStyleTransfer(false)}
            onApplyStyle={handleStyleTransferApply}
          />
        )}

        {showBatchProcessor && (
          <BatchProcessor
            isVisible={showBatchProcessor}
            onClose={() => setShowBatchProcessor(false)}
          />
        )}

        {/* Text Manager */}
        <TextManager
            canvasRef={canvasRef}
            zoom={zoom}
            pan={pan}
            isActive={showTextManager}
            onToggle={() => setShowTextManager(!showTextManager)}
            layers={layers}
            activeLayerId={activeLayerId}
            layerOperations={layerOperations}
            textElements={textElements}
          />

        {/* Keyboard Shortcuts */}
        <KeyboardShortcuts
          onUndo={undo}
          onRedo={redo}
          onSave={handleSave}
          onExport={handleExport}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomFit={handleZoomFit}
          onToggleLayerPanel={handleToggleLayerPanel}
          onToggleHistogram={() => setShowHistogram(!showHistogram)}
          onToggleCurves={() => setShowCurves(!showCurves)}
          onOpenFile={handleOpenFile}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onDelete={handleDelete}
          onSelectAll={handleSelectAll}
        />

        {/* Loading Overlay */}
        {(isLoading || isProcessingBackground) && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-8 shadow-2xl">
              <div className="flex items-center space-x-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-lg font-medium text-gray-900">
                  {isProcessingBackground ? 'Removing background...' : 'Processing...'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}

export default App;