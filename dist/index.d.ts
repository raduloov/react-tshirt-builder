import * as react_jsx_runtime from 'react/jsx-runtime';
import * as React$1 from 'react';
import React__default from 'react';

interface Position {
    x: number;
    y: number;
}
interface Size {
    width: number;
    height: number;
}
interface ImageTransform {
    position: Position;
    size: Size;
    rotation: number;
}
interface ImageData {
    id: string;
    src: string;
    naturalWidth: number;
    naturalHeight: number;
    transform: ImageTransform;
}
type TShirtView = 'front' | 'back';
interface ViewImages {
    front: ImageData[];
    back: ImageData[];
}
interface BoundingBox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}
interface EditorConfig {
    /** Width of the editor canvas */
    width: number;
    /** Height of the editor canvas */
    height: number;
    /** Printable area boundaries (where images can be placed) */
    printableArea?: BoundingBox;
    /** Minimum image size in pixels */
    minImageSize?: number;
    /** Whether to allow rotation */
    allowRotation?: boolean;
    /** Export scale multiplier for higher quality (e.g., 2 = 2x resolution) */
    exportScale?: number;
    /** Accepted file types for upload */
    acceptedFileTypes?: string[];
    /** Maximum file size in bytes */
    maxFileSize?: number;
}
type LayoutMode = 'horizontal' | 'vertical';
interface ResponsiveConfig {
    /** Enable responsive behavior that adapts to viewport size */
    enabled?: boolean;
    /** Mobile breakpoint max width in pixels (default: 639) */
    mobileBreakpoint?: number;
    /** Tablet breakpoint max width in pixels (default: 1024) */
    tabletBreakpoint?: number;
    /** Force a specific layout mode regardless of viewport */
    forceLayout?: LayoutMode;
    /** Panel width for tablet layout in pixels (default: 180) */
    tabletPanelWidth?: number;
    /** Panel width for desktop layout in pixels (default: 220) */
    desktopPanelWidth?: number;
    /** Panel collapsed by default on mobile (default: true) */
    mobileCollapsedByDefault?: boolean;
}
interface TShirtBuilderProps {
    /** Background image for front view (e.g., t-shirt template) */
    frontBgImage?: string;
    /** Background image for back view */
    backBgImage?: string;
    /** Editor configuration */
    config?: Partial<EditorConfig>;
    /** Responsive configuration for mobile/tablet adaptation */
    responsive?: ResponsiveConfig;
    /** Callback when images change (includes both views) */
    onChange?: (images: ViewImages, currentView: TShirtView) => void;
    /** Callback when export is requested (returns both front and back) */
    onExport?: (images: {
        front: string;
        back: string;
    }) => void;
    /** Custom class name */
    className?: string;
    /** Custom styles */
    style?: React.CSSProperties;
    /** Initial images for controlled mode */
    initialImages?: ViewImages;
}
interface ControlHandle {
    position: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | 'rotate';
    cursor: string;
}
type DragMode = 'move' | 'resize' | 'rotate' | null;
interface DragState {
    mode: DragMode;
    imageId: string;
    startPosition: Position;
    startTransform: ImageTransform;
    handle?: ControlHandle['position'];
}

declare function TShirtBuilder({ frontBgImage, backBgImage, config: configProp, responsive: responsiveProp, onChange, onExport, className, style, initialImages }: TShirtBuilderProps): react_jsx_runtime.JSX.Element;

interface ControlsProps {
    transform: ImageTransform;
    allowRotation: boolean;
    onPointerDown: (event: React__default.PointerEvent, mode: DragMode, handle?: ControlHandle['position']) => void;
    /** Enable touch-friendly sizing (larger hit areas) */
    isMobile?: boolean;
}
declare function Controls({ transform, allowRotation, onPointerDown, isMobile }: ControlsProps): react_jsx_runtime.JSX.Element;

interface LayerPanelProps {
    images: ImageData[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onReorder: (fromIndex: number, toIndex: number) => void;
    onAddImage: () => void;
    currentView: TShirtView;
    onViewChange: (view: TShirtView) => void;
    /** Compact mode for mobile drawer layout */
    compact?: boolean;
    /** Mobile mode for touch-optimized controls */
    isMobile?: boolean;
}
declare function LayerPanel({ images, selectedId, onSelect, onDelete, onReorder, onAddImage, currentView, onViewChange, compact, isMobile }: LayerPanelProps): react_jsx_runtime.JSX.Element;

interface UseImageUploadOptions {
    config: EditorConfig;
    onImageLoad: (imageData: ImageData) => void;
    onError?: (error: string) => void;
}
declare function useImageUpload({ config, onImageLoad, onError }: UseImageUploadOptions): {
    inputRef: React$1.RefObject<HTMLInputElement>;
    handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleDrop: (event: React.DragEvent) => void;
    handleDragOver: (event: React.DragEvent) => void;
    openFilePicker: () => void;
    acceptedTypes: string[];
};

interface UseImageTransformOptions {
    images: ImageData[];
    config: EditorConfig;
    containerRef: React.RefObject<HTMLElement>;
    onChange?: (images: ImageData[]) => void;
    /** Display scale factor for responsive mode (default: 1) */
    displayScale?: number;
}
declare function useImageTransform({ images, config, containerRef, onChange, displayScale }: UseImageTransformOptions): {
    selectedId: string | null;
    isDragging: boolean;
    isPinching: boolean;
    dragMode: DragMode;
    handlePointerDown: (event: React.PointerEvent, imageId: string, mode: DragMode, handle?: ControlHandle["position"]) => void;
    handleTouchStart: (event: React.TouchEvent, imageId: string) => void;
    selectImage: (imageId: string | null) => void;
    deselectAll: () => void;
    deleteImage: (imageId: string) => void;
    deleteSelected: () => void;
    bringToFront: (imageId: string) => void;
    sendToBack: (imageId: string) => void;
    reorderImage: (fromIndex: number, toIndex: number) => void;
    updateImageTransform: (imageId: string, newTransform: ImageTransform) => void;
};

declare function exportToDataUrl(canvas: HTMLCanvasElement, backgroundImage: HTMLImageElement | null, images: ImageData[], config: EditorConfig, format?: 'image/png' | 'image/jpeg', quality?: number): Promise<string>;
declare function createOffscreenCanvas(width: number, height: number): HTMLCanvasElement;

export { Controls, LayerPanel, TShirtBuilder, createOffscreenCanvas, exportToDataUrl, useImageTransform, useImageUpload };
export type { BoundingBox, ControlHandle, DragMode, DragState, EditorConfig, ImageData, ImageTransform, Position, Size, TShirtBuilderProps, TShirtView, ViewImages };
