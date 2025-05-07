import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faDownload, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import ActionButton from '../ui/ActionButton';
import StatusBadge from '../ui/StatusBadge';

/**
 * UserManagement component for handling user data display and operations
 */
const UserManagement = ({
  users,
  loading,
  actionLoading,
  searchTerm,
  pageInfo,
  translations,
  onSearchChange,
  onExportCSV,
  onOpenModal,
  onDeleteUser,
  onPageChange,
  modalType,
  EmptyStateMessage,
  Pagination,
  LoadingIndicator
}) => {
  return (
    <div className="admin-users">
      <h2>{translations.userManagement}</h2>
      <div className="controls">
        <div className="search-container">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input 
            type="text" 
            placeholder={translations.searchUsers} 
            value={searchTerm} 
            onChange={onSearchChange} 
          />
        </div>
        <div className="action-buttons">
          <button className="control-button" onClick={() => onExportCSV('users')} disabled={actionLoading}>
            <FontAwesomeIcon icon={faDownload} /> {actionLoading ? 'Exporting...' : translations.exportData}
          </button>
          <button className="add-button" onClick={() => onOpenModal(modalType)}>
            <FontAwesomeIcon icon={faUserPlus} /> {translations.addNewUser}
          </button>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <LoadingIndicator message={translations.loadingData} />
        ) : users.length === 0 ? (
          <EmptyStateMessage type="user" message={searchTerm ? 'No users match search.' : 'No users found.'} />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{translations.id}</th>
                <th>{translations.name}</th>
                <th>{translations.email}</th>
                <th>{translations.bloodType}</th>
                <th>{translations.location}</th>
                <th>{translations.status}</th>
                <th>{translations.actions}</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>{user._id.slice(-6)}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.bloodType}</td>
                  <td>{user.location}</td>
                  <td><StatusBadge isDonor={user.isDonor} /></td>
                  <td className="actions">
                    <ActionButton type="edit" onClick={() => onOpenModal(modalType, user)} />
                    <ActionButton type="delete" onClick={() => onDeleteUser(user._id, user.username)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination
        currentPage={pageInfo.page}
        totalPages={pageInfo.totalPages}
        onPageChange={(newPage) => onPageChange('users', newPage)}
      />
    </div>
  );
};

UserManagement.propTypes = {
  users: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  actionLoading: PropTypes.bool.isRequired,
  searchTerm: PropTypes.string.isRequired,
  pageInfo: PropTypes.shape({
    page: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired,
    totalItems: PropTypes.number.isRequired
  }).isRequired,
  translations: PropTypes.object.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onExportCSV: PropTypes.func.isRequired,
  onOpenModal: PropTypes.func.isRequired,
  onDeleteUser: PropTypes.func.isRequired,
  onPageChange: PropTypes.func.isRequired,
  modalType: PropTypes.string.isRequired,
  EmptyStateMessage: PropTypes.elementType.isRequired,
  Pagination: PropTypes.elementType.isRequired,
  LoadingIndicator: PropTypes.elementType.isRequired
};

export default React.memo(UserManagement);
