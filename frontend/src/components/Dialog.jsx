import React from 'react';

export default function Dialog({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  closeOnOverlayClick = true,
  maxWidthClass = 'max-w-sm',
}) {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onMouseDown={handleOverlayClick}
      role="presentation"
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl ${maxWidthClass} w-full p-6 animate-in fade-in zoom-in duration-300`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'dialog-title' : undefined}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {(icon || title) && (
          <div className="flex items-center gap-3 mb-4">
            {icon}
            {title && <h3 id="dialog-title" className="text-lg font-bold">{title}</h3>}
          </div>
        )}

        {description && (
          <p className="text-sm text-gray-600 mb-6">
            {description}
          </p>
        )}

        {children}
      </div>
    </div>
  );
}
