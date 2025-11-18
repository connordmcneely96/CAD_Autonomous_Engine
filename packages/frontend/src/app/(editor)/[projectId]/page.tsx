'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Toolbar } from '@/components/cad/Toolbar';
import { FeatureTree } from '@/components/cad/FeatureTree';
import { Viewport } from '@/components/cad/Viewport';
import { PropertiesPanel } from '@/components/cad/PropertiesPanel';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Send, Sparkles } from 'lucide-react';
import { useCADStore } from '@/stores/cad-store';
import { cn } from '@/lib/utils';

export default function CADEditorPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [aiSidebarOpen, setAiSidebarOpen] = useState(true);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI CAD assistant. I can help you create and modify 3D models using natural language. Try asking me to "create a box" or "add a cylinder".',
    },
  ]);

  const { addFeature, features, featureTreeWidth, setFeatureTreeWidth } = useCADStore();

  const handleToolbarAction = (action: string) => {
    console.log('Toolbar action:', action);

    // Handle primitive additions
    if (action === 'add-box') {
      addFeature({
        type: 'sketch',
        name: `Box Sketch ${features.length + 1}`,
        visible: true,
        parameters: { plane: 'XY', offset: 0, shape: 'rectangle' },
      });
    } else if (action === 'add-cylinder') {
      addFeature({
        type: 'sketch',
        name: `Cylinder Sketch ${features.length + 1}`,
        visible: true,
        parameters: { plane: 'XY', offset: 0, shape: 'circle' },
      });
    } else if (action === 'add-sphere') {
      addFeature({
        type: 'sketch',
        name: `Sphere Sketch ${features.length + 1}`,
        visible: true,
        parameters: { plane: 'XY', offset: 0, shape: 'circle' },
      });
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

  const handleAiSubmit = () => {
    if (!aiInput.trim()) return;

    // Add user message
    const newMessages = [
      ...aiMessages,
      { role: 'user' as const, content: aiInput },
      {
        role: 'assistant' as const,
        content: 'I understand your request. In a production environment, I would process your natural language command and create the appropriate CAD features. This is a demo response.',
      },
    ];

    setAiMessages(newMessages);
    setAiInput('');
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white">
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
        <div
          className={cn(
            'border-l border-gray-700 bg-slate-900 transition-all duration-300 flex flex-col',
            aiSidebarOpen ? 'w-80' : 'w-0'
          )}
        >
          {aiSidebarOpen && (
            <>
              {/* AI Header */}
              <div className="h-12 border-b border-gray-700 flex items-center justify-between px-4 bg-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  <h3 className="text-sm font-semibold">AI Assistant</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setAiSidebarOpen(false)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* AI Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {aiMessages.map((message, index) => (
                    <div
                      key={index}
                      className={cn(
                        'p-3 rounded-lg text-sm',
                        message.role === 'user'
                          ? 'bg-indigo-600 ml-4'
                          : 'bg-slate-800 mr-4'
                      )}
                    >
                      {message.content}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* AI Input */}
              <div className="p-4 border-t border-gray-700">
                <div className="flex gap-2">
                  <Input
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAiSubmit();
                      }
                    }}
                    placeholder="Ask AI to create features..."
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleAiSubmit}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Try: "Create a 10mm box" or "Add a fillet to the edges"
                </div>
              </div>
            </>
          )}
        </div>

        {/* AI Sidebar Toggle (when closed) */}
        {!aiSidebarOpen && (
          <div className="border-l border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              className="h-12 w-8 rounded-none"
              onClick={() => setAiSidebarOpen(true)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
