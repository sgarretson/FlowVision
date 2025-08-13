import React, { useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import {
  ChatBubbleLeftIcon,
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  UserIcon,
  BriefcaseIcon,
  CogIcon,
  CheckCircleIcon,
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

const TYPE_INDICATORS = {
  BUSINESS: {
    icon: BriefcaseIcon,
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-700',
    label: 'Business',
  },
  FUNCTIONAL: {
    icon: CogIcon,
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-700',
    label: 'Functional',
  },
  ACCEPTANCE: {
    icon: CheckCircleIcon,
    bgColor: 'bg-green-100',
    iconColor: 'text-green-700',
    label: 'Acceptance',
  },
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

  const indicator = TYPE_INDICATORS[card.type];

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onView(card)}
          className={`group card-interactive ${
            snapshot.isDragging
              ? 'rotate-1 shadow-card-elevated-hover ring-2 ring-primary scale-105'
              : ''
          }`}
        >
          {/* Card Header with Modern Type Indicator */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4 flex-1">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${indicator.bgColor} transition-colors duration-200`}
                >
                  <indicator.icon className={`w-5 h-5 ${indicator.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {indicator.label}
                    </span>
                    <span className={`status-badge-modern ${PRIORITY_COLORS[card.priority]}`}>
                      {card.priority}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-base leading-snug line-clamp-2 mb-3">
                    {card.title}
                  </h3>
                  {card.category && (
                    <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                      {card.category}
                    </span>
                  )}
                </div>
              </div>

              {/* Modern Action Buttons */}
              <div className="flex items-center space-x-1 ml-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(card);
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-105"
                  title="Edit requirement"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusToggle();
                  }}
                  className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                    card.status === 'APPROVED'
                      ? 'text-green-600 hover:text-gray-400 hover:bg-gray-50'
                      : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                  }`}
                  title={card.status === 'APPROVED' ? 'Remove approval' : 'Approve requirement'}
                >
                  <CheckIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(card.id);
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-105"
                  title="Delete requirement"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-4">
              {card.description}
            </p>

            {/* Modern Card Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-3">
                {card.assignedTo ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-700 font-medium">
                      {card.assignedTo.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Unassigned</span>
                )}
              </div>

              <div className="flex items-center space-x-3">
                {card.comments.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onComment(card.id);
                    }}
                    className="flex items-center space-x-1.5 text-gray-400 hover:text-blue-600 transition-colors duration-200 p-1 rounded-md hover:bg-blue-50"
                  >
                    <ChatBubbleLeftIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">{card.comments.length}</span>
                  </button>
                )}
                {card.status === 'APPROVED' && card.approvedBy && (
                  <div className="flex items-center space-x-1.5 text-green-600 bg-green-50 px-2 py-1 rounded-md">
                    <CheckIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">{card.approvedBy.name}</span>
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
