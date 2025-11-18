'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  GripVertical,
  Box,
  Circle,
  Minus,
  Plus,
  RectangleHorizontal,
  Scissors,
  FileStack,
  Target,
} from 'lucide-react';
import { useCADStore } from '@/stores/cad-store';
import type { CADFeature } from '@/stores/cad-store';
import { cn } from '@/lib/utils';

interface FeatureTreeItemProps {
  feature: CADFeature;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function FeatureTreeItem({
  feature,
  isSelected,
  onSelect,
  onToggleVisibility,
  onEdit,
  onDelete,
}: FeatureTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: feature.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getFeatureIcon = (type: CADFeature['type']) => {
    const iconProps = { className: 'h-4 w-4' };
    switch (type) {
      case 'sketch':
        return <Target {...iconProps} />;
      case 'extrude':
        return <Plus {...iconProps} />;
      case 'cut':
        return <Minus {...iconProps} />;
      case 'fillet':
        return <RectangleHorizontal {...iconProps} />;
      case 'chamfer':
        return <Scissors {...iconProps} />;
      case 'hole':
        return <Circle {...iconProps} />;
      case 'shell':
        return <FileStack {...iconProps} />;
      case 'pattern':
        return <Box {...iconProps} />;
      default:
        return <Box {...iconProps} />;
    }
  };

  const hasChildren = feature.children && feature.children.length > 0;

  return (
    <div ref={setNodeRef} style={style} className="select-none">
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 hover:bg-slate-800 rounded cursor-pointer group',
          isSelected && 'bg-indigo-600/20 hover:bg-indigo-600/30'
        )}
        onClick={() => onSelect(feature.id)}
      >
        {/* Drag Handle */}
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-gray-500" />
        </div>

        {/* Expand/Collapse */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-slate-700 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}

        {/* Icon */}
        <div className="text-indigo-400">{getFeatureIcon(feature.type)}</div>

        {/* Name */}
        <span className="flex-1 text-sm truncate">{feature.name}</span>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility(feature.id);
            }}
          >
            {feature.visible ? (
              <Eye className="h-3 w-3" />
            ) : (
              <EyeOff className="h-3 w-3 text-gray-500" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(feature.id);
            }}
          >
            <Edit2 className="h-3 w-3" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-red-600/20"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(feature.id);
            }}
          >
            <Trash2 className="h-3 w-3 text-red-400" />
          </Button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="ml-6 mt-1 space-y-1">
          {/* This would recursively render children if we implement nested features */}
          {/* For now, flat list structure is used */}
        </div>
      )}
    </div>
  );
}

export function FeatureTree() {
  const { features, selectedFeatureId, selectFeature, toggleFeatureVisibility, deleteFeature, reorderFeatures } =
    useCADStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = features.findIndex((f) => f.id === active.id);
      const newIndex = features.findIndex((f) => f.id === over.id);

      const newFeatures = arrayMove(features, oldIndex, newIndex);
      reorderFeatures(newFeatures);
    }
  };

  const handleEdit = (id: string) => {
    // Select the feature and open properties panel
    selectFeature(id);
    // Properties panel will automatically show when a feature is selected
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-r border-gray-700">
      {/* Header */}
      <div className="h-12 border-b border-gray-700 flex items-center px-4">
        <h2 className="text-sm font-semibold">Feature Tree</h2>
      </div>

      {/* Tree */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={features.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              {features.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">
                  No features yet. Use the toolbar to add primitives or operations.
                </div>
              ) : (
                <div className="space-y-1">
                  {features.map((feature) => (
                    <FeatureTreeItem
                      key={feature.id}
                      feature={feature}
                      isSelected={selectedFeatureId === feature.id}
                      onSelect={selectFeature}
                      onToggleVisibility={toggleFeatureVisibility}
                      onEdit={handleEdit}
                      onDelete={deleteFeature}
                    />
                  ))}
                </div>
              )}
            </SortableContext>
          </DndContext>
        </div>
      </ScrollArea>

      {/* Footer Stats */}
      <div className="h-8 border-t border-gray-700 flex items-center px-4 text-xs text-gray-500">
        {features.length} feature{features.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
