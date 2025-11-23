/**
 * Primitive Parameter Dialogs
 *
 * Dialogs for inputting parameters before creating CAD primitives
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BoxDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (width: number, height: number, depth: number) => void;
}

export function BoxDialog({ open, onOpenChange, onConfirm }: BoxDialogProps) {
  const [width, setWidth] = useState('50');
  const [height, setHeight] = useState('50');
  const [depth, setDepth] = useState('50');

  const handleConfirm = () => {
    const w = parseFloat(width) || 50;
    const h = parseFloat(height) || 50;
    const d = parseFloat(depth) || 50;
    onConfirm(w, h, d);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Box</DialogTitle>
          <DialogDescription>
            Enter the dimensions for the box in millimeters
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="width" className="text-right">
              Width
            </Label>
            <Input
              id="width"
              type="number"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              className="col-span-3"
              placeholder="50"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="height" className="text-right">
              Height
            </Label>
            <Input
              id="height"
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="col-span-3"
              placeholder="50"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="depth" className="text-right">
              Depth
            </Label>
            <Input
              id="depth"
              type="number"
              value={depth}
              onChange={(e) => setDepth(e.target.value)}
              className="col-span-3"
              placeholder="50"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CylinderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (radius: number, height: number) => void;
}

export function CylinderDialog({ open, onOpenChange, onConfirm }: CylinderDialogProps) {
  const [radius, setRadius] = useState('25');
  const [height, setHeight] = useState('50');

  const handleConfirm = () => {
    const r = parseFloat(radius) || 25;
    const h = parseFloat(height) || 50;
    onConfirm(r, h);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Cylinder</DialogTitle>
          <DialogDescription>
            Enter the dimensions for the cylinder in millimeters
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="radius" className="text-right">
              Radius
            </Label>
            <Input
              id="radius"
              type="number"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="col-span-3"
              placeholder="25"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cyl-height" className="text-right">
              Height
            </Label>
            <Input
              id="cyl-height"
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="col-span-3"
              placeholder="50"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SphereDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (radius: number) => void;
}

export function SphereDialog({ open, onOpenChange, onConfirm }: SphereDialogProps) {
  const [radius, setRadius] = useState('25');

  const handleConfirm = () => {
    const r = parseFloat(radius) || 25;
    onConfirm(r);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Sphere</DialogTitle>
          <DialogDescription>
            Enter the radius for the sphere in millimeters
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sphere-radius" className="text-right">
              Radius
            </Label>
            <Input
              id="sphere-radius"
              type="number"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="col-span-3"
              placeholder="25"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
