import React from 'react';

export default function ErrorBanner({ message, onClose }) {
  if (!message) return null;
  return (
    <div style={{
      background: '#fdecea',
      color: '#611a15',
      border: '1px solid #f5c6cb',
      borderRadius: 8,
      padding: 10,
      marginBottom: 12,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <span>{String(message)}</span>
      <button onClick={onClose} style={{ marginLeft: 12 }}>✕</button>
    </div>
  );
}