import React, { useState, useCallback } from 'react';
import type { ImageTransform, ControlHandle, DragMode } from '../types';

interface ControlsProps {
  transform: ImageTransform;
  allowRotation: boolean;
  onPointerDown: (
    event: React.PointerEvent,
    mode: DragMode,
    handle?: ControlHandle['position']
  ) => void;
  /** Enable touch-friendly sizing (larger hit areas) */
  isMobile?: boolean;
}

// Size configurations
const HANDLE_SIZE_DESKTOP = 10;
const HANDLE_SIZE_MOBILE_VISUAL = 14; // Visual size on mobile
const HANDLE_SIZE_MOBILE_HIT = 44; // Touch target size (Apple HIG recommendation)
const ROTATION_HANDLE_OFFSET_DESKTOP = 34;
const ROTATION_HANDLE_OFFSET_MOBILE = 50;
const ACCENT_COLOR = '#4A4A4A'; // dark gray - subtle and professional

// SVG rotate cursor icon encoded as data URI
const ROTATE_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8'/%3E%3Cpath d='M21 3v5h-5'/%3E%3C/svg%3E") 12 12, crosshair`;

// Helper to create handle styles based on mobile state and active state
function getHandleStyle(isMobile: boolean, isActive: boolean): React.CSSProperties {
  const visualSize = isMobile ? HANDLE_SIZE_MOBILE_VISUAL : HANDLE_SIZE_DESKTOP;

  return {
    position: 'absolute',
    width: visualSize,
    height: visualSize,
    backgroundColor: '#ffffff',
    border: `2px solid ${ACCENT_COLOR}`,
    borderRadius: '50%',
    boxSizing: 'border-box',
    boxShadow: isActive
      ? '0 4px 14px rgba(0, 0, 0, 0.25)'
      : '0 2px 10px rgba(0, 0, 0, 0.15)',
    transition: 'transform 0.15s ease-out, box-shadow 0.15s ease-out',
    transform: isActive ? 'scale(1.2)' : 'scale(1)',
    touchAction: 'none',
  };
}

// Helper to create rotation handle styles based on mobile state and active state
function getRotateHandleStyle(isMobile: boolean, isActive: boolean): React.CSSProperties {
  const visualSize = isMobile ? HANDLE_SIZE_MOBILE_VISUAL + 4 : HANDLE_SIZE_DESKTOP + 2;

  return {
    position: 'absolute',
    width: visualSize,
    height: visualSize,
    backgroundColor: ACCENT_COLOR,
    border: '2px solid #fff',
    borderRadius: '50%',
    boxSizing: 'border-box',
    cursor: ROTATE_CURSOR,
    boxShadow: isActive
      ? '0 4px 14px rgba(0, 0, 0, 0.3)'
      : '0 2px 10px rgba(0, 0, 0, 0.2)',
    transition: 'transform 0.15s ease-out, box-shadow 0.15s ease-out',
    transform: isActive ? 'scale(1.2)' : 'scale(1)',
    touchAction: 'none',
  };
}

// Helper to create invisible touch target style for mobile
function getTouchTargetStyle(isMobile: boolean, position: ControlHandle['position']): React.CSSProperties {
  if (!isMobile) return {};

  const hitSize = HANDLE_SIZE_MOBILE_HIT;
  const visualSize = HANDLE_SIZE_MOBILE_VISUAL;
  const offset = (hitSize - visualSize) / 2;

  return {
    position: 'absolute',
    width: hitSize,
    height: hitSize,
    backgroundColor: 'transparent',
    borderRadius: '50%',
    // Center the touch target around the visual handle
    margin: -offset,
    touchAction: 'none',
    cursor: position === 'rotate' ? ROTATE_CURSOR : getCursorForHandle(position),
  };
}

// Get cursor style for resize handles
function getCursorForHandle(position: ControlHandle['position']): string {
  switch (position) {
    case 'nw':
    case 'se':
      return 'nwse-resize';
    case 'ne':
    case 'sw':
      return 'nesw-resize';
    default:
      return 'pointer';
  }
}

export function Controls({ transform, allowRotation, onPointerDown, isMobile = false }: ControlsProps) {
  const { position, size, rotation } = transform;

  // Track which handle is currently active for touch feedback
  const [activeHandle, setActiveHandle] = useState<string | null>(null);

  // Wrapper for pointer down that adds touch feedback
  const handlePointerDownWithFeedback = useCallback(
    (e: React.PointerEvent, mode: DragMode, handle?: ControlHandle['position']) => {
      setActiveHandle(handle || mode || null);
      onPointerDown(e, mode, handle);

      // Listen for pointer up to clear active state
      const clearActive = () => {
        setActiveHandle(null);
        document.removeEventListener('pointerup', clearActive);
        document.removeEventListener('pointercancel', clearActive);
      };
      document.addEventListener('pointerup', clearActive);
      document.addEventListener('pointercancel', clearActive);
    },
    [onPointerDown]
  );

  // Calculate visual and positioning sizes based on mobile state
  const visualSize = isMobile ? HANDLE_SIZE_MOBILE_VISUAL : HANDLE_SIZE_DESKTOP;
  const rotationOffset = isMobile ? ROTATION_HANDLE_OFFSET_MOBILE : ROTATION_HANDLE_OFFSET_DESKTOP;

  // On mobile, position handles slightly outside the image bounds for better accessibility
  const handleOutset = isMobile ? 4 : 0;

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: position.x,
    top: position.y,
    width: size.width,
    height: size.height,
    transform: rotation ? `rotate(${rotation}deg)` : undefined,
    transformOrigin: 'center center',
    pointerEvents: 'none',
  };

  const handles: Array<{
    position: ControlHandle['position'];
    style: React.CSSProperties;
  }> = [
    {
      position: 'nw',
      style: {
        top: -visualSize / 2 - handleOutset,
        left: -visualSize / 2 - handleOutset,
        cursor: 'nwse-resize',
      },
    },
    {
      position: 'ne',
      style: {
        top: -visualSize / 2 - handleOutset,
        right: -visualSize / 2 - handleOutset,
        cursor: 'nesw-resize',
      },
    },
    {
      position: 'sw',
      style: {
        bottom: -visualSize / 2 - handleOutset,
        left: -visualSize / 2 - handleOutset,
        cursor: 'nesw-resize',
      },
    },
    {
      position: 'se',
      style: {
        bottom: -visualSize / 2 - handleOutset,
        right: -visualSize / 2 - handleOutset,
        cursor: 'nwse-resize',
      },
    },
  ];

  // Selection border - thicker and more visible on mobile
  const borderStyle: React.CSSProperties = {
    position: 'absolute',
    inset: -1,
    border: `${isMobile ? 2.5 : 2}px solid ${ACCENT_COLOR}`,
    borderRadius: '4px',
    pointerEvents: 'none',
    boxShadow: isMobile
      ? '0 0 0 1px rgba(255, 255, 255, 0.5), 0 2px 12px rgba(0, 0, 0, 0.15)'
      : '0 2px 10px rgba(0, 0, 0, 0.1)',
  };

  // Rotation stem sizing
  const stemHeight = isMobile ? 28 : 18;
  const stemTop = isMobile ? -38 : -28;

  return (
    <div style={containerStyle}>
      <div style={borderStyle} />

      {/* Resize handles */}
      {handles.map(({ position: pos, style }) => {
        const isActive = activeHandle === pos;
        const handleStyles = getHandleStyle(isMobile, isActive);

        return (
          <div
            key={pos}
            style={{
              ...handleStyles,
              ...style,
              pointerEvents: 'auto',
            }}
            onPointerDown={(e) => handlePointerDownWithFeedback(e, 'resize', pos)}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Invisible touch target for mobile - larger hit area */}
            {isMobile && (
              <div
                style={getTouchTargetStyle(isMobile, pos)}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  handlePointerDownWithFeedback(e, 'resize', pos);
                }}
                onContextMenu={(e) => e.preventDefault()}
              />
            )}
          </div>
        );
      })}

      {/* Rotation handle */}
      {allowRotation && (
        <>
          {/* Connection stem */}
          <div
            style={{
              position: 'absolute',
              top: stemTop,
              left: '50%',
              width: isMobile ? 2 : 1.5,
              height: stemHeight,
              backgroundColor: ACCENT_COLOR,
              transform: 'translateX(-50%)',
              opacity: 0.8,
              pointerEvents: 'none',
            }}
          />
          {/* Rotation handle circle */}
          <div
            style={{
              ...getRotateHandleStyle(isMobile, activeHandle === 'rotate'),
              top: -rotationOffset - visualSize / 2,
              left: '50%',
              transform: 'translateX(-50%)',
              pointerEvents: 'auto',
            }}
            onPointerDown={(e) => handlePointerDownWithFeedback(e, 'rotate')}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Invisible touch target for mobile - larger hit area */}
            {isMobile && (
              <div
                style={getTouchTargetStyle(isMobile, 'rotate')}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  handlePointerDownWithFeedback(e, 'rotate');
                }}
                onContextMenu={(e) => e.preventDefault()}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
