'use client';

import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

const columns = ['Define', 'Prioritize', 'In Progress', 'Done'] as const;

type Item = { id: string; title: string; status: typeof columns[number] };

// Map database status values to kanban columns
function mapStatusToColumn(dbStatus: string): typeof columns[number] {
  switch (dbStatus?.toUpperCase()) {
    case 'DEFINE':
    case 'PLANNING':
    case 'DRAFT':
      return 'Define';
    case 'PRIORITIZE':
    case 'PENDING':
    case 'APPROVED':
      return 'Prioritize';
    case 'ACTIVE':
    case 'IN_PROGRESS':
    case 'EXECUTING':
    case 'RUNNING':
      return 'In Progress';
    case 'COMPLETED':
    case 'DONE':
    case 'FINISHED':
      return 'Done';
    default:
      // Default new/unknown statuses to Define
      return 'Define';
  }
}

// Map kanban column back to database status
function mapColumnToStatus(column: typeof columns[number]): string {
  switch (column) {
    case 'Define':
      return 'PLANNING';
    case 'Prioritize':
      return 'APPROVED';
    case 'In Progress':
      return 'ACTIVE';
    case 'Done':
      return 'COMPLETED';
    default:
      return 'PLANNING';
  }
}

export default function TrackPage() {
  const [items, setItems] = useState<Item[]>([]);

  async function load() {
    const res = await fetch('/api/initiatives');
    const data = await res.json();
    // Transform the data to match our kanban format
    const transformedItems = data.map((initiative: any) => ({
      id: initiative.id,
      title: initiative.title,
      status: mapStatusToColumn(initiative.status)
    }));
    setItems(transformedItems);
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
    
    // Update the database with the mapped status value
    const dbStatus = mapColumnToStatus(destCol);
    fetch('/api/track/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: moved.id, status: dbStatus })
    });
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h1 className="text-h1 mb-4">Execute & Track</h1>
        <p className="text-body max-w-2xl mx-auto">
          Monitor initiative progress through execution phases. Drag initiatives between columns to update their status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DragDropContext onDragEnd={onDragEnd}>
          {columns.map((col) => (
            <Droppable droppableId={col} key={col}>
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.droppableProps} 
                  className={`card-secondary p-4 min-h-[400px] transition-colors ${
                    snapshot.isDraggingOver ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="font-semibold text-h3 mb-4 text-center border-b border-gray-200 pb-2">
                    {col}
                    <span className="ml-2 text-sm text-gray-500 font-normal">
                      ({items.filter((i) => i.status === col).length})
                    </span>
                  </div>
                  <div className="space-y-3">
                    {items.filter((i) => i.status === col).map((item, idx) => (
                      <Draggable draggableId={item.id} index={idx} key={item.id}>
                        {(prov, dragSnapshot) => (
                          <div 
                            ref={prov.innerRef} 
                            {...prov.draggableProps} 
                            {...prov.dragHandleProps} 
                            className={`card-primary p-3 cursor-move transition-all duration-200 ${
                              dragSnapshot.isDragging ? 'shadow-lg scale-105 rotate-2' : 'hover:shadow-md'
                            }`}
                          >
                            <div className="text-sm font-medium text-gray-900 line-clamp-2">
                              {item.title}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </DragDropContext>
      </div>

      {items.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">No initiatives found</div>
          <p className="text-gray-400 mb-6">Create some initiatives in the Plan section to track them here.</p>
          <a 
            href="/initiatives" 
            className="btn-primary inline-flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Initiative
          </a>
        </div>
      )}
    </div>
  );
}
