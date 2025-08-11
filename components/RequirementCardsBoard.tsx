import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { PlusIcon, SparklesIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import RequirementCard from './RequirementCard';
import RequirementCardModal from './RequirementCardModal';
import RequirementCardViewModal from './RequirementCardViewModal';

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
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<RequirementCardData | null>(null);
  const [viewingCard, setViewingCard] = useState<RequirementCardData | null>(null);
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

  const handleCardView = (card: RequirementCardData) => {
    setViewingCard(card);
    setViewModalOpen(true);
  };

  const handleCardEdit = (card: RequirementCardData) => {
    setEditingCard(card);
    setModalOpen(true);
    // Close view modal if it's open
    setViewModalOpen(false);
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

        // Update viewing card if it's the same card being edited
        if (viewingCard && viewingCard.id === updatedCard.id) {
          setViewingCard(updatedCard);
        }

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

        // Update viewing card if it's the same card being updated
        if (viewingCard && viewingCard.id === updatedCard.id) {
          setViewingCard(updatedCard);
        }
      } else {
        setError('Failed to update card status');
      }
    } catch (error) {
      setError('Failed to update card status');
    }
  };

  const exportToCSV = () => {
    if (filteredCards.length === 0) {
      setError('No cards to export');
      return;
    }

    const csvHeaders = [
      'REQ_ID',
      'Title',
      'Description',
      'Type',
      'Priority',
      'Status',
      'Category',
      'Assigned_To',
      'Created_By',
      'Approved_By',
      'Created_Date',
      'Updated_Date',
      'Comments_Count',
    ];

    const csvData = filteredCards.map((card) => [
      card.id,
      `"${card.title.replace(/"/g, '""')}"`,
      `"${card.description.replace(/"/g, '""')}"`,
      card.type,
      card.priority,
      card.status,
      card.category || '',
      card.assignedTo?.name || 'Unassigned',
      card.createdBy.name,
      card.approvedBy?.name || '',
      new Date(card.createdAt).toLocaleDateString(),
      new Date(card.updatedAt).toLocaleDateString(),
      card.comments.length,
    ]);

    const csvContent = [csvHeaders.join(','), ...csvData.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `requirements_cards_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Requirements Cards</h3>
            <p className="text-gray-600 max-w-2xl">
              Create clear, actionable requirement cards that guide your execution team through
              implementation. Collaborate, approve, and track progress from concept to completion.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[140px]"
            >
              <option value="ALL">All Cards</option>
              <option value="DRAFT">Draft</option>
              <option value="REVIEW">Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <button
              onClick={exportToCSV}
              disabled={filteredCards.length === 0}
              className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-2 text-sm font-semibold transition-colors"
              title="Export cards to CSV for PM tools"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onGenerateWithAI}
              disabled={aiLoading}
              className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center space-x-2 text-sm font-semibold transition-colors"
            >
              <SparklesIcon className="w-4 h-4" />
              <span>{aiLoading ? 'Generating...' : 'AI Generate'}</span>
            </button>

            <button
              onClick={() => {
                setEditingCard(null);
                setModalOpen(true);
              }}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 text-sm font-semibold transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Add Card</span>
            </button>
          </div>
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
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <div className="text-5xl mb-6">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No requirement cards yet</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Create clear, actionable requirement cards that guide your execution team through
            implementation
          </p>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={onGenerateWithAI}
              disabled={aiLoading}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
            >
              Generate with AI
            </button>
            <button
              onClick={() => {
                setEditingCard(null);
                setModalOpen(true);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Create Manually
            </button>
          </div>
        </div>
      ) : filterStatus === 'ALL' ? (
        // Improved 3-Column Kanban Board View
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 min-h-[600px]">
            {['DRAFT', 'REVIEW', 'APPROVED'].map((status, index) => (
              <div
                key={status}
                className={`${index !== 2 ? 'border-r border-gray-200' : ''} flex flex-col`}
              >
                {/* Column Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          status === 'DRAFT'
                            ? 'bg-yellow-400'
                            : status === 'REVIEW'
                              ? 'bg-blue-400'
                              : 'bg-green-400'
                        }`}
                      ></div>
                      <h4 className="font-semibold text-gray-900">{status}</h4>
                    </div>
                    <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full border">
                      {cardsByStatus[status as keyof typeof cardsByStatus].length}
                    </span>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="flex-1 p-4">
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId={status}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`space-y-4 min-h-[400px] rounded-lg transition-colors ${
                            snapshot.isDraggingOver
                              ? 'bg-blue-50 border-2 border-dashed border-blue-300'
                              : ''
                          }`}
                        >
                          {cardsByStatus[status as keyof typeof cardsByStatus].map(
                            (card, cardIndex) => (
                              <RequirementCard
                                key={card.id}
                                card={card}
                                index={cardIndex}
                                onView={handleCardView}
                                onEdit={handleCardEdit}
                                onDelete={handleCardDelete}
                                onStatusChange={handleStatusChange}
                                onComment={() => {}} // TODO: Implement comment modal
                              />
                            )
                          )}
                          {provided.placeholder}

                          {/* Empty State for Column */}
                          {cardsByStatus[status as keyof typeof cardsByStatus].length === 0 &&
                            !snapshot.isDraggingOver && (
                              <div className="text-center py-8 text-gray-400">
                                <div className="text-2xl mb-2">
                                  {status === 'DRAFT' ? '✏️' : status === 'REVIEW' ? '👀' : '✅'}
                                </div>
                                <p className="text-sm">
                                  {status === 'DRAFT'
                                    ? 'Draft cards appear here'
                                    : status === 'REVIEW'
                                      ? 'Cards under review'
                                      : 'Approved cards'}
                                </p>
                              </div>
                            )}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>
              </div>
            ))}
          </div>
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
                    onView={handleCardView}
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

      {/* Edit Modal */}
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

      {/* View Modal */}
      {viewModalOpen && viewingCard && (
        <RequirementCardViewModal
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setViewingCard(null);
          }}
          onEdit={handleCardEdit}
          onStatusChange={handleStatusChange}
          onComment={() => {}} // TODO: Implement comment modal
          card={viewingCard}
        />
      )}
    </div>
  );
}
