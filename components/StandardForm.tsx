import React from 'react';

interface FormFieldProps {
  label: string;
  type?: 'text' | 'email' | 'textarea' | 'select';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  rows?: number;
}

interface StandardFormProps {
  title: string;
  onSubmit: (e: React.FormEvent) => void;
  children?: React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isSubmitting?: boolean;
  showCancel?: boolean;
}

export function FormField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  options = [],
  rows = 3,
}: FormFieldProps) {
  const baseId = label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div>
      <label htmlFor={baseId} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          id={baseId}
          className="textarea-field"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          rows={rows}
        />
      ) : type === 'select' ? (
        <select
          id={baseId}
          className="form-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        >
          <option value="">{placeholder || `Select ${label}`}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={baseId}
          type={type}
          className="input-field"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
        />
      )}
    </div>
  );
}

export default function StandardForm({
  title,
  onSubmit,
  children,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  onCancel,
  isSubmitting = false,
  showCancel = true,
}: StandardFormProps) {
  return (
    <div className="form-card max-w-2xl mx-auto">
      <h2 className="form-header">{title}</h2>

      <form onSubmit={onSubmit} className="form-group">
        {children}

        <div className={showCancel ? 'form-actions' : 'form-actions'}>
          {showCancel && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="submit"
            className={`btn-primary ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
