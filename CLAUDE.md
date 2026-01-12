# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Build the library (outputs to dist/)
yarn build

# Watch mode for development
yarn dev

# Type checking
yarn type-check

# Linting
yarn lint
```

## Example App

The `example/` directory contains a Vite-based demo app:

```bash
cd example
yarn install
yarn dev      # Start dev server
```

## Architecture

This is a React component library for image customization on t-shirt templates. It produces both CommonJS (`dist/index.cjs.js`) and ESM (`dist/index.esm.js`) builds via Rollup.

### Key Components

- **TShirtBuilder** (`src/components/TShirtBuilder.tsx`): Main component that orchestrates the entire editor. Manages front/back views, handles image rendering with clipping to printable areas, and coordinates all child components.

- **Controls** (`src/components/Controls.tsx`): Renders resize handles and rotation controls around selected images.

- **LayerPanel** (`src/components/LayerPanel.tsx`): Sidebar for managing multiple uploaded images (layer ordering, selection, deletion, view switching).

### Hooks

- **useImageUpload**: Handles file selection, drag-drop, validation, and initial image positioning within the printable area.

- **useImageTransform**: Manages image selection state and all transform operations (move, resize, rotate) with printable area constraints.

### Utilities

- **canvas.ts**: Export functionality - renders background + all images to an offscreen canvas for data URL export.

### Type System

All types are defined in `src/types/index.ts`. Key interfaces:
- `ImageData`: Individual image with id, src, dimensions, and transform
- `ViewImages`: Container for front/back image arrays
- `EditorConfig`: Canvas dimensions, printable area bounds, size limits, rotation toggle
- `TShirtBuilderProps`: Component props including background images for both views

### Multi-Image & Multi-View Support

The editor supports multiple images per view (layered) and two views (front/back). Images are constrained to an optional `printableArea` bounding box. The clipping is handled by rendering images twice - once inside a clipped container (visual) and once as an invisible interactive layer for mouse events.

## UI Language

The component UI text is in Bulgarian.
