import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function FormModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: FormModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div
        className={`bg-white rounded-xl shadow-card-elevated w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto animate-scale-in border border-white/20`}
        style={{
          backdropFilter: 'blur(10px)',
          background: 'rgba(255, 255, 255, 0.95)',
        }}
      >
        {/* Modern Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-h2 text-gray-900 font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modern Modal Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
