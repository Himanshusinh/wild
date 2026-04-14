"use client";

type Variant = "error" | "info";

type Props = {
  open: boolean;
  title: string;
  body: string;
  variant?: Variant;
  /** Runs before onClose when the user clicks the primary button. */
  onContinue?: () => void;
  onClose: () => void;
  primaryLabel?: string;
};

export default function BillingMessageDialog({
  open,
  title,
  body,
  variant = "error",
  onContinue,
  onClose,
  primaryLabel,
}: Props) {
  if (!open) return null;

  const isError = variant === "error";
  const label =
    primaryLabel ?? (onContinue ? "Continue" : "OK");

  const handlePrimary = () => {
    onContinue?.();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="billing-msg-title"
    >
      <div className="max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
        <h3
          id="billing-msg-title"
          className={`mb-2 text-lg font-semibold ${
            isError
              ? "text-red-800 dark:text-red-200"
              : "text-gray-900 dark:text-white"
          }`}
        >
          {title}
        </h3>
        <div className="mb-6 max-h-[min(50vh,320px)] overflow-y-auto text-sm leading-relaxed text-gray-600 whitespace-pre-line dark:text-gray-300">
          {body}
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            onClick={handlePrimary}
          >
            {label}
          </button>
        </div>
      </div>
    </div>
  );
}
