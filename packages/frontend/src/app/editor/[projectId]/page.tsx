'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Toolbar } from '@/components/cad/Toolbar';
import { FeatureTree } from '@/components/cad/FeatureTree';
import { Viewport } from '@/components/cad/Viewport';
import { PropertiesPanel } from '@/components/cad/PropertiesPanel';
import { AIChat } from '@/components/ai/AIChat';
import { BoxDialog, CylinderDialog, SphereDialog } from '@/components/cad/PrimitiveDialogs';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { MobileTabBar } from '@/components/layout/mobile-tab-bar';
import { ChevronLeft, Sparkles, ArrowLeft, Wrench, Layers, MessageSquare, Settings } from 'lucide-react';
import { useCADStore } from '@/stores/cad-store';
import { useProjectsStore } from '@/stores/projects-store';
import { useCADOperations } from '@/hooks/useCADOperations';
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
  const [boxDialogOpen, setBoxDialogOpen] = useState(false);
  const [cylinderDialogOpen, setCylinderDialogOpen] = useState(false);
  const [sphereDialogOpen, setSphereDialogOpen] = useState(false);

  // Mobile state
  const [mobileActiveTab, setMobileActiveTab] = useState<string | null>(null);

  const { addFeature, features, featureTreeWidth, setFeatureTreeWidth } = useCADStore();
  const { isLoading, createBox, createCylinder, createSphere } = useCADOperations();

  // Environment variable to toggle between mock and real CAD
  const useMockMode = process.env.NEXT_PUBLIC_USE_MOCK_CAD === 'true';

  // Mobile tabs configuration
  const mobileTabs = [
    { id: 'tools', label: 'Tools', icon: <Wrench className="h-5 w-5" /> },
    { id: 'features', label: 'Features', icon: <Layers className="h-5 w-5" /> },
    { id: 'ai', label: 'AI', icon: <MessageSquare className="h-5 w-5" /> },
    { id: 'properties', label: 'Properties', icon: <Settings className="h-5 w-5" /> },
  ];

  const handleMobileTabChange = (tabId: string) => {
    setMobileActiveTab(mobileActiveTab === tabId ? null : tabId);
  };

  const handleToolbarAction = (action: string) => {
    // Handle primitive additions
    if (action === 'add-box') {
      if (useMockMode) {
        // Use mock CAD for development
        const boxData = mockCAD.createBox(50, 50, 50);
        addFeature({
          type: 'sketch',
          name: `Box ${features.filter(f => f.type === 'sketch').length + 1}`,
          visible: true,
          parameters: boxData.parameters,
          geometry: boxData.geometry,
        });
        toast.success('Box created', { description: '50×50×50mm' });
      } else {
        // Use real CAD engine - open dialog
        setBoxDialogOpen(true);
      }
    } else if (action === 'add-cylinder') {
      if (useMockMode) {
        const cylinderData = mockCAD.createCylinder(20, 40);
        addFeature({
          type: 'sketch',
          name: `Cylinder ${features.filter(f => f.type === 'sketch').length + 1}`,
          visible: true,
          parameters: cylinderData.parameters,
          geometry: cylinderData.geometry,
        });
        toast.success('Cylinder created', { description: 'Radius: 20mm, Height: 40mm' });
      } else {
        setCylinderDialogOpen(true);
      }
    } else if (action === 'add-sphere') {
      if (useMockMode) {
        const sphereData = mockCAD.createSphere(25);
        addFeature({
          type: 'sketch',
          name: `Sphere ${features.filter(f => f.type === 'sketch').length + 1}`,
          visible: true,
          parameters: sphereData.parameters,
          geometry: sphereData.geometry,
        });
        toast.success('Sphere created', { description: 'Radius: 25mm' });
      } else {
        setSphereDialogOpen(true);
      }
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
      {/* Parameter Dialogs */}
      <BoxDialog
        open={boxDialogOpen}
        onOpenChange={setBoxDialogOpen}
        onConfirm={(width, height, depth) => createBox(width, height, depth)}
      />
      <CylinderDialog
        open={cylinderDialogOpen}
        onOpenChange={setCylinderDialogOpen}
        onConfirm={(radius, height) => createCylinder(radius, height)}
      />
      <SphereDialog
        open={sphereDialogOpen}
        onOpenChange={setSphereDialogOpen}
        onConfirm={(radius) => createSphere(radius)}
      />

      {/* Project Header */}
      <div className="h-12 border-b border-gray-700 bg-slate-950 flex items-center px-2 sm:px-4 gap-2 sm:gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="sm" className="h-8 gap-1 sm:gap-2 px-2 sm:px-3">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Projects</span>
          </Button>
        </Link>
        <div className="h-4 w-px bg-gray-700 hidden sm:block" />
        <h1 className="text-xs sm:text-sm font-semibold truncate flex-1 min-w-0">{project.name}</h1>
        {project.description && (
          <span className="text-sm text-gray-500 hidden lg:inline">· {project.description}</span>
        )}
        {isLoading && <span className="text-xs sm:text-sm text-gray-400">Creating...</span>}
      </div>

      {/* Toolbar */}
      <Toolbar onAction={handleToolbarAction} />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Feature Tree Sidebar - Hidden on mobile */}
        <div
          className="hidden md:block flex-shrink-0 transition-all duration-300"
          style={{ width: `${featureTreeWidth}px` }}
        >
          <FeatureTree />
        </div>

        {/* Resize Handle for Feature Tree - Hidden on mobile */}
        <div
          className="hidden md:block w-1 bg-gray-700 hover:bg-indigo-500 cursor-col-resize transition-colors"
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

          {/* Properties Panel - Hidden on mobile */}
          <div className="hidden sm:block">
            <PropertiesPanel />
          </div>
        </div>

        {/* AI Chat Sidebar - Hidden on mobile */}
        {aiSidebarOpen ? (
          <div className="hidden lg:block w-80 flex-shrink-0">
            <AIChat projectId={projectId} onCommandExecuted={handleAICommand} />
          </div>
        ) : (
          <div className="hidden lg:block border-l border-gray-700 flex-shrink-0">
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

      {/* Mobile Tab Bar */}
      <MobileTabBar
        tabs={mobileTabs}
        activeTab={mobileActiveTab || ''}
        onTabChange={handleMobileTabChange}
      />

      {/* Mobile Bottom Sheets */}
      <BottomSheet
        open={mobileActiveTab === 'tools'}
        onClose={() => setMobileActiveTab(null)}
        title="Tools"
      >
        <div className="grid grid-cols-4 gap-4">
          <button
            onClick={() => {
              handleToolbarAction('add-box');
              setMobileActiveTab(null);
            }}
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-800 active:bg-slate-700"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-indigo-600 rounded-lg">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs">Box</span>
          </button>
          <button
            onClick={() => {
              handleToolbarAction('add-cylinder');
              setMobileActiveTab(null);
            }}
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-800 active:bg-slate-700"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-indigo-600 rounded-lg">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs">Cylinder</span>
          </button>
          <button
            onClick={() => {
              handleToolbarAction('add-sphere');
              setMobileActiveTab(null);
            }}
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-800 active:bg-slate-700"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-indigo-600 rounded-lg">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs">Sphere</span>
          </button>
        </div>
      </BottomSheet>

      <BottomSheet
        open={mobileActiveTab === 'features'}
        onClose={() => setMobileActiveTab(null)}
        title="Features"
      >
        <FeatureTree />
      </BottomSheet>

      <BottomSheet
        open={mobileActiveTab === 'ai'}
        onClose={() => setMobileActiveTab(null)}
        title="AI Assistant"
        snapPoints={['75%']}
      >
        <AIChat projectId={projectId} onCommandExecuted={handleAICommand} />
      </BottomSheet>

      <BottomSheet
        open={mobileActiveTab === 'properties'}
        onClose={() => setMobileActiveTab(null)}
        title="Properties"
      >
        <PropertiesPanel />
      </BottomSheet>
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
