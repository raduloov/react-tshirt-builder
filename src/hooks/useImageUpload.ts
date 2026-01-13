import { useCallback, useRef, useState } from 'react';
import type { ImageData, ImageTransform, EditorConfig } from '../types';

const DEFAULT_ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export interface UploadState {
  /** Whether an upload is currently in progress */
  isUploading: boolean;
  /** Upload progress percentage (0-100) */
  progress: number;
  /** File name being uploaded */
  fileName: string | null;
}

interface UseImageUploadOptions {
  config: EditorConfig;
  onImageLoad: (imageData: ImageData) => void;
  onError?: (error: string) => void;
  /** Enable mobile-optimized upload experience */
  isMobile?: boolean;
}

export function useImageUpload({ config, onImageLoad, onError, isMobile = false }: UseImageUploadOptions) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    fileName: null
  });

  const acceptedTypes = config.acceptedFileTypes || DEFAULT_ACCEPTED_TYPES;
  const maxFileSize = config.maxFileSize || DEFAULT_MAX_FILE_SIZE;

  // For mobile, use image/* to allow camera and all image types
  // For desktop, use specific MIME types
  const acceptAttribute = isMobile ? 'image/*' : acceptedTypes.join(',');

  const processFile = useCallback(
    (file: File) => {
      // For mobile, be more lenient with MIME types (camera may return different types)
      // Check if it's an image by prefix
      const isImage = file.type.startsWith('image/') || acceptedTypes.includes(file.type);

      if (!isImage) {
        onError?.(`Невалиден тип файл. Позволени: ${acceptedTypes.join(', ')}`);
        return;
      }

      // Validate file size
      if (file.size > maxFileSize) {
        onError?.(`Файлът е твърде голям. Максимален размер: ${Math.round(maxFileSize / 1024 / 1024)}MB`);
        return;
      }

      // Set uploading state
      setUploadState({
        isUploading: true,
        progress: 0,
        fileName: file.name
      });

      const reader = new FileReader();

      // Track progress for visual feedback
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 50); // 0-50% for reading
          setUploadState(prev => ({ ...prev, progress }));
        }
      };

      reader.onload = (e) => {
        const src = e.target?.result as string;
        const img = new Image();

        // Update progress - file read complete, now loading image
        setUploadState(prev => ({ ...prev, progress: 60 }));

        img.onload = () => {
          setUploadState(prev => ({ ...prev, progress: 80 }));

          const { naturalWidth, naturalHeight } = img;

          // Calculate initial size to fit within editor while maintaining aspect ratio
          const printableArea = config.printableArea || {
            minX: 0,
            minY: 0,
            maxX: config.width,
            maxY: config.height,
          };

          const areaWidth = printableArea.maxX - printableArea.minX;
          const areaHeight = printableArea.maxY - printableArea.minY;

          const aspectRatio = naturalWidth / naturalHeight;
          let width: number;
          let height: number;

          // Fit image to 60% of printable area by default
          const targetSize = Math.min(areaWidth, areaHeight) * 0.6;

          if (aspectRatio > 1) {
            width = targetSize;
            height = targetSize / aspectRatio;
          } else {
            height = targetSize;
            width = targetSize * aspectRatio;
          }

          // Center in printable area
          const x = printableArea.minX + (areaWidth - width) / 2;
          const y = printableArea.minY + (areaHeight - height) / 2;

          const transform: ImageTransform = {
            position: { x, y },
            size: { width, height },
            rotation: 0,
          };

          // Complete - 100%
          setUploadState(prev => ({ ...prev, progress: 100 }));

          onImageLoad({
            id: generateId(),
            src,
            naturalWidth,
            naturalHeight,
            transform,
          });

          // Reset upload state after a brief delay for visual feedback
          setTimeout(() => {
            setUploadState({
              isUploading: false,
              progress: 0,
              fileName: null
            });
          }, 300);
        };

        img.onerror = () => {
          setUploadState({
            isUploading: false,
            progress: 0,
            fileName: null
          });
          onError?.('Грешка при зареждане на изображението');
        };

        img.src = src;
      };

      reader.onerror = () => {
        setUploadState({
          isUploading: false,
          progress: 0,
          fileName: null
        });
        onError?.('Грешка при четене на файла');
      };

      reader.readAsDataURL(file);
    },
    [acceptedTypes, maxFileSize, config, onImageLoad, onError]
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        processFile(file);
      }
      // Reset input so the same file can be selected again
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const file = event.dataTransfer.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  // Handle paste from clipboard
  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            processFile(file);
            return;
          }
        }
      }
    },
    [processFile]
  );

  return {
    inputRef,
    handleFileChange,
    handleDrop,
    handleDragOver,
    openFilePicker,
    handlePaste,
    acceptedTypes,
    acceptAttribute,
    uploadState,
    isMobile,
  };
}
