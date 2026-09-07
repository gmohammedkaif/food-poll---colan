import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal.js';
import { Button } from './Button.js';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  dangerNote?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  title,
  description,
  confirmLabel = 'Delete',
  dangerNote,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-rose-600" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-slate-900 font-display">{title}</h3>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">{description}</p>
        </div>
        {dangerNote && (
          <div className="w-full p-3 rounded-xl bg-amber-50 border border-amber-200 text-left">
            <p className="text-xs text-amber-800 leading-relaxed">{dangerNote}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
