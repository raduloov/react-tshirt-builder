import React from 'react';
import type { ImageTransform, ControlHandle, DragMode } from '../types';
interface ControlsProps {
    transform: ImageTransform;
    allowRotation: boolean;
    onPointerDown: (event: React.PointerEvent, mode: DragMode, handle?: ControlHandle['position']) => void;
    /** Enable touch-friendly sizing (larger hit areas) */
    isMobile?: boolean;
}
export declare function Controls({ transform, allowRotation, onPointerDown, isMobile }: ControlsProps): import("react/jsx-runtime").JSX.Element;
export {};
