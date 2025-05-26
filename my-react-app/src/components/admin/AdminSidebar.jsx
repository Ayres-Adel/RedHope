import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faHospital,
  faUserShield, faChartLine
} from '@fortawesome/free-solid-svg-icons';


const AdminSidebar = ({ activeTab, setActiveTab, translations, userRole }) => {
  const menuItems = useMemo(() => {
    const baseItems = [
      { id: 'dashboard', icon: faChartLine, label: translations.dashboard },
      { id: 'users', icon: faUsers, label: translations.userManagement },
      { id: 'hospitals', icon: faHospital, label: translations.hospitalManagement },
    ];

    if (userRole === 'superadmin') {
      baseItems.splice(2, 0, { id: 'adminManagement', icon: faUserShield, label: translations.adminManagement });
    }

    return baseItems;
  }, [translations, userRole]);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <div className="admin-sidebar">
      <div className="admin-profile">
        <div className="admin-avatar"><FontAwesomeIcon icon={faUserShield} /></div>
        <div className="admin-info">
          <h3>Admin User</h3>
          <p>{userRole === 'superadmin' ? translations.superAdministrator : 'Administrator'}</p>
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
