import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Project {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  thumbnailUrl?: string;
  userId: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectsState {
  projects: Project[];
  currentProject: Project | null;

  // Actions
  getProjects: (userId: string) => Project[];
  getProject: (projectId: string) => Project | undefined;
  createProject: (name: string, description: string, userId: string) => Project;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  setCurrentProject: (project: Project | null) => void;
}

// Initial mock projects
const INITIAL_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Sample Bracket',
    description: 'A simple mounting bracket for demonstration',
    thumbnail: undefined,
    thumbnailUrl: undefined,
    userId: 'demo-user',
    isPublic: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Motor Mount',
    description: 'NEMA 23 stepper motor mount',
    thumbnail: undefined,
    thumbnailUrl: undefined,
    userId: 'demo-user',
    isPublic: false,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '3',
    name: 'Custom Enclosure',
    description: 'Electronics enclosure with ventilation',
    thumbnail: undefined,
    thumbnailUrl: undefined,
    userId: 'demo-user',
    isPublic: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
];

export const useProjectsStore = create<ProjectsState>()(
  persist(
    (set, get) => ({
      projects: INITIAL_PROJECTS,
      currentProject: null,

      getProjects: (userId: string) => {
        return get().projects.filter((p) => p.userId === userId || p.userId === 'demo-user');
      },

      getProject: (projectId: string) => {
        return get().projects.find((p) => p.id === projectId);
      },

      createProject: (name: string, description: string, userId: string) => {
        const newProject: Project = {
          id: 'proj-' + Math.random().toString(36).substr(2, 9),
          name,
          description,
          thumbnail: undefined,
          thumbnailUrl: undefined,
          userId,
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          projects: [...state.projects, newProject],
        }));

        return newProject;
      },

      updateProject: (projectId: string, updates: Partial<Project>) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, ...updates, updatedAt: new Date() } : p
          ),
        }));
      },

      deleteProject: (projectId: string) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
        }));
      },

      setCurrentProject: (project: Project | null) => {
        set({ currentProject: project });
      },
    }),
    {
      name: 'cad-projects-storage',
    }
  )
);
