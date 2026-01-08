import React from 'react';

/**
 * CameraButton — floating camera button that opens the scanner.
 * It sets the id="camera-icon" required by CameraScanner (openOnClickSelector).
 *
 * If you already have a floating button in your app, add id="camera-icon"
 * to that element instead of creating this component.
 */
export default function CameraButton({ onClick = null, showBadge = false, badgeCount = 0 }) {
  const handle = (e) => {
    // if parent passed an onClick, call it first
    if (onClick) onClick(e);
    // no need to do anything else — CameraScanner binds to #camera-icon automatically
  };

  return (
    <button
      id="camera-icon"
      aria-label="Scan product"
      className="camera-fab"
      onClick={handle}
      type="button"
    >
      {/* <span className="camera-emoji" role="img" aria-hidden="true">📷</span> */}
      {showBadge && badgeCount > 0 && <span className="badge">{badgeCount}</span>}
    </button>
  );
}
