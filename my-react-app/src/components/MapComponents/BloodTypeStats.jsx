import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faTint, faUsers, faSpinner } from '@fortawesome/free-solid-svg-icons';

// Constants for blood supply thresholds
const SUPPLY_THRESHOLDS = {
  STABLE: 20,
  LOW: 10
};

// Constants for status colors
const STATUS_COLORS = {
  STABLE: {
    main: '#27ae60',
    bg: 'rgba(39, 174, 96, 0.1)'
  },
  LOW: {
    main: '#f39c12',
    bg: 'rgba(243, 156, 18, 0.1)'
  },
  CRITICAL: {
    main: '#e74c3c',
    bg: 'rgba(231, 76, 60, 0.1)'
  }
};

// Blood type card component
const BloodTypeCard = ({ type, count, percentage, statusColor, statusBgColor }) => (
  <div className="blood-type-card">
    <div className="blood-type-symbol" style={{ 
      backgroundColor: statusBgColor, 
      color: statusColor,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <span style={{ position: 'relative', zIndex: 2 }} aria-label={`Blood type ${type}`}>{type}</span>
      <div 
        className="blood-fill" 
        style={{ 
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: statusColor,
          height: `${percentage}%`,
          opacity: 0.4,
          zIndex: 1,
          transition: 'height 0.5s ease-in-out'
        }}
        role="presentation"
      ></div>
    </div>
    <div className="blood-type-info">
      <div className="blood-count">{count.toLocaleString()}</div>
      <div className="blood-label">donors</div>
    </div>
  </div>
);

// Chart bar component
const ChartBar = ({ type, percentage, color }) => (
  <div className="chart-bar-container">
    <div className="chart-bar-label">{type}</div>
    <div className="chart-bar-wrapper">
      <div 
        className="chart-bar" 
        style={{ 
          width: `${percentage}%`,
          backgroundColor: color
        }}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label={`${type}: ${percentage.toFixed(1)}%`}
      ></div>
    </div>
    <div className="chart-bar-value">{percentage.toFixed(1)}%</div>
  </div>
);

export const BloodTypeStats = ({ 
  bloodTypeStats = {}, 
  selectedCityName = 'Unknown', 
  loadingStats = false, 
  totalDonors = 0, 
  statsError = false, 
  fetchBloodTypeStats = () => {}
}) => {
  // Process blood type data with memoization to avoid recalculation on re-renders
  const processedBloodTypes = useMemo(() => {
    return Object.entries(bloodTypeStats || {}).map(([type, data]) => {
      const count = data.count || 0;
      const percentage = totalDonors > 0 ? (count / totalDonors) * 100 : 0;
      
      // Determine supply status and color
      let status, statusColor, statusBgColor;
      
      if (count >= SUPPLY_THRESHOLDS.STABLE) {
        status = 'STABLE';
        statusColor = STATUS_COLORS.STABLE.main;
        statusBgColor = STATUS_COLORS.STABLE.bg;
      } else if (count >= SUPPLY_THRESHOLDS.LOW) {
        status = 'LOW';
        statusColor = STATUS_COLORS.LOW.main;
        statusBgColor = STATUS_COLORS.LOW.bg;
      } else {
        status = 'CRITICAL';
        statusColor = STATUS_COLORS.CRITICAL.main;
        statusBgColor = STATUS_COLORS.CRITICAL.bg;
      }
      
      return {
        type,
        count,
        percentage,
        status,
        statusColor,
        statusBgColor
      };
    });
  }, [bloodTypeStats, totalDonors]);
  
  // Render skeleton loading cards
  const renderSkeletonCards = () => (
    <div className="stats-loading">
      <div className="blood-type-grid">
        {Array(8).fill(0).map((_, idx) => (
          <div key={idx} className="blood-type-card skeleton" aria-hidden="true"></div>
        ))}
      </div>
    </div>
  );
  
  // Render error state
  const renderError = () => (
    <div className="stats-error" role="alert">
      <p>Could not load blood type statistics</p>
      <button 
        onClick={fetchBloodTypeStats} 
        className="retry-button"
        aria-label="Try loading blood type statistics again"
      >
        Try Again
      </button>
    </div>
  );
  
  // Render blood types grid
  const renderBloodTypesGrid = () => (
    <div className="blood-type-grid">
      {processedBloodTypes.map(({ type, count, percentage, statusColor, statusBgColor }) => (
        <BloodTypeCard
          key={type}
          type={type}
          count={count}
          percentage={percentage}
          statusColor={statusColor}
          statusBgColor={statusBgColor}
        />
      ))}
    </div>
  );
  
  // Render chart bars
  const renderChartBars = () => (
    <div className="blood-chart">
      <div className="chart-bars">
        {processedBloodTypes.map(({ type, percentage, statusColor }) => (
          <ChartBar
            key={type}
            type={type}
            percentage={percentage}
            color={statusColor}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="blood-type-stats">
      <div className="stats-header">
        <h3><FontAwesomeIcon icon={faTint} aria-hidden="true" /> Blood Type Statistics</h3>
        <div className="stats-location">
          <FontAwesomeIcon icon={faMapMarkerAlt} aria-hidden="true" /> 
          <span>{selectedCityName} Region</span>
        </div>
        <p className="donor-count">
          <FontAwesomeIcon icon={faUsers} aria-hidden="true" /> 
          {loadingStats ? (
            <span className="loading-text">
              <FontAwesomeIcon icon={faSpinner} className="fa-spin" aria-hidden="true" /> 
              Loading donor data...
            </span>
          ) : (
            <span>{totalDonors.toLocaleString()} Registered Donors</span>
          )}
        </p>
      </div>
      
      {statsError ? renderError() : 
       loadingStats ? renderSkeletonCards() : (
         <>
           {renderBloodTypesGrid()}
           {renderChartBars()}
         </>
       )}
    </div>
  );
};

// PropTypes for type checking
BloodTypeStats.propTypes = {
  bloodTypeStats: PropTypes.object,
  selectedCityName: PropTypes.string,
  loadingStats: PropTypes.bool,
  totalDonors: PropTypes.number,
  statsError: PropTypes.bool,
  fetchBloodTypeStats: PropTypes.func
};

// PropTypes for sub-components
BloodTypeCard.propTypes = {
  type: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  percentage: PropTypes.number.isRequired,
  statusColor: PropTypes.string.isRequired,
  statusBgColor: PropTypes.string.isRequired
};

ChartBar.propTypes = {
  type: PropTypes.string.isRequired,
  percentage: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired
};
