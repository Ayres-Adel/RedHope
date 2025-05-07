import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faTint, faBell, faUserShield
} from '@fortawesome/free-solid-svg-icons';

/**
 * Displays the four main dashboard metric cards
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
        <div className="metric-icon"><FontAwesomeIcon icon={faTint} /></div>
        <div className="metric-data">
          <h3>{translations.totalDonations}</h3>
          <p>{stats.totalDonations || 0}</p>
        </div>
      </div>
      <div className="metric-card">
        <div className="metric-icon"><FontAwesomeIcon icon={faBell} /></div>
        <div className="metric-data">
          <h3>{translations.pendingRequests}</h3>
          <p>{stats.pendingRequests || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardMetrics;
