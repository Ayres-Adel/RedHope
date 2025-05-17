import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, faDownload, faHospital, faEdit, 
  faTrashAlt, faExclamationCircle, faMapMarkerAlt,
  faPhone, faFax
} from '@fortawesome/free-solid-svg-icons';

const HospitalManagement = ({
  hospitals,
  loading,
  actionLoading,
  searchTerm,
  pageInfo,
  translations,
  onSearchChange,
  onExportCSV,
  onOpenModal,
  onDeleteHospital,
  onPageChange,
  EmptyStateMessage,
  Pagination,
  LoadingIndicator,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [renderError, setRenderError] = useState(null);

  // Safely check if hospitals is an array
  const hasHospitals = Array.isArray(hospitals) && hospitals.length > 0;
  
  // Use Effect to catch render errors
  useEffect(() => {
    try {
      // Check if hospitals is not an array when it's expected to be
      if (hospitals && !Array.isArray(hospitals)) {
        console.error("Hospitals prop is not an array:", hospitals);
        setRenderError("Invalid hospital data format");
      } else {
        setRenderError(null);
      }
    } catch (err) {
      console.error("Error in HospitalManagement:", err);
      setRenderError(err.message || "Failed to render hospital management");
    }
  }, [hospitals]);

  // Helper function to format coordinates for display
  const formatCoordinates = (hospital) => {
    if (hospital.location && Array.isArray(hospital.location.coordinates) && hospital.location.coordinates.length === 2) {
      // GeoJSON format is [longitude, latitude], but we display as [latitude, longitude]
      return `${hospital.location.coordinates[1].toFixed(4)}, ${hospital.location.coordinates[0].toFixed(4)}`;
    }
    return 'N/A';
  };
  
  // If there's a render error, show an error message
  if (renderError) {
    return (
      <div className="admin-hospitals">
        <h2>{translations.hospitalManagement}</h2>
        <div className="error-container">
          <FontAwesomeIcon icon={faExclamationCircle} size="3x" color="#ff4747" />
          <h3>Error Loading Hospitals</h3>
          <p>{renderError}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Reload Page
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="admin-hospitals">
      <h2>{translations.hospitalManagement}</h2>
      <div className="controls">
        <div className="search-container">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input 
            type="text" 
            placeholder={translations.searchHospitals} 
            value={searchTerm} 
            onChange={onSearchChange} 
            aria-label={translations.searchHospitals}
          />
        </div>
        <div className="action-buttons">
          <button 
            className="control-button" 
            onClick={() => onExportCSV('hospitals')} 
            disabled={actionLoading || !hasHospitals}
          >
            <FontAwesomeIcon icon={faDownload} /> {actionLoading ? 'Exporting...' : translations.exportData}
          </button>
          <button className="add-button" onClick={() => onOpenModal('hospital')}>
            <FontAwesomeIcon icon={faHospital} /> {translations.addNewHospital}
          </button>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <LoadingIndicator message={translations.loadingData} />
        ) : !hasHospitals ? (
          <EmptyStateMessage type="hospital" message={searchTerm ? 'No hospitals match search.' : translations.noHospitalsFound} />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr>
                  <th>{translations.name}</th>
                  <th>{translations.structure}</th>
                  <th>{translations.wilaya}</th>
                  <th>{translations.telephone}</th>
                  <th>{translations.coordinates}</th>
                  <th>{translations.actions}</th>
              </tr></thead>
              <tbody>
                {hospitals.map(hospital => (
                  <tr key={hospital._id}>
                    <td data-label={translations.name}>{hospital.name}</td>
                    <td data-label={translations.structure}>{hospital.structure}</td>
                    <td data-label={translations.wilaya}>{hospital.wilaya}</td>
                    <td data-label={translations.telephone}>{hospital.telephone || 'N/A'}</td>
                    <td data-label={translations.coordinates}>
                      {formatCoordinates(hospital)}
                    </td>
                    <td className="actions">
                      <button
                        className="action-btn edit"
                        onClick={() => onOpenModal('hospital', hospital)}
                        title={translations.edit}
                        aria-label={`${translations.edit} ${hospital.name}`}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      
                      <button
                        className="action-btn delete"
                        onClick={() => onDeleteHospital(hospital._id, hospital.name)}
                        title={translations.delete}
                        aria-label={`${translations.delete} ${hospital.name}`}
                      >
                        <FontAwesomeIcon icon={faTrashAlt} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Card view for mobile - updated to match user card styling */}
            <div className="data-cards">
              {hospitals.map(hospital => (
                <div className="data-card" key={hospital._id}>
                  <div className="data-card-blood-type">
                    <FontAwesomeIcon icon={faHospital} />
                  </div>
                  
                  <div className="data-card-header">
                    <h3 className="data-card-title">{hospital.name}</h3>
                  </div>
                  
                  <div className="data-card-content">
                    <div className="data-card-field">
                      <span className="data-card-label">{translations.structure}</span>
                      <span className="data-card-value">{hospital.structure}</span>
                    </div>
                    
                    <div className="data-card-field">
                      <span className="data-card-label">{translations.wilaya}</span>
                      <span className="data-card-value">{hospital.wilaya}</span>
                    </div>
                    
                    <div className="data-card-field">
                      <span className="data-card-label">{translations.telephone}</span>
                      <span className="data-card-value">{hospital.telephone || 'N/A'}</span>
                    </div>
                    
                    <div className="data-card-field">
                      <span className="data-card-label">{translations.coordinates}</span>
                      <span className="data-card-value">{formatCoordinates(hospital)}</span>
                    </div>
                  </div>
                  
                  <div className="data-card-footer">
                    <div className="actions">
                      <button 
                        onClick={() => onOpenModal('hospital', hospital)} 
                        className="action-btn edit"
                        aria-label={`${translations.edit} ${hospital.name}`}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button 
                        onClick={() => onDeleteHospital(hospital._id, hospital.name)} 
                        className="action-btn delete"
                        aria-label={`${translations.delete} ${hospital.name}`}
                      >
                        <FontAwesomeIcon icon={faTrashAlt} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {hasHospitals && (
        <Pagination
          currentPage={pageInfo.page || 1}
          totalPages={pageInfo.totalPages || 1}
          onPageChange={(newPage) => onPageChange('hospitals', newPage)}
        />
      )}
    </div>
  );
};

export default HospitalManagement;
