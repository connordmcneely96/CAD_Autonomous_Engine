import { create } from 'zustand';

export interface Geometry {
  vertices: number[];
  indices: number[];
  normals: number[];
  vertex_count: number;
  triangle_count: number;
}

export interface CADFeature {
  id: string;
  type: 'sketch' | 'extrude' | 'cut' | 'fillet' | 'chamfer' | 'hole' | 'shell' | 'pattern';
  name: string;
  visible: boolean;
  parameters: Record<string, any>;
  geometry?: Geometry; // 3D mesh data
  parentId?: string;
  children?: string[];
}

interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
}

interface CADState {
  // Features
  features: CADFeature[];
  selectedFeatureId: string | null;
  hoveredFeatureId: string | null;

  // Camera
  camera: CameraState;

  // UI State
  propertiesPanelOpen: boolean;
  aiSidebarOpen: boolean;
  featureTreeWidth: number;

  // Current geometry (placeholder for actual 3D data)
  currentGeometry: any | null;

  // Actions - Feature Management
  addFeature: (feature: Omit<CADFeature, 'id'>) => void;
  updateFeature: (id: string, updates: Partial<CADFeature>) => void;
  deleteFeature: (id: string) => void;
  selectFeature: (id: string | null) => void;
  hoverFeature: (id: string | null) => void;
  toggleFeatureVisibility: (id: string) => void;
  reorderFeatures: (features: CADFeature[]) => void;

  // Actions - Camera
  updateCamera: (camera: Partial<CameraState>) => void;
  resetCamera: () => void;

  // Actions - UI
  togglePropertiesPanel: () => void;
  toggleAISidebar: () => void;
  setFeatureTreeWidth: (width: number) => void;

  // Actions - Geometry
  updateGeometry: (geometry: any) => void;
}

const DEFAULT_CAMERA: CameraState = {
  position: [10, 10, 10],
  target: [0, 0, 0],
};

// Sample initial features
const SAMPLE_FEATURES: CADFeature[] = [
  {
    id: 'feature-1',
    type: 'sketch',
    name: 'Sketch1',
    visible: true,
    parameters: {
      plane: 'XY',
      offset: 0,
    },
  },
  {
    id: 'feature-2',
    type: 'extrude',
    name: 'Extrude1',
    visible: true,
    parameters: {
      distance: 10,
      direction: 'normal',
      operation: 'new',
    },
    parentId: 'feature-1',
  },
  {
    id: 'feature-3',
    type: 'fillet',
    name: 'Fillet1',
    visible: true,
    parameters: {
      radius: 2,
      edges: ['edge1', 'edge2'],
    },
    parentId: 'feature-2',
  },
];

export const useCADStore = create<CADState>((set) => ({
  // Initial State
  features: SAMPLE_FEATURES,
  selectedFeatureId: null,
  hoveredFeatureId: null,
  camera: DEFAULT_CAMERA,
  propertiesPanelOpen: true,
  aiSidebarOpen: true,
  featureTreeWidth: 280,
  currentGeometry: null,

  // Feature Management
  addFeature: (feature) =>
    set((state) => ({
      features: [
        ...state.features,
        {
          ...feature,
          id: `feature-${Date.now()}`,
        },
      ],
    })),

  updateFeature: (id, updates) =>
    set((state) => ({
      features: state.features.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    })),

  deleteFeature: (id) =>
    set((state) => ({
      features: state.features.filter((f) => f.id !== id),
      selectedFeatureId: state.selectedFeatureId === id ? null : state.selectedFeatureId,
    })),

  selectFeature: (id) => set({ selectedFeatureId: id }),

  hoverFeature: (id) => set({ hoveredFeatureId: id }),

  toggleFeatureVisibility: (id) =>
    set((state) => ({
      features: state.features.map((f) => (f.id === id ? { ...f, visible: !f.visible } : f)),
    })),

  reorderFeatures: (features) => set({ features }),

  // Camera Management
  updateCamera: (camera) =>
    set((state) => ({
      camera: { ...state.camera, ...camera },
    })),

  resetCamera: () => set({ camera: DEFAULT_CAMERA }),

  // UI Management
  togglePropertiesPanel: () =>
    set((state) => ({
      propertiesPanelOpen: !state.propertiesPanelOpen,
    })),

  toggleAISidebar: () =>
    set((state) => ({
      aiSidebarOpen: !state.aiSidebarOpen,
    })),

  setFeatureTreeWidth: (width) => set({ featureTreeWidth: width }),

  // Geometry Management
  updateGeometry: (geometry) => set({ currentGeometry: geometry }),
}));
