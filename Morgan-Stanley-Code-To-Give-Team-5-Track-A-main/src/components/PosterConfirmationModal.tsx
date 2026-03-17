"use client";

import { Modal } from "./Modal";

type PosterConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  eventTitle: string;
};

export function PosterConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  eventTitle,
}: PosterConfirmationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Flyer Posted"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Award Flyer Points
          </button>
        </div>
      }
    >
      <div className="space-y-3 text-sm leading-6 text-slate-600">
        <p>
          Count a poster only after the flyer for <span className="font-semibold text-slate-900">{eventTitle}</span> has been physically posted.
        </p>
        <p>
          Confirming this adds flyer-posting points to your leaderboard total without using the browser confirm dialog.
        </p>
      </div>
    </Modal>
  );
}
