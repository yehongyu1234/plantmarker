# PlantMarker — Plant Location Annotation

**Languages:** [中文](README.md) · English

## Overview

PlantMarker is a desktop plant location annotation app built with Vue 3 and Electron. It marks plant positions and names on images and exports annotation data for machine learning training.

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Vue 3 | ^3.4 | Frontend framework |
| Electron | ^28 | Desktop packaging |
| TypeScript | ^5.x | Type system |
| Vite | ^5.x | Build tool |
| Pinia | ^2.x | State management |
| Tailwind CSS | ^3.x | Styling |
| Canvas API | - | Image annotation drawing |

## Features

### 1. Data Import

#### 1.1 Plant Names
- Supported formats: `.txt` (one name per line), `.csv` (first column)
- After import, names appear as a selectable tag list
- Manual add / remove / edit of plant names

#### 1.2 Image Folder
- Pick a local folder; image files are scanned automatically
- Supported formats: `.jpg`, `.jpeg`, `.png`, `.bmp`, `.webp`
- Thumbnail list on the left for all images
- Annotation status: annotated images show a green check in the top-left of the thumbnail
- Annotation count in the bottom-right of each thumbnail

### 2. Annotation

#### 2.1 Canvas
- Image fits the canvas
- Zoom (mouse wheel) and pan (Space + drag)
- Current zoom level shown
- Reset view button

#### 2.2 Outline Tool
- **Free draw**: press and drag to draw a freeform curve
- **Auto simplify**: on mouse up, Ramer–Douglas–Peucker simplifies the curve to a polygon
- **Point mode**: click to add vertices; double-click or close to finish the polygon
- **Simplify threshold**: adjustable (epsilon) to control simplification strength

#### 2.3 Visualization
- **Fill**: polygon regions filled with semi-transparent color (40% opacity)
- **Border**: solid outline in the same hue (2px)
- **Colors**: assigned per plant name via hashing so the same name keeps the same color across images
- **Selection**: selected annotations get a thicker border and higher fill opacity
- **Labels**: small plant name label at the polygon’s top-left

#### 2.4 Annotation Management
- Select a plant name, then draw the outline
- Each annotation includes:
  - Plant name (from the imported list)
  - Polygon vertex coordinates
  - Color (auto-assigned from plant name)
- Select, move, delete annotations
- Edit plant name on an annotation
- Annotation list panel for the current image

#### 2.5 Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+S` | Save annotations for current image |
| `Delete` | Delete selected annotation |
| `Space + drag` | Pan canvas |
| `Wheel` | Zoom canvas |
| `1`–`9` | Quick-select plant name |

### 3. Export

#### 3.1 Single Image JSON

```json
{
  "image": {
    "filename": "plant_001.jpg",
    "width": 1920,
    "height": 1080
  },
  "annotations": [
    {
      "id": "uuid-xxx",
      "plant_name": "Sunflower",
      "polygon": {
        "normalized": [
          [0.123, 0.456],
          [0.234, 0.567],
          [0.345, 0.678]
        ],
        "pixel": [
          [236, 492],
          [449, 612],
          [662, 732]
        ]
      },
      "area_normalized": 0.056,
      "bbox_normalized": [0.123, 0.456, 0.222, 0.222]
    }
  ],
  "metadata": {
    "created_at": "2024-01-01T12:00:00Z",
    "tool_version": "1.0.0"
  }
}
```

#### 3.2 Batch JSONL

One JSON object per line for training datasets:

```jsonl
{"image":"plant_001.jpg","width":1920,"height":1080,"annotations":[{"plant_name":"Sunflower","polygon_normalized":[[0.123,0.456],[0.234,0.567],[0.345,0.678]],"bbox_normalized":[0.123,0.456,0.222,0.222]}]}
{"image":"plant_002.jpg","width":3000,"height":2000,"annotations":[{"plant_name":"Rose","polygon_normalized":[[0.1,0.2],[0.2,0.3],[0.3,0.4]],"bbox_normalized":[0.1,0.2,0.2,0.2]}]}
```

#### 3.3 Normalization

**All coordinates are normalized** (0–1 range) because:
1. Images differ in size; normalization gives a single standard
2. Model training often expects normalized coordinates
3. Easier data augmentation and transfer learning

Formulas:

```
x_normalized = x_pixel / image_width
y_normalized = y_pixel / image_height
```

Pixel coordinates are also exported for manual inspection.

## UI Layout

```
+-------------------------------------------------------------------+
|  PlantMarker - Plant Location Annotation           [-] [ ] [x]   |
+----------+----------------------------------------+---------------+
|          |                                        |  Annotation  |
|  Images  |                                        |  info        |
|  +----+  |                                        |  Current:    |
|  |v 01|  |          Canvas                        |  +---------+  |
|  +----+  |                                        |  | Sunflower|  |
|  |   02|  |      +------------+                    |  | pts: 6   |  |
|  +----+  |      |  Plant image|                    |  +---------+  |
|  |v 03|  |      +------------+                    |               |
|  +----+  |                                        |  Plants:     |
|  |   04|  |      [Semi-transparent polygons]       |  ( ) Sunflower|
|  +----+  |                                        |  ( ) Rose    |
|          |                                        |  ( ) Lavender|
| Folder:  |                                        |               |
| [Import] |                                        |  Simplify:   |
|          |                                        |  ===O=== 5    |
| Names:   |                                        |               |
| [Import] |                                        |  [Del][Export]|
+----------+----------------------------------------+---------------+
|  Zoom: 100%  |  Image: 1920x1080  |  Count: 3  |  Mode: draw   |
+-------------------------------------------------------------------+
```

Legend:
- `v 01` — annotated (green check + index)
- `  02` — not annotated
- Polygons use semi-transparent fills; colors differ by plant name

## Project Structure

```
plant-marker/
├── electron/                  # Electron main process
│   ├── main.ts               # Main entry
│   ├── preload.ts            # Preload script
│   └── utils/                # File helpers
│       ├── fileReader.ts     # Read files
│       └── fileWriter.ts     # Write files
├── src/                       # Vue frontend
│   ├── App.vue               # Root component
│   ├── main.ts               # Vue entry
│   ├── components/           # Components
│   │   ├── Canvas/           # Canvas
│   │   │   ├── AnnotationCanvas.vue  # Annotation canvas (core)
│   │   │   ├── useCanvas.ts          # Canvas logic
│   │   │   ├── useDrawing.ts         # Drawing logic
│   │   │   └── useSimplify.ts        # Line simplification
│   │   ├── Sidebar/          # Sidebar
│   │   │   ├── ImageList.vue         # Image list
│   │   │   └── PlantList.vue         # Plant names
│   │   ├── Panel/            # Right panel
│   │   │   ├── AnnotationInfo.vue    # Annotation info
│   │   │   └── ExportPanel.vue       # Export panel
│   │   └── Toolbar/          # Toolbar
│   │       └── ToolBar.vue
│   ├── stores/               # Pinia stores
│   │   ├── imageStore.ts     # Images
│   │   ├── annotationStore.ts # Annotations
│   │   └── plantStore.ts     # Plant names
│   ├── utils/                # Utilities
│   │   ├── geometry.ts       # Geometry
│   │   ├── simplify.ts       # RDP simplification
│   │   ├── export.ts         # Export
│   │   └── constants.ts      # Constants
│   ├── types/                # TypeScript types
│   │   └── index.ts
│   └── assets/               # Static assets
├── public/                    # Public static files
├── package.json
├── vite.config.ts
├── electron-builder.json
└── tsconfig.json
```

## Core Algorithms

### Ramer–Douglas–Peucker Line Simplification

```
Input: point set points[], threshold epsilon
Output: simplified point set

1. Find the point farthest from the line between first and last: dmax
2. If dmax > epsilon:
   - Recursively simplify the first half
   - Recursively simplify the second half
   - Merge results
3. Else:
   - Keep only the first and last points
```

### Plant Name Color Assignment

```typescript
// Fixed color from plant name (HSL)
function getPlantColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsla(${hue}, 70%, 50%, 0.4)`  // 40% fill opacity
}
```

## Commands

```bash
# Install dependencies
npm install

# Development
npm run dev

# Typecheck
npm run typecheck

# Build Windows .exe
npm run build:win
```

## License

This project is released under the [MIT License](LICENSE). You may use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, provided that the copyright notice and permission notice are included in all copies or substantial portions.
