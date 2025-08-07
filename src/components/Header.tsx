import React, { useState } from 'react';
import { Upload, Download, RotateCcw, Undo, Redo, Image, Menu, X, Layers, Type, User, Play, Sun, Moon } from 'lucide-react';
import { useDarkMode } from '../contexts/DarkModeContext';

interface HeaderProps {
  onFileSelect: (file: File) => void;
  onExport: () => void;
  onReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasImage: boolean;
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
  onToggleLayerPanel?: () => void;
  onToggleTextTool?: () => void;
  onToggleBatchProcessor?: () => void;
}

interface TooltipButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  tooltip: string;
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning';
  children?: React.ReactNode;
}

const TooltipButton: React.FC<TooltipButtonProps> = ({ 
  onClick, 
  disabled = false, 
  tooltip, 
  icon, 
  variant = 'secondary',
  children 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
    warning: 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm'
  };

  const disabledClasses = 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none opacity-50';

  return (
    <div className="relative">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          relative p-3 rounded-xl
          transition-all duration-300 hover:shadow-md
          ${disabled ? disabledClasses : variantClasses[variant]}
        `}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {icon}
        {children}
      </button>
      
      {showTooltip && !disabled && (
        <div className="absolute top-full mt-3 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-out">
          <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
            {tooltip}
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export const Header: React.FC<HeaderProps> = ({
  onFileSelect,
  onExport,
  onReset,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  hasImage,
  onToggleMobileMenu,
  isMobileMenuOpen,
  onToggleLayerPanel,
  onToggleTextTool,
  onToggleBatchProcessor
}) => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      onFileSelect(fileArray.length === 1 ? fileArray[0] : fileArray);
    }
  };

  return (
    <header className="relative glass border-b border-secondary-200/50 px-6 py-6 shadow-soft">
      <div className="flex items-center justify-between w-full">
        {/* Logo */}
        <div className="flex items-center space-x-3 min-w-0 ml-20 md:ml-32">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/50 rounded-xl border border-blue-200 dark:border-blue-700">
              <Image className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
              <span className="hidden sm:inline">PhotoStudio Pro</span>
              <span className="sm:hidden">PhotoStudio</span>
            </h1>
          </div>
        </div>

        {/* Mobile Menu Button */}
        {hasImage && (
          <div className="lg:hidden">
            <TooltipButton
              onClick={onToggleMobileMenu}
              tooltip={isMobileMenuOpen ? "Close Menu" : "Open Menu"}
              icon={isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              variant="secondary"
            />
          </div>
        )}

        {/* Centered Toolbar */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden sm:block">
          <div className="flex items-center glass rounded-2xl p-2 sm:p-3 border border-secondary-200/50 shadow-medium">
            {/* Upload Button */}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileInput}
              className="hidden"
              id="file-input"
            />
            <div className="relative">
              <TooltipButton
                tooltip="Upload Images"
                icon={<Upload className="w-5 h-5" />}
                variant="primary"
              />
              <label htmlFor="file-input" className="absolute inset-0 cursor-pointer" />
            </div>

            {hasImage && (
              <>
                {/* Spacer */}
                <div className="w-2 sm:w-4"></div>

                {/* Undo */}
                <TooltipButton
                  onClick={onUndo}
                  disabled={!canUndo}
                  tooltip="Undo"
                  icon={<Undo className="w-5 h-5" />}
                />

                {/* Spacer */}
                <div className="w-2 sm:w-3"></div>

                {/* Redo */}
                <TooltipButton
                  onClick={onRedo}
                  disabled={!canRedo}
                  tooltip="Redo"
                  icon={<Redo className="w-5 h-5" />}
                />

                {/* Spacer */}
                <div className="w-2 sm:w-4"></div>

                {/* Reset */}
                <TooltipButton
                  onClick={onReset}
                  tooltip="Reset All Changes"
                  icon={<RotateCcw className="w-5 h-5" />}
                  variant="warning"
                />

                {/* Spacer */}
                <div className="w-2 sm:w-3"></div>

                {/* Batch Processing */}
                {onToggleBatchProcessor && (
                  <TooltipButton
                    onClick={onToggleBatchProcessor}
                    tooltip="Batch Processing Engine"
                    icon={<Play className="w-5 h-5" />}
                    variant="secondary"
                  />
                )}

                {/* Spacer */}
                <div className="w-2 sm:w-3"></div>

                {/* Export */}
                <TooltipButton
                  onClick={onExport}
                  tooltip="Export Image"
                  icon={<Download className="w-5 h-5" />}
                  variant="success"
                />
                {onToggleBatchProcessor && (
                  <TooltipButton
                    onClick={onToggleBatchProcessor}
                    tooltip="Batch Processing"
                    icon={<Play className="w-4 h-4" />}
                    variant="secondary"
                  />
                )}

                {/* Spacer */}
                <div className="w-2 sm:w-4"></div>

                {/* Layers Panel */}
                {onToggleLayerPanel && hasImage && (
                  <TooltipButton
                    onClick={onToggleLayerPanel}
                    tooltip="Toggle Layers Panel (L)"
                    icon={<Layers className="w-5 h-5" />}
                    variant="secondary"
                  />
                )}

                {/* Spacer */}
                <div className="w-2 sm:w-3"></div>

                {/* Text Tool */}
                {onToggleTextTool && (
                  <TooltipButton
                    onClick={onToggleTextTool}
                    tooltip="Add Text (T key)"
                    icon={<Type className="w-5 h-5" />}
                    variant="primary"
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Mobile Action Buttons */}
        <div className="flex items-center space-x-2 sm:hidden">
          {hasImage ? (
            <>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInput}
                className="hidden"
                id="mobile-file-input"
              />
              <label htmlFor="mobile-file-input">
                <TooltipButton
                  tooltip="Upload Images"
                  icon={<Upload className="w-4 h-4" />}
                  variant="primary"
                />
              </label>
              {onToggleTextTool && (
                <TooltipButton
                  onClick={onToggleTextTool}
                  tooltip="Add Text"
                  icon={<Type className="w-4 h-4" />}
                  variant="primary"
                />
              )}
              <TooltipButton
                onClick={onExport}
                tooltip="Export Image"
                icon={<Download className="w-4 h-4" />}
                variant="success"
              />
            </>
          ) : (
            <>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInput}
                className="hidden"
                id="mobile-file-input-no-image"
              />
              <label htmlFor="mobile-file-input-no-image">
                <TooltipButton
                  tooltip="Upload Images"
                  icon={<Upload className="w-4 h-4" />}
                  variant="primary"
                />
              </label>
            </>
          )}
        </div>

        {/* Right side - Auth */}
        <div className="flex items-center space-x-3">
          {/* Dark Mode Toggle */}
          <TooltipButton
            onClick={toggleDarkMode}
            tooltip={isDarkMode ? "Light Mode" : "Dark Mode"}
            icon={isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            variant="secondary"
          />
          <div className="w-4"></div>
        </div>
      </div>
    </header>
  );
};