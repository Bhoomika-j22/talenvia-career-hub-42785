import React, { useEffect } from "react";
import { Button } from "./Button";

/**
 * Accessible modal: Escape closes, overlay click closes, focus is not trapped (lightweight).
 */

// PUBLIC_INTERFACE
export function Modal({ open, title, children, onClose, footer }) {
  /** Modal for actions/details. */
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="tv-modalOverlay"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Dialog"}
      onMouseDown={(e) => {
        // Close only when clicking on overlay (not on modal content)
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="tv-modal">
        <div className="tv-modal__header">
          <div>
            <p className="tv-modal__title">{title || "Modal"}</p>
          </div>
          <Button variant="ghost" onClick={onClose} aria-label="Close dialog">
            Close
          </Button>
        </div>
        <div className="tv-modal__body">{children}</div>
        {footer ? <div className="tv-modal__footer">{footer}</div> : null}
      </div>
    </div>
  );
}
