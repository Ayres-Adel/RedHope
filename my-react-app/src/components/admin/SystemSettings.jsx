import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell, faDatabase, faServer, faChartLine, 
  faCog, faDownload, faEdit 
} from '@fortawesome/free-solid-svg-icons';

/**
 * SystemSettings component for managing system configuration
 */
const SystemSettings = ({ translations }) => {
  return (
    <div className="admin-settings">
      <h2>{translations.systemSettings}</h2>
      <div className="settings-grid">
        <div className="settings-card">
          <div className="card-content">
            <div className="card-icon"><FontAwesomeIcon icon={faBell} /></div>
            <h3>{translations.notificationSettings}</h3>
            <p>{translations.notificationSettingsDesc}</p>
            <button className="control-button"><FontAwesomeIcon icon={faCog} /> {translations.configure}</button>
          </div>
        </div>
        <div className="settings-card">
          <div className="card-content">
            <div className="card-icon"><FontAwesomeIcon icon={faDatabase} /></div>
            <h3>{translations.systemBackup}</h3>
            <p>{translations.systemBackupDesc}</p>
            <button className="control-button"><FontAwesomeIcon icon={faDownload} /> {translations.backupNow}</button>
          </div>
        </div>
        <div className="settings-card">
          <div className="card-content">
            <div className="card-icon"><FontAwesomeIcon icon={faServer} /></div>
            <h3>{translations.apiIntegration}</h3>
            <p>{translations.apiIntegrationDesc}</p>
            <button className="control-button"><FontAwesomeIcon icon={faEdit} /> {translations.viewAPIs}</button>
          </div>
        </div>
      </div>
      <div className="system-info">
        <h3><FontAwesomeIcon icon={faChartLine} /> {translations.systemInformation}</h3>
        <div className="info-grid">
          <div className="info-item"><span className="info-label">{translations.version}</span><span className="info-value">1.0.0</span></div>
          <div className="info-item"><span className="info-label">{translations.lastUpdate}</span><span className="info-value">{new Date().toLocaleDateString()}</span></div>
          <div className="info-item"><span className="info-label">{translations.databaseStatus}</span><span className="info-value status-ok">{translations.connected}</span></div>
          <div className="info-item"><span className="info-label">{translations.serverStatus}</span><span className="info-value status-ok">{translations.online}</span></div>
        </div>
      </div>
    </div>
  );
};

SystemSettings.propTypes = {
  translations: PropTypes.object.isRequired,
};

export default React.memo(SystemSettings);
