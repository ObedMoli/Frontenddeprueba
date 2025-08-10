import React from 'react';

export default function ErrorBanner({ message, onClose }) {
  if (!message) return null;
  return (
     <div className="alert alert-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span>{String(message)}</span>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          color: 'inherit',
          border: 'none',
          fontSize: '1.2rem',
          cursor: 'pointer'
        }}
      >
        ✕
      </button>
    </div>
  );
}