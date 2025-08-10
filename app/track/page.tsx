'use client';

import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

const columns = ['Define', 'Prioritize', 'In Progress', 'Done'] as const;

type Item = { id: string; title: string; status: typeof columns[number] };

export default function TrackPage() {
  const [items, setItems] = useState<Item[]>([]);

  async function load() {
    const res = await fetch('/api/initiatives');
    const data = await res.json();
    setItems(data);
  }
  useEffect(() => { load(); }, []);

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const destCol = result.destination.droppableId as Item['status'];
    const newItems = items.map((i) => ({ ...i }));
    const [moved] = newItems.splice(newItems.findIndex((i) => i.id === result.draggableId), 1);
    moved.status = destCol;
    newItems.splice(result.destination.index, 0, moved);
    setItems(newItems);
    fetch('/api/track/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: moved.id, status: destCol })
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <DragDropContext onDragEnd={onDragEnd}>
        {columns.map((col) => (
          <Droppable droppableId={col} key={col}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="bg-gray-100 rounded p-2 min-h-[300px]">
                <div className="font-semibold mb-2">{col}</div>
                {items.filter((i) => i.status === col).map((item, idx) => (
                  <Draggable draggableId={item.id} index={idx} key={item.id}>
                    {(prov) => (
                      <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps} className="bg-white rounded border p-2 mb-2">
                        {item.title}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </DragDropContext>
    </div>
  );
}
