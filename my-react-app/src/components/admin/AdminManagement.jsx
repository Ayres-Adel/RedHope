import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, faDownload, faUserPlus,
  faUsers, faHospital, faFileAlt, faCog, faCheck
} from '@fortawesome/free-solid-svg-icons';
import ActionButton from '../ui/ActionButton';

const AdminManagement = ({
  admins,
  loading,
  searchTerm,
  translations,
  onSearchChange,
  onOpenModal,
  onDeleteAdmin,
  onExportCSV,
  modalType,
  roles,
  EmptyStateMessage,
  LoadingIndicator
}) => {
  const [exportLoading, setExportLoading] = useState(false);
  
  const handleExportClick = async () => {
    if (exportLoading) return;
    
    setExportLoading(true);
    await onExportCSV('admins');
    setExportLoading(false);
  };
  
  return (
    <div className="admin-management">
      <h2>{translations.adminAccountsManagement}</h2>
      <div className="controls">
        <div className="search-container">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input 
            type="text" 
            placeholder={`Search ${translations.adminAccountsManagement.toLowerCase()}...`} 
            value={searchTerm} 
            onChange={onSearchChange} 
            aria-label={`Search ${translations.adminAccountsManagement.toLowerCase()}`}
          />
        </div>
        <div className="action-buttons">
          <button 
            className="control-button" 
            onClick={handleExportClick} 
            disabled={exportLoading || admins.length === 0}
          >
            <FontAwesomeIcon icon={faDownload} /> 
            {exportLoading ? 'Exporting...' : translations.exportData}
          </button>
          
          <button className="add-button" onClick={() => onOpenModal(modalType)}>
            <FontAwesomeIcon icon={faUserPlus} /> {translations.addNewAdmin}
          </button>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <LoadingIndicator message={translations.loadingData} />
        ) : admins.length === 0 ? (
          <EmptyStateMessage type="admin" message="No admin accounts found." />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr>
                  <th>{translations.name}</th>
                  <th>{translations.email}</th>
                  <th>{translations.role}</th>
                  <th>{translations.actions}</th>
              </tr></thead>
              <tbody>
                {admins.map(admin => (
                  <tr key={admin.id}>
                    <td data-label={translations.name}>{admin.username}</td>
                    <td data-label={translations.email}>{admin.email}</td>
                    <td data-label={translations.role}>
                      {admin.role === roles.SUPERADMIN ? translations.superAdministrator : 'Admin'}
                    </td>
                    <td className="actions">
                      <ActionButton type="edit" onClick={() => onOpenModal(modalType, admin)} />
                      <ActionButton 
                        type="delete" 
                        onClick={() => onDeleteAdmin(admin.id, admin.username)} 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="data-cards">
              {admins.map(admin => (
                <div className="data-card" key={admin.id}>
                  <div className="data-card-header">
                    <h3 className="data-card-title">{admin.username}</h3>
                  </div>
                  
                  <div className="data-card-content">
                    <div className="data-card-field">
                      <span className="data-card-label">{translations.email}</span>
                      <span className="data-card-value">{admin.email}</span>
                    </div>
                    <div className="data-card-field">
                      <span className="data-card-label">{translations.role}</span>
                      <span className="data-card-value">
                        {admin.role === roles.SUPERADMIN ? translations.superAdministrator : 'Admin'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="data-card-footer">
                    <div className="actions">
                      <ActionButton type="edit" onClick={() => onOpenModal(modalType, admin)} />
                      <ActionButton 
                        type="delete" 
                        onClick={() => onDeleteAdmin(admin.id, admin.username)} 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
  onExportCSV: PropTypes.func.isRequired,
  modalType: PropTypes.string.isRequired,
  roles: PropTypes.object.isRequired,
  EmptyStateMessage: PropTypes.elementType.isRequired,
  LoadingIndicator: PropTypes.elementType.isRequired
};

export default React.memo(AdminManagement);
