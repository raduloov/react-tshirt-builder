import React from 'react';
import type { ImageTransform, ControlHandle, DragMode } from '../types';
interface ControlsProps {
    transform: ImageTransform;
    allowRotation: boolean;
    onMouseDown: (event: React.MouseEvent, mode: DragMode, handle?: ControlHandle['position']) => void;
}
export declare const Controls: React.NamedExoticComponent<ControlsProps>;
export {};
