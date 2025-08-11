import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import {
  XMarkIcon,
  PencilIcon,
  CheckIcon,
  ChatBubbleLeftIcon,
  UserIcon,
  CalendarIcon,
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

interface RequirementCardViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (card: RequirementCardData) => void;
  onStatusChange: (cardId: string, status: string) => void;
  onComment: (cardId: string) => void;
  card: RequirementCardData;
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

const TYPE_LABELS = {
  BUSINESS: 'Business Requirement',
  FUNCTIONAL: 'Functional Requirement',
  ACCEPTANCE: 'Acceptance Criteria',
};

export default function RequirementCardViewModal({
  isOpen,
  onClose,
  onEdit,
  onStatusChange,
  onComment,
  card,
}: RequirementCardViewModalProps) {
  const [commentsExpanded, setCommentsExpanded] = useState(false);

  const handleStatusToggle = () => {
    const nextStatus = card.status === 'APPROVED' ? 'DRAFT' : 'APPROVED';
    onStatusChange(card.id, nextStatus);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black bg-opacity-50" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                  card.type === 'BUSINESS'
                    ? 'bg-blue-100 text-blue-700'
                    : card.type === 'FUNCTIONAL'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-green-100 text-green-700'
                }`}
              >
                {TYPE_ICONS[card.type]}
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold text-gray-900">
                  {card.title}
                </Dialog.Title>
                <p className="text-sm text-gray-500">{TYPE_LABELS[card.type]}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => onEdit(card)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit requirement card"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Priority and Status Badges */}
            <div className="flex items-center space-x-3">
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full border ${
                  PRIORITY_COLORS[card.priority]
                }`}
              >
                {card.priority} Priority
              </span>
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full border ${
                  STATUS_COLORS[card.status]
                }`}
              >
                {card.status}
              </span>
              {card.category && (
                <span className="px-3 py-1 text-sm font-medium rounded-full border bg-gray-100 text-gray-700 border-gray-300">
                  {card.category}
                </span>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {card.description}
              </p>
            </div>

            {/* Assignment & Approval Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Assignment</h4>
                {card.assignedTo ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{card.assignedTo.name}</p>
                      <p className="text-xs text-gray-500">{card.assignedTo.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Unassigned</p>
                )}
              </div>

              {card.status === 'APPROVED' && card.approvedBy && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Approved By</h4>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{card.approvedBy.name}</p>
                      {card.approvedAt && (
                        <p className="text-xs text-gray-500">{formatDate(card.approvedAt)}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Created</h4>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{formatDate(card.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">by {card.createdBy.name}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Last Updated</h4>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{formatDate(card.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            {card.comments.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={() => setCommentsExpanded(!commentsExpanded)}
                  className="flex items-center space-x-2 text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                >
                  <ChatBubbleLeftIcon className="w-4 h-4" />
                  <span>
                    {card.comments.length} Comment{card.comments.length !== 1 ? 's' : ''}
                  </span>
                </button>

                {commentsExpanded && (
                  <div className="mt-3 space-y-3">
                    {card.comments.slice(0, 3).map((comment: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700">{comment.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {comment.author?.name} • {formatDate(comment.createdAt)}
                        </p>
                      </div>
                    ))}
                    {card.comments.length > 3 && (
                      <button
                        onClick={() => onComment(card.id)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View all {card.comments.length} comments
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleStatusToggle}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    card.status === 'APPROVED'
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {card.status === 'APPROVED' ? 'Remove Approval' : 'Approve'}
                </button>

                <button
                  onClick={() => onComment(card.id)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Add Comment
                </button>
              </div>

              <button
                onClick={() => onEdit(card)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Card
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
