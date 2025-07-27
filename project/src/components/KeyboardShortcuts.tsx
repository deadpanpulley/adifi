import React, { useEffect, useState } from 'react';
import { Keyboard, X } from 'lucide-react';

interface KeyboardShortcutsProps {
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onExport: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onToggleLayerPanel: () => void;
  onToggleHistogram: () => void;
  onToggleCurves: () => void;
  onOpenFile: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onSelectAll: () => void;
}

interface ShortcutData {
  key: string;
  description: string;
  category: string;
}

const shortcuts: ShortcutData[] = [
  // File Operations
  { key: 'Ctrl+O', description: 'Open Image', category: 'File' },
  { key: 'Ctrl+S', description: 'Save Project', category: 'File' },
  { key: 'Ctrl+E', description: 'Export Image', category: 'File' },
  
  // Edit Operations
  { key: 'Ctrl+Z', description: 'Undo', category: 'Edit' },
  { key: 'Ctrl+Y', description: 'Redo', category: 'Edit' },
  { key: 'Ctrl+C', description: 'Copy Layer', category: 'Edit' },
  { key: 'Ctrl+V', description: 'Paste Layer', category: 'Edit' },
  { key: 'Delete', description: 'Delete Layer', category: 'Edit' },
  { key: 'Ctrl+A', description: 'Select All', category: 'Edit' },
  
  // View Operations
  { key: 'Ctrl++', description: 'Zoom In', category: 'View' },
  { key: 'Ctrl+-', description: 'Zoom Out', category: 'View' },
  { key: 'Ctrl+0', description: 'Fit to Screen', category: 'View' },
  { key: 'F', description: 'Toggle Fullscreen', category: 'View' },
  
  // Panels
  { key: 'L', description: 'Toggle Layers Panel', category: 'Panels' },
  { key: 'H', description: 'Toggle Histogram', category: 'Panels' },
  { key: 'C', description: 'Toggle Curves', category: 'Panels' },
  { key: 'T', description: 'Text Tool', category: 'Tools' },
  { key: 'B', description: 'Brush Tool', category: 'Tools' },
  { key: 'M', description: 'Move Tool', category: 'Tools' },
  
  // Quick Actions
  { key: 'Space', description: 'Pan Tool (hold)', category: 'Navigation' },
  { key: 'Alt+Scroll', description: 'Zoom', category: 'Navigation' },
  { key: 'Ctrl+Scroll', description: 'Brush Size', category: 'Tools' },
];

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  onUndo,
  onRedo,
  onSave,
  onExport,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onToggleLayerPanel,
  onToggleHistogram,
  onToggleCurves,
  onOpenFile,
  onCopy,
  onPaste,
  onDelete,
  onSelectAll
}) => {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior for our shortcuts
      const { ctrlKey, altKey, key } = e;
      
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      let handled = false;

      if (ctrlKey && !altKey) {
        switch (key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            onUndo();
            handled = true;
            break;
          case 'y':
            e.preventDefault();
            onRedo();
            handled = true;
            break;
          case 's':
            e.preventDefault();
            onSave();
            handled = true;
            break;
          case 'e':
            e.preventDefault();
            onExport();
            handled = true;
            break;
          case 'o':
            e.preventDefault();
            onOpenFile();
            handled = true;
            break;
          case 'c':
            e.preventDefault();
            onCopy();
            handled = true;
            break;
          case 'v':
            e.preventDefault();
            onPaste();
            handled = true;
            break;
          case 'a':
            e.preventDefault();
            onSelectAll();
            handled = true;
            break;
          case '=':
          case '+':
            e.preventDefault();
            onZoomIn();
            handled = true;
            break;
          case '-':
            e.preventDefault();
            onZoomOut();
            handled = true;
            break;
          case '0':
            e.preventDefault();
            onZoomFit();
            handled = true;
            break;
        }
      } else if (!ctrlKey && !altKey) {
        switch (key.toLowerCase()) {
          case 'l':
            e.preventDefault();
            onToggleLayerPanel();
            handled = true;
            break;
          case 'h':
            e.preventDefault();
            onToggleHistogram();
            handled = true;
            break;
          case 't':
            e.preventDefault();
            // Text tool shortcut - we need to add this
            if (window.dispatchEvent) {
              window.dispatchEvent(new CustomEvent('toggleTextTool'));
            }
            handled = true;
            break;
          case 'c':
            e.preventDefault();
            onToggleCurves();
            handled = true;
            break;
          case 'delete':
          case 'backspace':
            e.preventDefault();
            onDelete();
            handled = true;
            break;
          case 'f1':
            e.preventDefault();
            setShowHelp(true);
            handled = true;
            break;
        }
      }

      // Show help with ?
      if (key === '?' && !ctrlKey && !altKey) {
        e.preventDefault();
        setShowHelp(true);
        handled = true;
      }

      if (handled) {
        e.stopPropagation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onUndo, onRedo, onSave, onExport, onZoomIn, onZoomOut, onZoomFit,
    onToggleLayerPanel, onToggleHistogram, onToggleCurves, onOpenFile,
    onCopy, onPaste, onDelete, onSelectAll
  ]);

  const groupedShortcuts = shortcuts.reduce((groups, shortcut) => {
    const category = shortcut.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(shortcut);
    return groups;
  }, {} as Record<string, ShortcutData[]>);

  if (!showHelp) {
    return (
      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-4 left-4 p-3 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 z-30"
        title="Keyboard Shortcuts (F1 or ?)"
      >
        <Keyboard className="w-5 h-5 text-gray-600" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg">
                <Keyboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Keyboard Shortcuts</h3>
                <p className="text-sm text-gray-600">Master these shortcuts for professional workflow</p>
              </div>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <div key={category} className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
                  {category}
                </h4>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between py-1">
                      <span className="text-sm text-gray-700">{shortcut.description}</span>
                      <kbd className="px-2 py-1 text-xs font-mono bg-white border border-gray-300 rounded shadow-sm">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h5 className="font-semibold text-blue-900 mb-2">Pro Tips</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Hold <kbd className="px-1 py-0.5 bg-blue-100 rounded text-xs">Space</kbd> and drag to pan around the canvas</li>
              <li>• Use <kbd className="px-1 py-0.5 bg-blue-100 rounded text-xs">Alt + Scroll</kbd> to zoom in/out</li>
              <li>• Press <kbd className="px-1 py-0.5 bg-blue-100 rounded text-xs">F1</kbd> or <kbd className="px-1 py-0.5 bg-blue-100 rounded text-xs">?</kbd> anytime to view this help</li>
              <li>• All shortcuts work globally except when typing in text fields</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Press <kbd className="px-2 py-1 bg-gray-200 rounded">Esc</kbd> to close</span>
            <span>Shortcuts are context-aware and won't interfere with text input</span>
          </div>
        </div>
      </div>
    </div>
  );
};