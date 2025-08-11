import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface RequirementCardData {
  id: string;
  title: string;
  description: string;
  type: 'BUSINESS' | 'FUNCTIONAL' | 'ACCEPTANCE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'REJECTED';
  category?: string;
  assignedTo?: { id: string; name: string; email: string };
}

interface RequirementCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardData: any) => void;
  card?: RequirementCardData | null;
  initiativeId: string;
}

export default function RequirementCardModal({
  isOpen,
  onClose,
  onSave,
  card,
  initiativeId,
}: RequirementCardModalProps) {
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    type: 'BUSINESS' | 'FUNCTIONAL' | 'ACCEPTANCE';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    category: string;
    assignedToId: string;
  }>({
    title: '',
    description: '',
    type: 'BUSINESS',
    priority: 'MEDIUM',
    category: '',
    assignedToId: '',
  });

  const [users, setUsers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (card) {
      setFormData({
        title: card.title || '',
        description: card.description || '',
        type: card.type || 'BUSINESS',
        priority: card.priority || 'MEDIUM',
        category: card.category || '',
        assignedToId: card.assignedTo?.id || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        type: 'BUSINESS',
        priority: 'MEDIUM',
        category: '',
        assignedToId: '',
      });
    }
  }, [card]);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const saveData = {
        ...formData,
        assignedToId: formData.assignedToId || null,
        category: formData.category || null,
      };
      await onSave(saveData);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-6 border-b">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              {card ? 'Edit Requirement Card' : 'Create Requirement Card'}
            </Dialog.Title>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief, clear requirement title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Detailed description of the requirement"
                required
              />
            </div>

            {/* Type, Priority, Category */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="BUSINESS">💼 Business</option>
                  <option value="FUNCTIONAL">⚙️ Functional</option>
                  <option value="ACCEPTANCE">✅ Acceptance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional grouping"
                />
              </div>
            </div>

            {/* Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assign To</label>
              <select
                value={formData.assignedToId}
                onChange={(e) => handleChange('assignedToId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !formData.title.trim() || !formData.description.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : card ? 'Update Card' : 'Create Card'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
