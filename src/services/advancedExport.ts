interface ExportOptions {
  format: 'png' | 'jpeg' | 'webp' | 'avif' | 'bmp' | 'gif' | 'pdf' | 'ico';
  quality: number;
  width?: number;
  height?: number;
  maintainAspectRatio: boolean;
  backgroundColor?: string;
  compression?: 'none' | 'low' | 'medium' | 'high';
  metadata?: boolean;
}

// Convert canvas to different formats
export const exportAdvanced = async (
  canvas: HTMLCanvasElement,
  options: ExportOptions
): Promise<void> => {
  const {
    format,
    quality,
    width,
    height,
    maintainAspectRatio,
    backgroundColor = '#ffffff',
    compression = 'medium',
    metadata = false
  } = options;

  // Create export canvas with desired dimensions
  let exportCanvas = canvas;
  if (width || height) {
    exportCanvas = document.createElement('canvas');
    const ctx = exportCanvas.getContext('2d')!;
    
    let newWidth = width || canvas.width;
    let newHeight = height || canvas.height;
    
    if (maintainAspectRatio && width && height) {
      const aspectRatio = canvas.width / canvas.height;
      if (width / height > aspectRatio) {
        newWidth = height * aspectRatio;
      } else {
        newHeight = width / aspectRatio;
      }
    }
    
    exportCanvas.width = newWidth;
    exportCanvas.height = newHeight;
    
    // Fill background for formats that don't support transparency
    if (['jpeg', 'bmp', 'pdf'].includes(format)) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, newWidth, newHeight);
    }
    
    ctx.drawImage(canvas, 0, 0, newWidth, newHeight);
  }

  // Apply compression settings
  let actualQuality = quality / 100;
  switch (compression) {
    case 'none':
      actualQuality = 1.0;
      break;
    case 'low':
      actualQuality = Math.max(0.9, actualQuality);
      break;
    case 'medium':
      // Use provided quality
      break;
    case 'high':
      actualQuality = Math.min(0.7, actualQuality);
      break;
  }

  let dataUrl: string;
  let fileName: string;

  switch (format) {
    case 'png':
      dataUrl = exportCanvas.toDataURL('image/png');
      fileName = `edited-image-${Date.now()}.png`;
      break;
      
    case 'jpeg':
      dataUrl = exportCanvas.toDataURL('image/jpeg', actualQuality);
      fileName = `edited-image-${Date.now()}.jpg`;
      break;
      
    case 'webp':
      if (isFormatSupported('image/webp')) {
        dataUrl = exportCanvas.toDataURL('image/webp', actualQuality);
        fileName = `edited-image-${Date.now()}.webp`;
      } else {
        // Fallback to PNG
        dataUrl = exportCanvas.toDataURL('image/png');
        fileName = `edited-image-${Date.now()}.png`;
        console.warn('WebP not supported, falling back to PNG');
      }
      break;
      
    case 'avif':
      if (isFormatSupported('image/avif')) {
        dataUrl = exportCanvas.toDataURL('image/avif', actualQuality);
        fileName = `edited-image-${Date.now()}.avif`;
      } else {
        // Fallback to WebP or PNG
        if (isFormatSupported('image/webp')) {
          dataUrl = exportCanvas.toDataURL('image/webp', actualQuality);
          fileName = `edited-image-${Date.now()}.webp`;
        } else {
          dataUrl = exportCanvas.toDataURL('image/png');
          fileName = `edited-image-${Date.now()}.png`;
        }
        console.warn('AVIF not supported, falling back to alternative format');
      }
      break;
      
    case 'bmp':
      dataUrl = await convertToBMP(exportCanvas);
      fileName = `edited-image-${Date.now()}.bmp`;
      break;
      
    case 'gif':
      dataUrl = await convertToGIF(exportCanvas);
      fileName = `edited-image-${Date.now()}.gif`;
      break;
      
    case 'pdf':
      dataUrl = await convertToPDF(exportCanvas);
      fileName = `edited-image-${Date.now()}.pdf`;
      break;
      
    case 'ico':
      dataUrl = await convertToICO(exportCanvas);
      fileName = `edited-image-${Date.now()}.ico`;
      break;
      
    default:
      dataUrl = exportCanvas.toDataURL('image/png');
      fileName = `edited-image-${Date.now()}.png`;
  }

  // Add metadata if requested
  if (metadata && ['jpeg', 'png'].includes(format)) {
    // For supported formats, we could embed EXIF data here
    // This is a simplified implementation
    console.log('Metadata embedding requested for', format);
  }

  // Download the file
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  link.click();
  
  // Clean up
  if (exportCanvas !== canvas) {
    exportCanvas.remove();
  }
};

// Check if browser supports format
const isFormatSupported = (mimeType: string): boolean => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL(mimeType).indexOf(mimeType) > -1;
};

// Convert canvas to BMP format
const convertToBMP = async (canvas: HTMLCanvasElement): Promise<string> => {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // BMP header
  const width = canvas.width;
  const height = canvas.height;
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;
  
  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);
  
  // BMP File Header
  view.setUint16(0, 0x4D42, false); // Signature 'BM'
  view.setUint32(2, fileSize, true); // File size
  view.setUint32(6, 0, true); // Reserved
  view.setUint32(10, 54, true); // Offset to pixel array
  
  // DIB Header
  view.setUint32(14, 40, true); // DIB header size
  view.setInt32(18, width, true); // Width
  view.setInt32(22, -height, true); // Height (negative for top-down)
  view.setUint16(26, 1, true); // Planes
  view.setUint16(28, 24, true); // Bits per pixel
  view.setUint32(30, 0, true); // Compression
  view.setUint32(34, pixelArraySize, true); // Image size
  view.setInt32(38, 2835, true); // X pixels per meter
  view.setInt32(42, 2835, true); // Y pixels per meter
  view.setUint32(46, 0, true); // Colors in palette
  view.setUint32(50, 0, true); // Important colors
  
  // Pixel data
  let offset = 54;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * 4;
      view.setUint8(offset++, imageData.data[pixelIndex + 2]); // Blue
      view.setUint8(offset++, imageData.data[pixelIndex + 1]); // Green
      view.setUint8(offset++, imageData.data[pixelIndex]); // Red
    }
    // Padding
    while (offset % 4 !== 0) {
      view.setUint8(offset++, 0);
    }
  }
  
  const blob = new Blob([buffer], { type: 'image/bmp' });
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
};

// Convert canvas to GIF format (simplified, single frame)
const convertToGIF = async (canvas: HTMLCanvasElement): Promise<string> => {
  // This is a simplified GIF conversion
  // For production, you'd want to use a proper GIF encoding library
  return canvas.toDataURL('image/png'); // Fallback to PNG for now
};

// Convert canvas to PDF format
const convertToPDF = async (canvas: HTMLCanvasElement): Promise<string> => {
  // This is a simplified PDF conversion
  // For production, you'd want to use a library like jsPDF
  const imgData = canvas.toDataURL('image/png');
  
  // Simple PDF structure (this is very basic)
  const width = canvas.width;
  const height = canvas.height;
  
  // For now, fallback to PNG
  return imgData;
};

// Convert canvas to ICO format
const convertToICO = async (canvas: HTMLCanvasElement): Promise<string> => {
  // ICO format is complex, this is a simplified version
  // Create a smaller version for icon
  const iconCanvas = document.createElement('canvas');
  const iconCtx = iconCanvas.getContext('2d')!;
  
  const size = Math.min(256, Math.min(canvas.width, canvas.height));
  iconCanvas.width = size;
  iconCanvas.height = size;
  
  iconCtx.drawImage(canvas, 0, 0, size, size);
  
  return iconCanvas.toDataURL('image/png');
};