import React from 'react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { PollOption } from '../../types/index.js';
import { formatTime } from '../../utils/formatters.js';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface VoteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedOption: PollOption | null;
  previousOptionName?: string;
  isUpdate?: boolean;
  closingTime?: string | Date;
  isSubmitting?: boolean;
}

export const VoteConfirmationModal: React.FC<VoteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedOption,
  previousOptionName,
  isUpdate = false,
  closingTime,
  isSubmitting = false
}) => {
  if (!selectedOption) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isUpdate ? 'Confirm Vote Update' : 'Confirm Lunch Selection'}
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            isLoading={isSubmitting}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            {isUpdate ? 'Confirm Update' : 'Submit My Vote'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <img
            src={selectedOption.foodImageSnapshot}
            alt={selectedOption.foodNameSnapshot}
            className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200"
          />
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
              {isUpdate ? 'New Choice' : 'Selected Lunch'}
            </span>
            <h4 className="text-base font-extrabold text-slate-900 truncate">
              {selectedOption.foodNameSnapshot}
            </h4>
            {isUpdate && previousOptionName && (
              <p className="text-xs text-slate-500 mt-0.5">
                Replacing previous choice: <span className="line-through font-medium text-slate-400">{previousOptionName}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50 border border-blue-200/80 text-xs text-blue-900">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Your lunch choice is saved for today's catering order. You can modify your selection until{' '}
            <strong className="text-blue-950 font-bold">{formatTime(closingTime)}</strong>.
          </p>
        </div>
      </div>
    </Modal>
  );
};
