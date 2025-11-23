'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: ('25%' | '50%' | '75%' | '100%')[];
  defaultSnapPoint?: number;
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  snapPoints = ['50%', '75%'],
  defaultSnapPoint = 0,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [currentSnapIndex, setCurrentSnapIndex] = useState(defaultSnapPoint);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);

  useEffect(() => {
    if (open) {
      setCurrentSnapIndex(defaultSnapPoint);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open, defaultSnapPoint]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - startY;
    setCurrentY(Math.max(0, deltaY));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    // If dragged down more than 100px, close or snap to smaller size
    if (currentY > 100) {
      if (currentSnapIndex > 0) {
        setCurrentSnapIndex(currentSnapIndex - 1);
      } else {
        onClose();
      }
    }
    setCurrentY(0);
  };

  if (!open) return null;

  const heightMap: Record<string, string> = {
    '25%': 'h-1/4',
    '50%': 'h-1/2',
    '75%': 'h-3/4',
    '100%': 'h-full',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 bg-slate-900 rounded-t-2xl transition-all duration-300 ease-out',
          heightMap[snapPoints[currentSnapIndex]],
          isDragging && 'transition-none'
        )}
        style={{
          transform: isDragging ? `translateY(${currentY}px)` : 'translateY(0)',
        }}
      >
        {/* Drag Handle */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {children}
        </div>
      </div>
    </>
  );
}
