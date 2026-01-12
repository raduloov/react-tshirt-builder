import React from "react";
import type { ImageData, TShirtView } from "../types";
interface LayerPanelProps {
    images: ImageData[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onReorder: (fromIndex: number, toIndex: number) => void;
    onAddImage: () => void;
    currentView: TShirtView;
    onViewChange: (view: TShirtView) => void;
}
export declare const LayerPanel: React.NamedExoticComponent<LayerPanelProps>;
export {};
