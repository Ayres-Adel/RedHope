import React from 'react';
import PropTypes from 'prop-types';

/**
 * Displays recent activity logs in the admin dashboard
 */
const RecentActivitySection = ({ translations, activities = [] }) => {
  // If no activities provided, use defaults
  const defaultActivities = [
    {
      id: 1,
      time: new Date(),
      description: 'Admin logged in'
    },
    {
      id: 2, 
      time: new Date(),
      description: 'System stats updated'
    }
  ];

  const displayActivities = activities.length > 0 ? activities : defaultActivities;

  return (
    <div className="recent-activity-section">
      <h3>{translations.recentActivity}</h3>
      <div className="activity-list">
        {displayActivities.map(activity => (
          <div key={activity.id} className="activity-item">
            <span className="activity-time">
              {activity.time.toLocaleTimeString()} - {activity.time.toLocaleDateString()}
            </span>
            <span className="activity-desc">{activity.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

RecentActivitySection.propTypes = {
  translations: PropTypes.object.isRequired,
  activities: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      time: PropTypes.instanceOf(Date).isRequired,
      description: PropTypes.string.isRequired
    })
  )
};

export default React.memo(RecentActivitySection);
