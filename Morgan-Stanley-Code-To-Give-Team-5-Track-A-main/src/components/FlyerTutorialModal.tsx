"use client";

import Image from "next/image";
import { Modal } from "./Modal";

type FlyerTutorialModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  isDownloading: boolean;
  eventTitle: string;
};

export function FlyerTutorialModal({
  isOpen,
  onClose,
  onContinue,
  isDownloading,
  eventTitle,
}: FlyerTutorialModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Flyer Posting Instructions"
      size="lg"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onContinue}
            disabled={isDownloading}
            className="rounded-full bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDownloading ? "Downloading..." : "Continue to Download Flyer"}
          </button>
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-500">
            Before you post
          </p>
          <h3 className="mt-2 text-2xl font-black leading-tight text-slate-900">
            Use the printed flyer for {eventTitle}
          </h3>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <p>1. Download and print the flyer at full size so the QR code stays sharp.</p>
            <p>2. Post only in approved community spaces like bulletin boards or partner sites.</p>
            <p>3. Keep the flyer flat, visible, and away from wet or damaged surfaces.</p>
            <p>4. After posting, tap Poster Added to log your outreach points on the leaderboard.</p>
          </div>
          <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
            View Instructions is also available anytime from the event card if you need to reopen this tutorial later.
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-inner">
          <Image
            src="/modal-assets/Flyer Tutorial.png"
            alt="Flyer posting tutorial example"
            width={1200}
            height={1600}
            className="h-full max-h-[60vh] w-full object-contain"
          />
        </div>
      </div>
    </Modal>
  );
}
