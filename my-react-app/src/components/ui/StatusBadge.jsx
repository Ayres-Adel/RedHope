import React from 'react';

/**
 * Renders a status badge with appropriate styling
 * @param {string} status - Status text to display
 * @param {boolean} isDonor - Flag indicating donor status (optional)
 */
const StatusBadge = ({ status, isDonor }) => {
  
  let badgeClass = (status || '').toLowerCase();
  let text = status;

  if (typeof isDonor !== 'undefined') {
    badgeClass = isDonor ? 'active' : 'cancelled'; // Reusing styles
    text = isDonor ? 'Donor' : 'Non-Donor';
  }

  return <span className={`status-badge ${badgeClass}`}>{text}</span>;
};

export default StatusBadge;
