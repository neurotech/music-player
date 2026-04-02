import {
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useEffect,
  useRef,
} from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Classes on the fixed full-screen overlay (flex container). */
  overlayClassName?: string;
  /** If true, clicking the backdrop calls onClose. */
  closeOnBackdropClick?: boolean;
  id?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  onKeyDown?: (e: ReactKeyboardEvent<HTMLDivElement>) => void;
}

export function Modal({
  isOpen,
  onClose,
  children,
  overlayClassName = "fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/60",
  closeOnBackdropClick = true,
  id,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  onKeyDown,
}: ModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleEscape(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => {
      containerRef.current?.focus({ preventScroll: true });
    });
    return () => {
      cancelAnimationFrame(raf);
      previousFocusRef.current?.focus?.({ preventScroll: true });
      previousFocusRef.current = null;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  function handleBackdropClick(e: ReactMouseEvent<HTMLDivElement>) {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      ref={containerRef}
      id={id}
      tabIndex={-1}
      className={`${overlayClassName} outline-none`}
      onClick={handleBackdropClick}
      onKeyDown={onKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
    >
      {children}
    </div>
  );
}
