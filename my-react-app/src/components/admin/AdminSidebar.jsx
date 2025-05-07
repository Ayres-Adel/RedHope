import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faTint, faNewspaper, faCog,
  faUserShield, faChartLine
} from '@fortawesome/free-solid-svg-icons';

/**
 * AdminSidebar component that handles navigation in the admin panel
 */
const AdminSidebar = ({ activeTab, setActiveTab, translations }) => {
  // Define menu items with their icons, labels, and IDs
  const menuItems = useMemo(() => [
    { id: 'dashboard', icon: faChartLine, label: translations.dashboard },
    { id: 'users', icon: faUsers, label: translations.userManagement },
    { id: 'adminManagement', icon: faUserShield, label: translations.adminManagement },
    { id: 'donations', icon: faTint, label: translations.donations },
    { id: 'content', icon: faNewspaper, label: translations.content },
    { id: 'settings', icon: faCog, label: translations.settings },
  ], [translations]);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <div className="admin-sidebar">
      <div className="admin-profile">
        <div className="admin-avatar"><FontAwesomeIcon icon={faUserShield} /></div>
        <div className="admin-info">
          <h3>Admin User</h3>
          <p>{translations.superAdministrator}</p>
        </div>
      </div>
      <ul className="admin-menu">
        {menuItems.map(item => (
          <li 
            key={item.id}
            className={activeTab === item.id ? 'active' : ''}
            onClick={() => handleTabClick(item.id)}
          >
            <FontAwesomeIcon icon={item.icon} />
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

AdminSidebar.propTypes = {
  activeTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired,
  translations: PropTypes.object.isRequired,
};

export default React.memo(AdminSidebar);
