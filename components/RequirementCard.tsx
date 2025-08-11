import React, { useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import {
  ChatBubbleLeftIcon,
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

interface RequirementCardData {
  id: string;
  title: string;
  description: string;
  type: 'BUSINESS' | 'FUNCTIONAL' | 'ACCEPTANCE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'REJECTED';
  category?: string;
  assignedTo?: { id: string; name: string; email: string };
  createdBy: { id: string; name: string; email: string };
  approvedBy?: { id: string; name: string; email: string };
  approvedAt?: string;
  comments: any[];
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

interface RequirementCardProps {
  card: RequirementCardData;
  index: number;
  onEdit: (card: RequirementCardData) => void;
  onDelete: (cardId: string) => void;
  onStatusChange: (cardId: string, status: string) => void;
  onComment: (cardId: string) => void;
}

const PRIORITY_COLORS = {
  LOW: 'bg-blue-100 text-blue-800 border-blue-300',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
  CRITICAL: 'bg-red-100 text-red-800 border-red-300',
};

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-800 border-gray-300',
  REVIEW: 'bg-blue-100 text-blue-800 border-blue-300',
  APPROVED: 'bg-green-100 text-green-800 border-green-300',
  REJECTED: 'bg-red-100 text-red-800 border-red-300',
};

const TYPE_ICONS = {
  BUSINESS: '💼',
  FUNCTIONAL: '⚙️',
  ACCEPTANCE: '✅',
};

export default function RequirementCard({
  card,
  index,
  onEdit,
  onDelete,
  onStatusChange,
  onComment,
}: RequirementCardProps) {
  const [showActions, setShowActions] = useState(false);

  const handleStatusToggle = () => {
    const nextStatus = card.status === 'APPROVED' ? 'DRAFT' : 'APPROVED';
    onStatusChange(card.id, nextStatus);
  };

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ${
            snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
          }`}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
        >
          {/* Card Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{TYPE_ICONS[card.type]}</span>
                <h3 className="font-medium text-gray-900 text-sm leading-tight">{card.title}</h3>
              </div>
              {showActions && (
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(card)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit card"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleStatusToggle}
                    className={`p-1 transition-colors ${
                      card.status === 'APPROVED'
                        ? 'text-green-600 hover:text-gray-400'
                        : 'text-gray-400 hover:text-green-600'
                    }`}
                    title={card.status === 'APPROVED' ? 'Remove approval' : 'Approve'}
                  >
                    <CheckIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(card.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete card"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="flex items-center space-x-2 mt-2">
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full border ${
                  PRIORITY_COLORS[card.priority]
                }`}
              >
                {card.priority}
              </span>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full border ${
                  STATUS_COLORS[card.status]
                }`}
              >
                {card.status}
              </span>
              {card.category && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 border border-gray-300">
                  {card.category}
                </span>
              )}
            </div>
          </div>

          {/* Card Content */}
          <div className="p-4">
            <p className="text-sm text-gray-600 leading-relaxed">{card.description}</p>

            {/* Assignment & Comments */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                {card.assignedTo ? (
                  <div className="flex items-center space-x-1">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-600">{card.assignedTo.name}</span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">Unassigned</span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {card.comments.length > 0 && (
                  <button
                    onClick={() => onComment(card.id)}
                    className="flex items-center space-x-1 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <ChatBubbleLeftIcon className="w-4 h-4" />
                    <span className="text-xs">{card.comments.length}</span>
                  </button>
                )}
                {card.status === 'APPROVED' && card.approvedBy && (
                  <div className="flex items-center space-x-1">
                    <CheckIcon className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-600">{card.approvedBy.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
