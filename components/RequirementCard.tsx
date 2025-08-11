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
  onView: (card: RequirementCardData) => void;
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
  onView,
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
          onClick={() => onView(card)}
          className={`group bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
            snapshot.isDragging ? 'rotate-1 shadow-xl ring-2 ring-blue-200 scale-105' : ''
          }`}
        >
          {/* Card Header with Type Badge */}
          <div className="p-4 pb-3">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start space-x-3 flex-1">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                    card.type === 'BUSINESS'
                      ? 'bg-blue-100 text-blue-700'
                      : card.type === 'FUNCTIONAL'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-green-100 text-green-700'
                  }`}
                >
                  {TYPE_ICONS[card.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-1">
                    {card.title}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-md ${
                        PRIORITY_COLORS[card.priority]
                      }`}
                    >
                      {card.priority}
                    </span>
                    {card.category && (
                      <span className="px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-600">
                        {card.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Always Visible Actions */}
              <div className="flex items-center space-x-1 ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(card);
                  }}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="Edit card"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusToggle();
                  }}
                  className={`p-1.5 rounded-md transition-colors ${
                    card.status === 'APPROVED'
                      ? 'text-green-600 hover:text-gray-400 hover:bg-gray-50'
                      : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                  }`}
                  title={card.status === 'APPROVED' ? 'Remove approval' : 'Approve'}
                >
                  <CheckIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(card.id);
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete card"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{card.description}</p>
          </div>

          {/* Card Footer */}
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                {card.assignedTo ? (
                  <div className="flex items-center space-x-1.5">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserIcon className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="text-gray-700 font-medium">{card.assignedTo.name}</span>
                  </div>
                ) : (
                  <span className="text-gray-400">Unassigned</span>
                )}
              </div>

              <div className="flex items-center space-x-3">
                {card.comments.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onComment(card.id);
                    }}
                    className="flex items-center space-x-1 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <ChatBubbleLeftIcon className="w-4 h-4" />
                    <span className="font-medium">{card.comments.length}</span>
                  </button>
                )}
                {card.status === 'APPROVED' && card.approvedBy && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckIcon className="w-4 h-4" />
                    <span className="font-medium">{card.approvedBy.name}</span>
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
