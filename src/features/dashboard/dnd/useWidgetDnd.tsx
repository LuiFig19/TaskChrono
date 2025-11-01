'use client';

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import * as React from 'react';

export type UseWidgetDndResult = {
  Dnd: React.FC<{ children: React.ReactNode }>;
  SortableContainer: React.FC<{ children: React.ReactNode }>;
  activeId: string | null;
};

export function useWidgetDnd(
  itemIds: string[],
  swapSlots: (a: string, b: string) => void,
  onReorder?: (next: string[]) => void,
): UseWidgetDndResult {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  // Use only keyboard sensor; mouse/touch dragging is handled by react-grid-layout for performance
  const sensors = useSensors(
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = React.useCallback(
    (e: DragEndEvent) => {
      setActiveId(null);
      const a = e.active?.id?.toString();
      const b = e.over?.id?.toString();
      if (!a || !b || a === b) return;
      swapSlots(a, b);
      if (onReorder) {
        const from = itemIds.indexOf(a);
        const to = itemIds.indexOf(b);
        if (from !== -1 && to !== -1) onReorder(arrayMove(itemIds, from, to));
      }
    },
    [itemIds, onReorder, swapSlots],
  );

  const Dnd: UseWidgetDndResult['Dnd'] = React.useCallback(
    ({ children }) => (
      <DndContext
        sensors={sensors}
        onDragStart={(e) => setActiveId(e.active?.id?.toString() || null)}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToParentElement]}
      >
        {children}
        <DragOverlay dropAnimation={null}>{/* visual handled by RGL */}</DragOverlay>
      </DndContext>
    ),
    [handleDragEnd, sensors],
  );

  const SortableContainer: UseWidgetDndResult['SortableContainer'] = React.useCallback(
    ({ children }) => <SortableContext items={itemIds}>{children}</SortableContext>,
    [itemIds],
  );

  return { Dnd, SortableContainer, activeId };
}
