import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { PlusIcon, SparklesIcon } from '@heroicons/react/24/outline';
import RequirementCard from './RequirementCard';
import RequirementCardModal from './RequirementCardModal';

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

interface RequirementCardsBoardProps {
  initiativeId: string;
  onGenerateWithAI: () => void;
  aiLoading: boolean;
}

export default function RequirementCardsBoard({
  initiativeId,
  onGenerateWithAI,
  aiLoading,
}: RequirementCardsBoardProps) {
  const [cards, setCards] = useState<RequirementCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<RequirementCardData | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    loadCards();
  }, [initiativeId]);

  const loadCards = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/initiatives/${initiativeId}/requirement-cards`);
      if (response.ok) {
        const data = await response.json();
        setCards(data);
      } else {
        setError('Failed to load requirement cards');
      }
    } catch (error) {
      setError('Failed to load requirement cards');
    } finally {
      setLoading(false);
    }
  };

  const handleCardCreate = async (cardData: any) => {
    try {
      const response = await fetch(`/api/initiatives/${initiativeId}/requirement-cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData),
      });

      if (response.ok) {
        const newCard = await response.json();
        setCards([...cards, newCard]);
        setModalOpen(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create card');
      }
    } catch (error) {
      setError('Failed to create card');
    }
  };

  const handleCardEdit = (card: RequirementCardData) => {
    setEditingCard(card);
    setModalOpen(true);
  };

  const handleCardUpdate = async (cardData: any) => {
    if (!editingCard) return;

    try {
      const response = await fetch(`/api/requirement-cards/${editingCard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData),
      });

      if (response.ok) {
        const updatedCard = await response.json();
        setCards(cards.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
        setModalOpen(false);
        setEditingCard(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update card');
      }
    } catch (error) {
      setError('Failed to update card');
    }
  };

  const handleCardDelete = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this requirement card?')) return;

    try {
      const response = await fetch(`/api/requirement-cards/${cardId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCards(cards.filter((c) => c.id !== cardId));
      } else {
        setError('Failed to delete card');
      }
    } catch (error) {
      setError('Failed to delete card');
    }
  };

  const handleStatusChange = async (cardId: string, status: string) => {
    try {
      const response = await fetch(`/api/requirement-cards/${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const updatedCard = await response.json();
        setCards(cards.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
      } else {
        setError('Failed to update card status');
      }
    } catch (error) {
      setError('Failed to update card status');
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const reorderedCards = Array.from(cards);
    const [movedCard] = reorderedCards.splice(sourceIndex, 1);
    reorderedCards.splice(destinationIndex, 0, movedCard);

    // Update order indices
    const updatedCards = reorderedCards.map((card, index) => ({
      ...card,
      orderIndex: index,
    }));

    setCards(updatedCards);

    // Update server
    try {
      await fetch(`/api/requirement-cards/${movedCard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIndex: destinationIndex }),
      });
    } catch (error) {
      console.error('Failed to update card order:', error);
      // Revert on error
      loadCards();
    }
  };

  const filteredCards = cards.filter((card) => {
    if (filterStatus === 'ALL') return true;
    return card.status === filterStatus;
  });

  const cardsByStatus = {
    DRAFT: filteredCards.filter((c) => c.status === 'DRAFT'),
    REVIEW: filteredCards.filter((c) => c.status === 'REVIEW'),
    APPROVED: filteredCards.filter((c) => c.status === 'APPROVED'),
    REJECTED: filteredCards.filter((c) => c.status === 'REJECTED'),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-gray-600">Loading requirement cards...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Requirements Cards</h3>
          <p className="text-sm text-gray-600">
            Collaborate on requirements that guide your execution team
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">All Cards</option>
            <option value="DRAFT">Draft</option>
            <option value="REVIEW">Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <button
            onClick={onGenerateWithAI}
            disabled={aiLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2 text-sm"
          >
            <SparklesIcon className="w-4 h-4" />
            <span>{aiLoading ? 'Generating...' : 'AI Generate'}</span>
          </button>
          <button
            onClick={() => {
              setEditingCard(null);
              setModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 text-sm"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add Card</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Cards Board */}
      {filteredCards.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No requirement cards yet</h3>
          <p className="text-gray-600 mb-4">
            Create cards manually or generate them with AI to get started
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={onGenerateWithAI}
              disabled={aiLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              Generate with AI
            </button>
            <button
              onClick={() => {
                setEditingCard(null);
                setModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Manually
            </button>
          </div>
        </div>
      ) : filterStatus === 'ALL' ? (
        // Kanban Board View
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {['DRAFT', 'REVIEW', 'APPROVED', 'REJECTED'].map((status) => (
            <div key={status} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">{status}</h4>
                <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full">
                  {cardsByStatus[status as keyof typeof cardsByStatus].length}
                </span>
              </div>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId={status}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-3 min-h-[200px]"
                    >
                      {cardsByStatus[status as keyof typeof cardsByStatus].map((card, index) => (
                        <RequirementCard
                          key={card.id}
                          card={card}
                          index={index}
                          onEdit={handleCardEdit}
                          onDelete={handleCardDelete}
                          onStatusChange={handleStatusChange}
                          onComment={() => {}} // TODO: Implement comment modal
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          ))}
        </div>
      ) : (
        // List View
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="cards-list">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {filteredCards.map((card, index) => (
                  <RequirementCard
                    key={card.id}
                    card={card}
                    index={index}
                    onEdit={handleCardEdit}
                    onDelete={handleCardDelete}
                    onStatusChange={handleStatusChange}
                    onComment={() => {}} // TODO: Implement comment modal
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Modal */}
      {modalOpen && (
        <RequirementCardModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingCard(null);
          }}
          onSave={editingCard ? handleCardUpdate : handleCardCreate}
          card={editingCard}
          initiativeId={initiativeId}
        />
      )}
    </div>
  );
}
