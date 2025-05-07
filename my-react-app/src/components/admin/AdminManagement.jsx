import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import ActionButton from '../ui/ActionButton';

/**
 * AdminManagement component for handling administration accounts
 */
const AdminManagement = ({
  admins,
  loading,
  searchTerm,
  translations,
  onSearchChange,
  onOpenModal,
  onDeleteAdmin,
  modalType,
  roles,
  EmptyStateMessage,
  LoadingIndicator
}) => {
  const filteredAdmins = admins.filter(admin =>
    (admin.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (admin.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-management">
      <h2>{translations.adminAccountsManagement}</h2>
      <div className="controls">
        <div className="search-container">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search admins by username or email..." 
            value={searchTerm} 
            onChange={onSearchChange} 
          />
        </div>
        <div className="action-buttons">
          <button className="add-button" onClick={() => onOpenModal(modalType)}>
            <FontAwesomeIcon icon={faUserPlus} /> {translations.addNewAdmin}
          </button>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <LoadingIndicator message={translations.loadingData} />
        ) : admins.length === 0 ? (
          <EmptyStateMessage type="admin account" message="No admin accounts found." />
        ) : filteredAdmins.length === 0 && searchTerm ? (
          <EmptyStateMessage type="admin account" message="No admins match search." />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Permissions</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.map(admin => (
                <tr key={admin.id}>
                  <td>{typeof admin.id === 'string' ? admin.id.slice(-6) : admin.id}</td>
                  <td>{admin.username}</td>
                  <td>{admin.email}</td>
                  <td>
                    <span className={`status-badge ${admin.role === roles.SUPERADMIN ? 'active' : ''}`}>
                      {admin.role === roles.SUPERADMIN ? translations.superAdministrator : 'Admin'}
                    </span>
                  </td>
                  <td>
                    <div className="permission-badges">
                      {admin.permissions.manageUsers && <span title="Users" className="permission-badge">👥</span>}
                      {admin.permissions.manageDonations && <span title="Donations" className="permission-badge">🩸</span>}
                      {admin.permissions.manageContent && <span title="Content" className="permission-badge">📄</span>}
                      {admin.permissions.manageSettings && <span title="Settings" className="permission-badge">⚙️</span>}
                    </div>
                  </td>
                  <td>{admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : 'Never'}</td>
                  <td className="actions">
                    <ActionButton type="edit" onClick={() => onOpenModal(modalType, admin)} />
                    <ActionButton type="delete" onClick={() => onDeleteAdmin(admin.id, admin.username)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

AdminManagement.propTypes = {
  admins: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  searchTerm: PropTypes.string.isRequired,
  translations: PropTypes.object.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onOpenModal: PropTypes.func.isRequired,
  onDeleteAdmin: PropTypes.func.isRequired,
  modalType: PropTypes.string.isRequired,
  roles: PropTypes.object.isRequired,
  EmptyStateMessage: PropTypes.elementType.isRequired,
  LoadingIndicator: PropTypes.elementType.isRequired
};

export default React.memo(AdminManagement);
