import type { ImageData, EditorConfig } from '../types';
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
export declare function useImageUpload({ config, onImageLoad, onError, isMobile }: UseImageUploadOptions): {
    inputRef: import("react").RefObject<HTMLInputElement>;
    handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleDrop: (event: React.DragEvent) => void;
    handleDragOver: (event: React.DragEvent) => void;
    openFilePicker: () => void;
    handlePaste: (event: ClipboardEvent) => void;
    acceptedTypes: string[];
    acceptAttribute: string;
    uploadState: UploadState;
    isMobile: boolean;
};
export {};
