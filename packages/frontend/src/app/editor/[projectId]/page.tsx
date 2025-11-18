'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Toolbar } from '@/components/cad/Toolbar';
import { FeatureTree } from '@/components/cad/FeatureTree';
import { Viewport } from '@/components/cad/Viewport';
import { PropertiesPanel } from '@/components/cad/PropertiesPanel';
import { AIChat } from '@/components/ai/AIChat';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Sparkles, ArrowLeft } from 'lucide-react';
import { useCADStore } from '@/stores/cad-store';
import { useProjectsStore } from '@/stores/projects-store';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AICommandResponse } from '@/lib/ai-client';
import { mockCAD } from '@/lib/mock-cad';
import { toast } from 'sonner';

function CADEditorContent() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { getProject } = useProjectsStore();
  const project = getProject(projectId);

  useEffect(() => {
    if (!project) {
      router.push('/projects');
    }
  }, [project, router]);

  const [aiSidebarOpen, setAiSidebarOpen] = useState(true);
  const { addFeature, features, featureTreeWidth, setFeatureTreeWidth } = useCADStore();

  const handleToolbarAction = (action: string) => {
    // Handle primitive additions with MOCK GEOMETRY
    if (action === 'add-box') {
      const boxData = mockCAD.createBox(50, 50, 50);
      addFeature({
        type: 'sketch',
        name: `Box ${features.filter(f => f.type === 'sketch').length + 1}`,
        visible: true,
        parameters: boxData.parameters,
        geometry: boxData.geometry,
      });
      toast.success('Box created', { description: '50×50×50mm' });
    } else if (action === 'add-cylinder') {
      const cylinderData = mockCAD.createCylinder(20, 40);
      addFeature({
        type: 'sketch',
        name: `Cylinder ${features.filter(f => f.type === 'sketch').length + 1}`,
        visible: true,
        parameters: cylinderData.parameters,
        geometry: cylinderData.geometry,
      });
      toast.success('Cylinder created', { description: 'Radius: 20mm, Height: 40mm' });
    } else if (action === 'add-sphere') {
      const sphereData = mockCAD.createSphere(25);
      addFeature({
        type: 'sketch',
        name: `Sphere ${features.filter(f => f.type === 'sketch').length + 1}`,
        visible: true,
        parameters: sphereData.parameters,
        geometry: sphereData.geometry,
      });
      toast.success('Sphere created', { description: 'Radius: 25mm' });
    }

    // Handle operations
    if (action === 'extrude') {
      addFeature({
        type: 'extrude',
        name: `Extrude ${features.filter((f) => f.type === 'extrude').length + 1}`,
        visible: true,
        parameters: { distance: 10, direction: 'normal' },
      });
    } else if (action === 'cut') {
      addFeature({
        type: 'cut',
        name: `Cut ${features.filter((f) => f.type === 'cut').length + 1}`,
        visible: true,
        parameters: { depth: 5, cutType: 'through' },
      });
    } else if (action === 'fillet') {
      addFeature({
        type: 'fillet',
        name: `Fillet ${features.filter((f) => f.type === 'fillet').length + 1}`,
        visible: true,
        parameters: { radius: 2, edgeCount: 0 },
      });
    } else if (action === 'chamfer') {
      addFeature({
        type: 'chamfer',
        name: `Chamfer ${features.filter((f) => f.type === 'chamfer').length + 1}`,
        visible: true,
        parameters: { distance: 1, angle: 45 },
      });
    } else if (action === 'shell') {
      addFeature({
        type: 'shell',
        name: `Shell ${features.filter((f) => f.type === 'shell').length + 1}`,
        visible: true,
        parameters: { thickness: 2 },
      });
    }

    // Handle view controls
    if (action.startsWith('view-')) {
      console.log('View change:', action);
      // In a real implementation, this would update the camera position
    }

    // Handle tools
    if (action === 'measure' || action === 'section' || action === 'explode') {
      console.log('Tool activated:', action);
      // In a real implementation, this would activate the respective tool
    }

    // Handle file operations
    if (action === 'save') {
      console.log('Saving project:', projectId);
      // In a real implementation, this would save to the backend
    }
  };

  /**
   * Handle AI command execution
   * Creates mock CAD features based on AI parsed commands
   */
  const handleAICommand = (response: AICommandResponse) => {
    if (!response.success) return;

    const { parsed_command } = response;
    const { operation, geometry, parameters } = parsed_command;

    try {
      // Execute mock operations with real geometry based on AI response
      if (operation === 'create') {
        switch (geometry) {
          case 'box': {
            const boxData = mockCAD.createBox(
              parameters.width || 50,
              parameters.height || 50,
              parameters.depth || 50
            );
            addFeature({
              type: 'sketch',
              name: `Box ${features.filter((f) => f.type === 'sketch').length + 1}`,
              visible: true,
              parameters: boxData.parameters,
              geometry: boxData.geometry,
            });
            toast.success('Box created', {
              description: `${parameters.width || 50}×${parameters.height || 50}×${parameters.depth || 50}mm`,
            });
            break;
          }

          case 'cylinder': {
            const cylinderData = mockCAD.createCylinder(
              parameters.radius || 10,
              parameters.height || 20
            );
            addFeature({
              type: 'sketch',
              name: `Cylinder ${features.filter((f) => f.type === 'sketch').length + 1}`,
              visible: true,
              parameters: cylinderData.parameters,
              geometry: cylinderData.geometry,
            });
            toast.success('Cylinder created', {
              description: `Radius: ${parameters.radius || 10}mm, Height: ${parameters.height || 20}mm`,
            });
            break;
          }

          case 'sphere': {
            const sphereData = mockCAD.createSphere(parameters.radius || 10);
            addFeature({
              type: 'sketch',
              name: `Sphere ${features.filter((f) => f.type === 'sketch').length + 1}`,
              visible: true,
              parameters: sphereData.parameters,
              geometry: sphereData.geometry,
            });
            toast.success('Sphere created', {
              description: `Radius: ${parameters.radius || 10}mm`,
            });
            break;
          }

          case 'hole':
            addFeature({
              type: 'cut',
              name: `Hole ${features.filter((f) => f.type === 'cut').length + 1}`,
              visible: true,
              parameters: {
                radius: parameters.radius || 5,
                depth: parameters.depth || 10,
                cutType: 'through',
              },
            });
            toast.success('Hole created', {
              description: `${parameters.radius}mm radius, ${parameters.depth}mm deep`,
            });
            break;

          case 'extrude':
            addFeature({
              type: 'extrude',
              name: `Extrude ${features.filter((f) => f.type === 'extrude').length + 1}`,
              visible: true,
              parameters: {
                distance: parameters.distance || 10,
                direction: parameters.direction || 'normal',
              },
            });
            toast.success('Extrude created', {
              description: `Distance: ${parameters.distance}mm`,
            });
            break;

          default:
            toast.info('Feature recognized', {
              description: `${geometry} operation ready to execute`,
            });
        }
      } else if (operation === 'modify') {
        switch (geometry) {
          case 'fillet':
            addFeature({
              type: 'fillet',
              name: `Fillet ${features.filter((f) => f.type === 'fillet').length + 1}`,
              visible: true,
              parameters: {
                radius: parameters.radius || 2,
                edgeCount: parameters.edgeIds?.length || 0,
              },
            });
            toast.success('Fillet added', {
              description: `Radius: ${parameters.radius}mm`,
            });
            break;

          case 'chamfer':
            addFeature({
              type: 'chamfer',
              name: `Chamfer ${features.filter((f) => f.type === 'chamfer').length + 1}`,
              visible: true,
              parameters: {
                distance: parameters.distance || 1,
                angle: parameters.angle || 45,
              },
            });
            toast.success('Chamfer added', {
              description: `${parameters.distance}mm at ${parameters.angle}°`,
            });
            break;

          default:
            toast.info('Modification ready', {
              description: `${geometry} operation prepared`,
            });
        }
      } else if (operation === 'delete') {
        toast.info('Delete operation', {
          description: 'Select features to delete',
        });
      }
    } catch (error) {
      console.error('Error executing AI command:', error);
      toast.error('Failed to execute command');
    }
  };

  if (!project) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white">
      {/* Project Header */}
      <div className="h-12 border-b border-gray-700 bg-slate-950 flex items-center px-4 gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="sm" className="h-8 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Projects
          </Button>
        </Link>
        <div className="h-4 w-px bg-gray-700" />
        <h1 className="text-sm font-semibold">{project.name}</h1>
        {project.description && (
          <span className="text-sm text-gray-500">· {project.description}</span>
        )}
      </div>

      {/* Toolbar */}
      <Toolbar onAction={handleToolbarAction} />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Feature Tree Sidebar */}
        <div
          className="flex-shrink-0 transition-all duration-300"
          style={{ width: `${featureTreeWidth}px` }}
        >
          <FeatureTree />
        </div>

        {/* Resize Handle for Feature Tree */}
        <div
          className="w-1 bg-gray-700 hover:bg-indigo-500 cursor-col-resize transition-colors"
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startWidth = featureTreeWidth;

            const handleMouseMove = (e: MouseEvent) => {
              const newWidth = Math.max(200, Math.min(500, startWidth + (e.clientX - startX)));
              setFeatureTreeWidth(newWidth);
            };

            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />

        {/* Center Content - Viewport */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative">
            <Viewport />
          </div>

          {/* Properties Panel */}
          <PropertiesPanel />
        </div>

        {/* AI Chat Sidebar */}
        {aiSidebarOpen ? (
          <div className="w-80 flex-shrink-0">
            <AIChat projectId={projectId} onCommandExecuted={handleAICommand} />
          </div>
        ) : (
          <div className="border-l border-gray-700 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-full w-10 rounded-none flex flex-col gap-2 py-4"
              onClick={() => setAiSidebarOpen(true)}
              title="Open AI Assistant"
            >
              <ChevronLeft className="h-4 w-4" />
              <div className="writing-vertical text-xs text-gray-400 rotate-180" style={{ writingMode: 'vertical-rl' }}>
                AI Assistant
              </div>
              <Sparkles className="h-4 w-4 text-purple-400" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CADEditorPage() {
  return (
    <AuthGuard>
      <CADEditorContent />
    </AuthGuard>
  );
}
