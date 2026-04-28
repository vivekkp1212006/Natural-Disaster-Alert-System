import React from "react";

const StatusModal = ({ open, type = "info", title, message, onClose, children, closeLabel = "Close" }) => {
  if (!open) return null;

  return (
    <div className="status-modal-overlay" role="dialog" aria-modal="true">
      <div className={`status-modal-card ${type}`}>
        <h3>{title || (type === "error" ? "Error" : "Success")}</h3>
        {message ? <p>{message}</p> : null}
        {children}
        <button type="button" className="login-button" onClick={onClose}>
          {closeLabel}
        </button>
      </div>
    </div>
  );
};

export default StatusModal;
