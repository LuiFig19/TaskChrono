'use client';

import { useSortable } from '@dnd-kit/sortable';
import * as React from 'react';

type Props = React.HTMLAttributes<HTMLDivElement> & {
  id: string;
  children?: React.ReactNode | ((bind: { handleProps: any }) => React.ReactNode);
};

export const DndHandleContext = React.createContext<{ handleProps: any } | null>(null);
export function useDndHandle(): { handleProps: any } {
  return (React.useContext(DndHandleContext) as any) || { handleProps: {} };
}

export default function SortableItem({ id, children, ...rest }: Props) {
  const { attributes, listeners, setNodeRef } = useSortable({ id });
  const handleProps = { ...attributes, ...listeners } as any;
  // Important: forward style/className and other props from RGL to this DOM node
  // Do NOT attach drag listeners to wrapper; use provided context to attach to specific handle
  const content = typeof children === 'function' ? (children as any)({ handleProps }) : children;
  return (
    <DndHandleContext.Provider value={{ handleProps }}>
      <div ref={setNodeRef} {...rest}>
        {content}
      </div>
    </DndHandleContext.Provider>
  );
}
