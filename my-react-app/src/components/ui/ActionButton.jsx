import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

/**
 * Renders an action button with an icon
 * @param {string} type - The type of button (edit, delete, approve, reject)
 * @param {Function} onClick - Function to call when button is clicked
 * @param {string} title - Tooltip title for the button
 */
const ActionButton = ({ type, onClick, title }) => {
  const icons = { edit: faEdit, delete: faTrash, approve: faCheck, reject: faTimes };
  return (
    <button className={`action-btn ${type}`} onClick={onClick} title={title || type}>
      <FontAwesomeIcon icon={icons[type]} />
    </button>
  );
};

export default ActionButton;
