export interface ImageState {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  filter: FilterType;
  vignetteIntensity?: number;
  vignetteRadius?: number;
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

export interface Layer {
  id: string;
  name: string;
  image: HTMLImageElement;
  visible: boolean;
  opacity: number;
  blendMode: BlendMode;
  position: {
    x: number;
    y: number;
  };
  scale: {
    x: number;
    y: number;
  };
  rotation: number;
  imageState: ImageState;
  locked: boolean;
  thumbnail?: string;
}

export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'hard-light' | 'color-dodge' | 'color-burn' | 'darken' | 'lighten' | 'difference' | 'exclusion';

export type FilterType = 'none' | 'grayscale' | 'sepia' | 'vintage' | 'vibrant' | 'cool' | 'warm';

export interface HistoryState {
  past: ImageState[];
  present: ImageState;
  future: ImageState[];
}

export interface Tool {
  id: string;
  name: string;
  icon: string;
  category: 'adjust' | 'filter' | 'transform';
}