import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { TShirtBuilderProps, ImageData, EditorConfig, TShirtView, ViewImages, ResponsiveConfig, LayoutMode, BoundingBox } from "../types";
import { useImageUpload } from "../hooks/useImageUpload";
import { useImageTransform } from "../hooks/useImageTransform";
import { useResponsive } from "../hooks/useResponsive";
import { Controls } from "./Controls";
import { LayerPanel } from "./LayerPanel";
import { exportToDataUrl, createOffscreenCanvas } from "../utils/canvas";

// teniski-varna color palette
const COLORS = {
  ACCENT: "#FAC000",
  BLACK: "#000000",
  WHITE: "#FFFFFF",
  GRAY: "#9B9B9B",
  LIGHT_GRAY: "#F7F7F7",
  DARK_GRAY: "#4A4A4A",
  RED: "#FF0000"
};

const DEFAULT_CONFIG: EditorConfig = {
  width: 400,
  height: 500,
  minImageSize: 20,
  allowRotation: false,
  acceptedFileTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
  maxFileSize: 10 * 1024 * 1024
};

const DEFAULT_RESPONSIVE_CONFIG: Required<ResponsiveConfig> = {
  enabled: false,
  mobileBreakpoint: 639,
  tabletBreakpoint: 1024,
  forceLayout: undefined as unknown as LayoutMode,
  tabletPanelWidth: 180,
  desktopPanelWidth: 220,
  mobileCollapsedByDefault: true
};

// Helper to calculate scaled dimensions for responsive canvas
function calculateScaledDimensions(
  originalWidth: number,
  originalHeight: number,
  containerWidth: number,
  maxHeight: number
): { width: number; height: number; scale: number } {
  const aspectRatio = originalWidth / originalHeight;

  // First try to fit width
  let width = Math.min(originalWidth, containerWidth);
  let height = width / aspectRatio;

  // If height exceeds max, constrain by height instead
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  const scale = width / originalWidth;

  return {
    width: Math.round(width),
    height: Math.round(height),
    scale
  };
}

// Scale printable area proportionally
function scalePrintableArea(
  printableArea: BoundingBox | undefined,
  scale: number
): BoundingBox | undefined {
  if (!printableArea) return undefined;
  return {
    minX: Math.round(printableArea.minX * scale),
    minY: Math.round(printableArea.minY * scale),
    maxX: Math.round(printableArea.maxX * scale),
    maxY: Math.round(printableArea.maxY * scale)
  };
}

export function TShirtBuilder({
  frontBgImage,
  backBgImage,
  config: configProp,
  responsive: responsiveProp,
  onChange,
  onExport,
  className,
  style,
  initialImages
}: TShirtBuilderProps) {
  const config: EditorConfig = { ...DEFAULT_CONFIG, ...configProp };
  const responsiveConfig: ResponsiveConfig = { ...DEFAULT_RESPONSIVE_CONFIG, ...responsiveProp };

  // Responsive state detection
  const responsiveState = useResponsive({
    mobileBreakpoint: responsiveConfig.mobileBreakpoint,
    tabletBreakpoint: responsiveConfig.tabletBreakpoint,
    enabled: responsiveConfig.enabled
  });

  // Container ref for measuring available space
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Mobile drawer state
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(
    responsiveConfig.mobileCollapsedByDefault ?? true
  );

  // Measure container width for responsive scaling
  useEffect(() => {
    if (!responsiveConfig.enabled || !wrapperRef.current) return;

    const measureContainer = () => {
      if (wrapperRef.current) {
        setContainerWidth(wrapperRef.current.clientWidth);
      }
    };

    // Initial measurement
    measureContainer();

    // Use ResizeObserver for efficient container size tracking
    const resizeObserver = new ResizeObserver(measureContainer);
    resizeObserver.observe(wrapperRef.current);

    return () => resizeObserver.disconnect();
  }, [responsiveConfig.enabled]);

  // Determine layout mode based on responsive state or forced layout
  const layoutMode: LayoutMode = useMemo(() => {
    if (responsiveConfig.forceLayout) {
      return responsiveConfig.forceLayout;
    }
    if (!responsiveConfig.enabled) {
      return 'horizontal';
    }
    // Mobile uses vertical layout, tablet and desktop use horizontal
    return responsiveState.isMobile ? 'vertical' : 'horizontal';
  }, [responsiveConfig.forceLayout, responsiveConfig.enabled, responsiveState.isMobile]);

  // Calculate panel width based on breakpoint
  const panelWidth = useMemo(() => {
    if (!responsiveConfig.enabled) {
      return responsiveConfig.desktopPanelWidth ?? 220;
    }
    if (responsiveState.isMobile) {
      return '100%'; // Full width for mobile drawer
    }
    if (responsiveState.isTablet) {
      return responsiveConfig.tabletPanelWidth ?? 180;
    }
    return responsiveConfig.desktopPanelWidth ?? 220;
  }, [responsiveConfig.enabled, responsiveConfig.tabletPanelWidth, responsiveConfig.desktopPanelWidth, responsiveState.isMobile, responsiveState.isTablet]);

  // Calculate canvas dimensions based on responsive state
  const canvasDimensions = useMemo(() => {
    if (!responsiveConfig.enabled || !containerWidth) {
      return { width: config.width, height: config.height, scale: 1 };
    }

    // Calculate available width for canvas
    let availableWidth = containerWidth;
    if (layoutMode === 'horizontal') {
      const gap = 16;
      const numericPanelWidth = typeof panelWidth === 'number' ? panelWidth : 220;
      availableWidth = containerWidth - numericPanelWidth - gap;
    } else {
      // Vertical layout - full width with some padding
      availableWidth = containerWidth - 32; // 16px padding on each side
    }

    // Calculate max height (leave room for buttons and panel in vertical layout)
    const maxHeight = layoutMode === 'vertical'
      ? responsiveState.viewportHeight * 0.5 // Half of viewport height in vertical layout
      : responsiveState.viewportHeight - 200; // Leave room for buttons in horizontal

    return calculateScaledDimensions(
      config.width,
      config.height,
      availableWidth,
      maxHeight
    );
  }, [responsiveConfig.enabled, containerWidth, config.width, config.height, layoutMode, panelWidth, responsiveState.viewportHeight]);

  // Calculate scaled printable area
  const scaledPrintableArea = useMemo(() => {
    return scalePrintableArea(config.printableArea, canvasDimensions.scale);
  }, [config.printableArea, canvasDimensions.scale]);

  // Create a scaled config for rendering (keeps original for export)
  const displayConfig: EditorConfig = useMemo(() => ({
    ...config,
    width: canvasDimensions.width,
    height: canvasDimensions.height,
    printableArea: scaledPrintableArea
  }), [config, canvasDimensions.width, canvasDimensions.height, scaledPrintableArea]);

  const [currentView, setCurrentView] = useState<TShirtView>("front");
  const [viewImages, setViewImages] = useState<ViewImages>(initialImages || { front: [], back: [] });
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Get current images based on view
  const images = viewImages[currentView];

  // Get current background image URL based on view
  const currentBackgroundUrl = currentView === "front" ? frontBgImage : backBgImage;

  // Load background image based on current view
  useEffect(() => {
    if (currentBackgroundUrl) {
      const img = new Image();
      img.onload = () => setBgImage(img);
      img.onerror = () => setError("Грешка при зареждане на изображението");
      img.src = currentBackgroundUrl;
    } else {
      setBgImage(null);
    }
  }, [currentBackgroundUrl]);

  const handleImagesChange = useCallback(
    (newImages: ImageData[]) => {
      setViewImages(prev => {
        const updated = { ...prev, [currentView]: newImages };
        onChange?.(updated, currentView);
        return updated;
      });
    },
    [onChange, currentView]
  );

  const handleImageLoad = useCallback(
    (newImageData: ImageData) => {
      setViewImages(prev => {
        const newImages = [...prev[currentView], newImageData];
        const updated = { ...prev, [currentView]: newImages };
        onChange?.(updated, currentView);
        return updated;
      });
      setError(null);
    },
    [currentView, onChange]
  );

  const { inputRef, handleFileChange, handleDrop, handleDragOver, openFilePicker, acceptedTypes } = useImageUpload({
    config,
    onImageLoad: handleImageLoad,
    onError: setError
  });

  const {
    selectedId,
    isDragging,
    isPinching,
    dragMode,
    handlePointerDown,
    handleTouchStart,
    selectImage,
    deselectAll,
    deleteImage,
    deleteSelected,
    reorderImage
  } = useImageTransform({
    images,
    config,
    containerRef,
    onChange: handleImagesChange,
    displayScale: canvasDimensions.scale
  });

  // SVG rotate cursor - same as in Controls.tsx
  const ROTATE_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8'/%3E%3Cpath d='M21 3v5h-5'/%3E%3C/svg%3E") 12 12, crosshair`;

  // Set cursor on body during rotation to ensure it persists outside the handle
  useEffect(() => {
    if (isDragging && dragMode === 'rotate') {
      document.body.style.cursor = ROTATE_CURSOR;
      return () => {
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, dragMode]);

  const handleExport = useCallback(async () => {
    if (!onExport) return;

    const scale = config.exportScale || 1;
    const canvas = createOffscreenCanvas(config.width * scale, config.height * scale);

    // Helper to load an image
    const loadImage = (src: string | undefined): Promise<HTMLImageElement | null> => {
      if (!src) return Promise.resolve(null);
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      });
    };

    // Load both background images
    const [frontBg, backBg] = await Promise.all([
      loadImage(frontBgImage),
      loadImage(backBgImage)
    ]);

    // Export front
    const frontDataUrl = await exportToDataUrl(canvas, frontBg, viewImages.front, config);

    // Export back
    const backDataUrl = await exportToDataUrl(canvas, backBg, viewImages.back, config);

    onExport({ front: frontDataUrl, back: backDataUrl });
  }, [config, onExport, frontBgImage, backBgImage, viewImages]);

  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      // Deselect if clicking on empty area
      if (e.target === containerRef.current) {
        deselectAll();
      }
    },
    [deselectAll]
  );

  // Scale a transform for display (images are stored in original coordinates)
  const scaleTransform = useCallback((transform: ImageData['transform']) => {
    const scale = canvasDimensions.scale;
    return {
      position: {
        x: transform.position.x * scale,
        y: transform.position.y * scale
      },
      size: {
        width: transform.size.width * scale,
        height: transform.size.height * scale
      },
      rotation: transform.rotation
    };
  }, [canvasDimensions.scale]);

  const containerStyle: React.CSSProperties = {
    position: "relative",
    width: displayConfig.width,
    height: displayConfig.height,
    backgroundColor: COLORS.LIGHT_GRAY,
    backgroundImage: bgImage ? `url(${currentBackgroundUrl})` : undefined,
    backgroundSize: "cover",
    backgroundPosition: "center",
    overflow: "hidden",
    cursor: (isDragging && dragMode !== 'rotate') || isPinching ? "grabbing" : "default",
    userSelect: "none",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
    fontFamily: "Roboto, -apple-system, BlinkMacSystemFont, sans-serif",
    // Prevent browser touch behaviors during interaction
    touchAction: "none"
  };

  // Wrapper style for responsive layout
  const wrapperStyle: React.CSSProperties = {
    width: '100%',
    fontFamily: "Roboto, -apple-system, BlinkMacSystemFont, sans-serif"
  };

  // Main layout container style based on layout mode
  const layoutContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: layoutMode === 'vertical' ? 'column' : 'row',
    gap: layoutMode === 'vertical' ? '12px' : '16px',
    alignItems: layoutMode === 'vertical' ? 'center' : 'flex-start'
  };

  // Panel container style for mobile drawer
  const panelContainerStyle: React.CSSProperties = layoutMode === 'vertical' ? {
    width: '100%',
    order: 2, // Panel below canvas on mobile
    maxHeight: isPanelCollapsed ? '56px' : '400px',
    overflow: 'hidden',
    transition: 'max-height 0.3s ease-out',
    borderRadius: '10px',
    boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)'
  } : {
    width: typeof panelWidth === 'number' ? `${panelWidth}px` : panelWidth,
    flexShrink: 0
  };

  // Canvas column style
  const canvasColumnStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: layoutMode === 'vertical' ? 'center' : 'flex-start',
    order: layoutMode === 'vertical' ? 1 : 2
  };

  const dropZoneStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: "12px",
    color: COLORS.GRAY,
    fontSize: "14px",
    pointerEvents: images.length > 0 ? "none" : "auto"
  };

  const [exportButtonHovered, setExportButtonHovered] = useState(false);
  const [exportButtonActive, setExportButtonActive] = useState(false);

  const exportButtonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    padding: "14px 20px",
    marginTop: "12px",
    backgroundColor: COLORS.ACCENT,
    color: COLORS.BLACK,
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: 600,
    boxShadow: "0 2px 10px rgba(250, 192, 0, 0.3)",
    transition: "filter 0.1s ease-out, transform 0.1s ease-out",
    ...(exportButtonActive
      ? {
          filter: "brightness(0.9)",
          transform: "scale(0.95)"
        }
      : exportButtonHovered
        ? {
            filter: "brightness(0.9)"
          }
        : {})
  };

  // Toggle panel collapse (mobile only)
  const togglePanelCollapse = useCallback(() => {
    setIsPanelCollapsed(prev => !prev);
  }, []);

  // Collapse panel when selecting/interacting with image on mobile
  const handleMobileImageInteraction = useCallback(() => {
    if (layoutMode === 'vertical' && !isPanelCollapsed) {
      setIsPanelCollapsed(true);
    }
  }, [layoutMode, isPanelCollapsed]);

  return (
    <div ref={wrapperRef} className={className} style={{ ...wrapperStyle, ...style }}>
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 16px",
            marginBottom: "12px",
            backgroundColor: "#FFEBEB",
            color: COLORS.RED,
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 500,
            boxShadow: "0 2px 10px rgba(255, 0, 0, 0.1)"
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M8 5.333V8M8 10.667h.007M14.667 8A6.667 6.667 0 111.333 8a6.667 6.667 0 0113.334 0z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {error}
        </div>
      )}

      <div style={layoutContainerStyle}>
        {/* Layer Panel - with mobile drawer support */}
        <div style={panelContainerStyle}>
          {layoutMode === 'vertical' && (
            <button
              onClick={togglePanelCollapse}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '16px',
                backgroundColor: COLORS.WHITE,
                border: 'none',
                borderBottom: isPanelCollapsed ? 'none' : `1px solid ${COLORS.LIGHT_GRAY}`,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                color: COLORS.DARK_GRAY
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  transform: isPanelCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
                  transition: 'transform 0.3s ease-out'
                }}
              >
                <path
                  d="M4 6l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {isPanelCollapsed ? 'Покажи слоевете' : 'Скрий слоевете'}
            </button>
          )}
          <LayerPanel
            images={images}
            selectedId={selectedId}
            onSelect={(id) => {
              selectImage(id);
              handleMobileImageInteraction();
            }}
            onDelete={deleteImage}
            onReorder={reorderImage}
            onAddImage={openFilePicker}
            currentView={currentView}
            onViewChange={setCurrentView}
            compact={layoutMode === 'vertical'}
          />
        </div>

        {/* Canvas and Export */}
        <div style={canvasColumnStyle}>
          <div
            ref={containerRef}
            style={containerStyle}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={handleContainerClick}
          >
            {/* Drop zone placeholder */}
            {images.length === 0 && (
              <div style={dropZoneStyle}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "32px",
                    border: `2px dashed ${COLORS.GRAY}`,
                    borderRadius: "20px",
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    maxWidth: "280px",
                    textAlign: "center"
                  }}
                >
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      backgroundColor: "#FEF9E7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "16px",
                      boxShadow: "0 2px 10px rgba(250, 192, 0, 0.2)"
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        stroke={COLORS.ACCENT}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span style={{ fontWeight: 600, color: COLORS.DARK_GRAY, marginBottom: "4px" }}>
                    Пуснете изображение тук
                  </span>
                  <span style={{ color: COLORS.GRAY, fontSize: "13px", marginBottom: "16px" }}>или кликнете за избор</span>
                  <button
                    onClick={openFilePicker}
                    style={{
                      padding: "12px 24px",
                      backgroundColor: COLORS.ACCENT,
                      color: COLORS.BLACK,
                      border: "none",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: "14px",
                      boxShadow: "0 2px 10px rgba(250, 192, 0, 0.3)",
                      transition: "all 0.3s ease-out"
                    }}
                  >
                    Избери файл
                  </button>
                  <span style={{ color: COLORS.GRAY, fontSize: "11px", marginTop: "12px" }}>
                    PNG, JPG, WebP, GIF до 10MB
                  </span>
                </div>
              </div>
            )}

            {/* Clipped area for images - clips to printable area */}
            {displayConfig.printableArea && (
              <div
                style={{
                  position: "absolute",
                  left: displayConfig.printableArea.minX,
                  top: displayConfig.printableArea.minY,
                  width: displayConfig.printableArea.maxX - displayConfig.printableArea.minX,
                  height: displayConfig.printableArea.maxY - displayConfig.printableArea.minY,
                  overflow: "hidden",
                  pointerEvents: "none"
                }}
              >
                {/* Render all images inside clip container */}
                {images.map(imageData => {
                  const scaledTransform = scaleTransform(imageData.transform);

                  // Adjust position relative to printable area
                  const imageStyle: React.CSSProperties = {
                    position: "absolute",
                    left: scaledTransform.position.x - displayConfig.printableArea!.minX,
                    top: scaledTransform.position.y - displayConfig.printableArea!.minY,
                    width: scaledTransform.size.width,
                    height: scaledTransform.size.height,
                    transform: scaledTransform.rotation ? `rotate(${scaledTransform.rotation}deg)` : undefined,
                    transformOrigin: "center center",
                    userSelect: "none",
                    pointerEvents: "none"
                  };

                  return (
                    <img
                      key={imageData.id}
                      src={imageData.src}
                      alt="Качен дизайн"
                      style={imageStyle}
                      draggable={false}
                    />
                  );
                })}
              </div>
            )}

            {/* Render all images (interactive layer - invisible but captures events) */}
            {images.map(imageData => {
              const scaledTransform = scaleTransform(imageData.transform);
              const isSelected = imageData.id === selectedId;

              const imageStyle: React.CSSProperties = {
                position: "absolute",
                left: scaledTransform.position.x,
                top: scaledTransform.position.y,
                width: scaledTransform.size.width,
                height: scaledTransform.size.height,
                transform: scaledTransform.rotation ? `rotate(${scaledTransform.rotation}deg)` : undefined,
                transformOrigin: "center center",
                cursor: isDragging ? "grabbing" : "move",
                userSelect: "none",
                pointerEvents: "auto",
                opacity: displayConfig.printableArea ? 0 : 1,
                // Prevent touch behaviors on image
                touchAction: "none"
              };

              return (
                <React.Fragment key={imageData.id}>
                  <img
                    src={imageData.src}
                    alt="Качен дизайн"
                    style={imageStyle}
                    draggable={false}
                    onPointerDown={e => {
                      handleMobileImageInteraction();
                      handlePointerDown(e, imageData.id, "move");
                    }}
                    onTouchStart={e => {
                      handleMobileImageInteraction();
                      handleTouchStart(e, imageData.id);
                    }}
                    onClick={e => {
                      e.stopPropagation();
                      selectImage(imageData.id);
                      handleMobileImageInteraction();
                    }}
                    onContextMenu={e => e.preventDefault()}
                  />
                  {isSelected && (
                    <Controls
                      transform={scaledTransform}
                      allowRotation={displayConfig.allowRotation || false}
                      onPointerDown={(e, mode, handle) => handlePointerDown(e, imageData.id, mode, handle)}
                    />
                  )}
                </React.Fragment>
              );
            })}

            {/* Printable area indicator */}
            {displayConfig.printableArea && (
              <div
                style={{
                  position: "absolute",
                  left: displayConfig.printableArea.minX,
                  top: displayConfig.printableArea.minY,
                  width: displayConfig.printableArea.maxX - displayConfig.printableArea.minX,
                  height: displayConfig.printableArea.maxY - displayConfig.printableArea.minY,
                  border: `1.5px dashed rgba(74, 74, 74, 0.4)`,
                  borderRadius: "4px",
                  boxSizing: "border-box",
                  pointerEvents: "none"
                }}
              />
            )}
          </div>

          {/* Export Button */}
          {onExport && (
            <button
              style={exportButtonStyle}
              onClick={handleExport}
              onMouseEnter={() => setExportButtonHovered(true)}
              onMouseLeave={() => {
                setExportButtonHovered(false);
                setExportButtonActive(false);
              }}
              onMouseDown={() => setExportButtonActive(true)}
              onMouseUp={() => setExportButtonActive(false)}
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M14 10v2.667A1.334 1.334 0 0112.667 14H3.333A1.334 1.334 0 012 12.667V10M4.667 6.667L8 3.333l3.333 3.334M8 3.333V10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Завърши дизайн
            </button>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </div>
  );
}
