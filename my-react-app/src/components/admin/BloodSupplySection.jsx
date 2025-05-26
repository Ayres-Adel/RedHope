import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';

const BloodSupplySection = ({ stats, translations }) => {
  const maxCount = Math.max(
    ...Object.values(stats.bloodCounts || {}).map(count => Number(count) || 0),
    10 
  );

  return (
    <div className="blood-supply-section">
      <h3>{translations.bloodTypeAvailability}</h3>
      <div className="blood-types-grid">
        {stats.bloodSupplyUnavailable ? (
          <div className="blood-supply-unavailable">
            <FontAwesomeIcon icon={faExclamationTriangle} />
            <p>{translations.noBloodSupplyData}</p>
          </div>
        ) : Object.keys(stats.bloodSupply || {}).length > 0 ? (
          Object.entries(stats.bloodSupply).map(([type, status]) => {
            const count = stats.bloodCounts?.[type] || 0;
            const progressWidth = Math.min((count / maxCount) * 100, 100);
            
            return (
              <div key={type} className={`blood-type-card ${status}`}>
                <div className="blood-status-indicator"></div>
                <h4>{type}</h4>
                <span>{translations[status] || status}</span>
                <div className="blood-count">
                  <div className="blood-count-bar">
                    <div 
                      className={`blood-count-progress ${status}`} 
                      style={{ 
                        width: `${progressWidth}%` 
                      }}
                    ></div>
                  </div>
                  <span>
                    <span className="donor-icon">
                      <FontAwesomeIcon icon={faUsers} />
                    </span>
                    {count} {translations.donors}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-blood-data">
            <FontAwesomeIcon icon={faExclamationTriangle} />
            <p>{translations.noBloodSupplyData}</p>
          </div>
        )}
      </div>
    </div>
  );
};

BloodSupplySection.propTypes = {
  stats: PropTypes.shape({
    bloodSupply: PropTypes.object,
    bloodCounts: PropTypes.object,
    bloodSupplyUnavailable: PropTypes.bool
  }).isRequired,
  translations: PropTypes.object.isRequired
};

export default React.memo(BloodSupplySection);
