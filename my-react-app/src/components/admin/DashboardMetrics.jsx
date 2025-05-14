import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faUserShield, faHospital
} from '@fortawesome/free-solid-svg-icons';

/**
 * Displays the main dashboard metric cards
 */
const DashboardMetrics = ({ stats, translations }) => {
  return (
    <div className="dashboard-metrics">
      <div className="metric-card">
        <div className="metric-icon"><FontAwesomeIcon icon={faUsers} /></div>
        <div className="metric-data">
          <h3>{translations.totalUsers}</h3>
          <p>{stats.totalUsers || 0}</p>
        </div>
      </div>
      <div className="metric-card">
        <div className="metric-icon"><FontAwesomeIcon icon={faUserShield} /></div>
        <div className="metric-data">
          <h3>{translations.totalDonors}</h3>
          <p>{stats.totalDonors || 0}</p>
        </div>
      </div>
      <div className="metric-card">
        <div className="metric-icon"><FontAwesomeIcon icon={faHospital} /></div>
        <div className="metric-data">
          <h3>{translations.hospitals}</h3>
          <p>{stats.totalHospitals || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardMetrics;
