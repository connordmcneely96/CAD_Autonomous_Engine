'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import { useCADStore } from '@/stores/cad-store';
import { cn } from '@/lib/utils';

export function PropertiesPanel() {
  const {
    features,
    selectedFeatureId,
    propertiesPanelOpen,
    setPropertiesPanelOpen,
    updateFeature,
    selectFeature,
  } = useCADStore();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editedParameters, setEditedParameters] = useState<Record<string, any>>({});

  const selectedFeature = features.find((f) => f.id === selectedFeatureId);

  // Initialize edited parameters when selection changes
  useEffect(() => {
    if (selectedFeature) {
      setEditedParameters(selectedFeature.parameters);
    }
  }, [selectedFeature]);

  const handleParameterChange = (key: string, value: any) => {
    setEditedParameters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApply = () => {
    if (selectedFeatureId) {
      updateFeature(selectedFeatureId, { parameters: editedParameters });
    }
  };

  const handleCancel = () => {
    if (selectedFeature) {
      setEditedParameters(selectedFeature.parameters);
    }
  };

  const handleClose = () => {
    selectFeature(null);
  };

  if (!propertiesPanelOpen && !selectedFeature) {
    return null;
  }

  return (
    <div
      className={cn(
        'border-t border-gray-700 bg-slate-900 transition-all duration-300',
        isCollapsed ? 'h-10' : 'h-80'
      )}
    >
      {/* Header */}
      <div className="h-10 border-b border-gray-700 flex items-center justify-between px-4 bg-slate-800">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <h3 className="text-sm font-semibold">Properties</h3>
          {selectedFeature && (
            <span className="text-xs text-gray-400">- {selectedFeature.name}</span>
          )}
        </div>
        {selectedFeature && (
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      {!isCollapsed && (
        <ScrollArea className="h-[calc(100%-2.5rem)]">
          <div className="p-4 space-y-4">
            {!selectedFeature ? (
              <div className="text-center py-8 text-sm text-gray-500">
                Select a feature to view its properties
              </div>
            ) : (
              <>
                {/* Feature Info */}
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-gray-400">Feature Type</Label>
                    <div className="text-sm capitalize">{selectedFeature.type}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Feature Name</Label>
                    <Input
                      value={selectedFeature.name}
                      onChange={(e) =>
                        updateFeature(selectedFeature.id, { name: e.target.value })
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                {/* Parameters */}
                <div className="space-y-3">
                  <Label className="text-xs text-gray-400">Parameters</Label>

                  {selectedFeature.type === 'sketch' && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs">Plane</Label>
                        <Select
                          value={editedParameters.plane || 'XY'}
                          onValueChange={(value) => handleParameterChange('plane', value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="XY">XY Plane</SelectItem>
                            <SelectItem value="XZ">XZ Plane</SelectItem>
                            <SelectItem value="YZ">YZ Plane</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Offset (mm)</Label>
                        <Input
                          type="number"
                          value={editedParameters.offset || 0}
                          onChange={(e) =>
                            handleParameterChange('offset', parseFloat(e.target.value))
                          }
                          className="h-8"
                        />
                      </div>
                    </>
                  )}

                  {selectedFeature.type === 'extrude' && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs">Distance (mm)</Label>
                        <Input
                          type="number"
                          value={editedParameters.distance || 10}
                          onChange={(e) =>
                            handleParameterChange('distance', parseFloat(e.target.value))
                          }
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Direction</Label>
                        <Select
                          value={editedParameters.direction || 'normal'}
                          onValueChange={(value) => handleParameterChange('direction', value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="reversed">Reversed</SelectItem>
                            <SelectItem value="symmetric">Symmetric</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {selectedFeature.type === 'fillet' && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs">Radius (mm)</Label>
                        <Input
                          type="number"
                          value={editedParameters.radius || 2}
                          onChange={(e) =>
                            handleParameterChange('radius', parseFloat(e.target.value))
                          }
                          className="h-8"
                          step="0.1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Edges Selected</Label>
                        <div className="text-sm text-gray-400">
                          {editedParameters.edgeCount || 0} edge(s)
                        </div>
                      </div>
                    </>
                  )}

                  {selectedFeature.type === 'cut' && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs">Depth (mm)</Label>
                        <Input
                          type="number"
                          value={editedParameters.depth || 5}
                          onChange={(e) =>
                            handleParameterChange('depth', parseFloat(e.target.value))
                          }
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={editedParameters.cutType || 'through'}
                          onValueChange={(value) => handleParameterChange('cutType', value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="through">Through All</SelectItem>
                            <SelectItem value="blind">Blind</SelectItem>
                            <SelectItem value="upTo">Up To Surface</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {selectedFeature.type === 'chamfer' && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs">Distance (mm)</Label>
                        <Input
                          type="number"
                          value={editedParameters.distance || 1}
                          onChange={(e) =>
                            handleParameterChange('distance', parseFloat(e.target.value))
                          }
                          className="h-8"
                          step="0.1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Angle (degrees)</Label>
                        <Input
                          type="number"
                          value={editedParameters.angle || 45}
                          onChange={(e) =>
                            handleParameterChange('angle', parseFloat(e.target.value))
                          }
                          className="h-8"
                        />
                      </div>
                    </>
                  )}

                  {selectedFeature.type === 'hole' && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs">Diameter (mm)</Label>
                        <Input
                          type="number"
                          value={editedParameters.diameter || 5}
                          onChange={(e) =>
                            handleParameterChange('diameter', parseFloat(e.target.value))
                          }
                          className="h-8"
                          step="0.1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Depth (mm)</Label>
                        <Input
                          type="number"
                          value={editedParameters.depth || 10}
                          onChange={(e) =>
                            handleParameterChange('depth', parseFloat(e.target.value))
                          }
                          className="h-8"
                        />
                      </div>
                    </>
                  )}

                  {selectedFeature.type === 'shell' && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs">Thickness (mm)</Label>
                        <Input
                          type="number"
                          value={editedParameters.thickness || 2}
                          onChange={(e) =>
                            handleParameterChange('thickness', parseFloat(e.target.value))
                          }
                          className="h-8"
                          step="0.1"
                        />
                      </div>
                    </>
                  )}

                  {selectedFeature.type === 'pattern' && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs">Count</Label>
                        <Input
                          type="number"
                          value={editedParameters.count || 3}
                          onChange={(e) =>
                            handleParameterChange('count', parseInt(e.target.value))
                          }
                          className="h-8"
                          min="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Spacing (mm)</Label>
                        <Input
                          type="number"
                          value={editedParameters.spacing || 10}
                          onChange={(e) =>
                            handleParameterChange('spacing', parseFloat(e.target.value))
                          }
                          className="h-8"
                        />
                      </div>
                    </>
                  )}
                </div>

                <Separator className="bg-gray-700" />

                {/* Actions */}
                <div className="flex gap-2">
                  <Button onClick={handleApply} className="flex-1 h-8" size="sm">
                    Apply
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="flex-1 h-8"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
