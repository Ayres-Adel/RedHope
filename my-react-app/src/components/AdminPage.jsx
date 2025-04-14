import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, faTint, faNewspaper, faCog, faBell, 
  faSearch, faEdit, faTrash, faCheck, faTimes, 
  faChartLine, faUserShield, faCalendarAlt, faMapMarkerAlt,
  faDownload, faFilter, faLanguage, faMoon, faSun
} from '@fortawesome/free-solid-svg-icons';
import Navbar from './Navbar';
import '../styles/AdminPage.css';

const AdminPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [donations, setDonations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true' || 
      document.body.classList.contains('dark-theme');
  });

  // Translations
  const translations = {
    en: {
      dashboard: 'Dashboard',
      dashboardOverview: 'Dashboard Overview',
      userManagement: 'User Management',
      donations: 'Donations',
      donationManagement: 'Donation Management',
      content: 'Content',
      contentManagement: 'Content Management',
      settings: 'Settings',
      systemSettings: 'System Settings',
      totalUsers: 'Total Users',
      totalDonations: 'Total Donations',
      scheduledDonations: 'Scheduled Donations',
      pendingRequests: 'Pending Requests',
      recentActivity: 'Recent Activity',
      bloodTypeAvailability: 'Blood Type Availability',
      available: 'Available',
      low: 'Low',
      critical: 'Critical',
      searchUsers: 'Search users...',
      searchDonations: 'Search donations...',
      addNewUser: 'Add New User',
      id: 'ID',
      name: 'Name',
      email: 'Email',
      role: 'Role',
      bloodType: 'Blood Type',
      location: 'Location',
      status: 'Status',
      actions: 'Actions',
      donorName: 'Donor Name',
      date: 'Date',
      homepageBanner: 'Homepage Banner',
      announcements: 'Announcements',
      urgentNeed: 'Urgent Need for O- Donors',
      urgentNeedDesc: 'We are currently experiencing a shortage of O- blood type. Please consider donating if you are eligible.',
      aboutUsPage: 'About Us Page',
      aboutUsDesc: 'The current About Us page contains information about our mission, history, and team members.',
      contactInformation: 'Contact Information',
      adminAccounts: 'Admin Accounts',
      adminAccountsDesc: 'Manage administrator access and permissions',
      notificationSettings: 'Notification Settings',
      notificationSettingsDesc: 'Configure system notifications and alerts',
      systemBackup: 'System Backup',
      systemBackupDesc: 'Schedule and manage data backups',
      apiIntegration: 'API Integration',
      apiIntegrationDesc: 'Manage third-party API keys and connections',
      systemInformation: 'System Information',
      version: 'Version',
      lastUpdate: 'Last Update',
      databaseStatus: 'Database Status',
      serverStatus: 'Server Status',
      connected: 'Connected',
      online: 'Online',
      loadingData: 'Loading data...',
      unauthorizedAccess: 'Unauthorized Access',
      noPermission: 'You do not have permission to access the admin panel.',
      returnToHome: 'Return to Home',
      manageAdmins: 'Manage Admins',
      configure: 'Configure',
      backupNow: 'Backup Now',
      viewAPIs: 'View APIs',
      superAdministrator: 'Super Administrator',
      darkMode: 'Dark Mode',
      lightMode: 'Light Mode',
      exportData: 'Export Data',
      filterData: 'Filter Data',
    },
    fr: {
      dashboard: 'Tableau de bord',
      dashboardOverview: 'Aperçu du tableau de bord',
      userManagement: 'Gestion des utilisateurs',
      donations: 'Dons',
      donationManagement: 'Gestion des dons',
      content: 'Contenu',
      contentManagement: 'Gestion du contenu',
      settings: 'Paramètres',
      systemSettings: 'Paramètres du système',
      totalUsers: 'Utilisateurs totaux',
      totalDonations: 'Dons totaux',
      scheduledDonations: 'Dons programmés',
      pendingRequests: 'Demandes en attente',
      recentActivity: 'Activité récente',
      bloodTypeAvailability: 'Disponibilité des groupes sanguins',
      available: 'Disponible',
      low: 'Faible',
      critical: 'Critique',
      searchUsers: 'Rechercher des utilisateurs...',
      searchDonations: 'Rechercher des dons...',
      addNewUser: 'Ajouter un nouvel utilisateur',
      id: 'ID',
      name: 'Nom',
      email: 'Email',
      role: 'Rôle',
      bloodType: 'Groupe sanguin',
      location: 'Emplacement',
      status: 'Statut',
      actions: 'Actions',
      donorName: 'Nom du donneur',
      date: 'Date',
      homepageBanner: 'Bannière de la page d\'accueil',
      announcements: 'Annonces',
      urgentNeed: 'Besoin urgent de donneurs O-',
      urgentNeedDesc: 'Nous connaissons actuellement une pénurie de sang de type O-. Veuillez envisager de faire un don si vous êtes éligible.',
      aboutUsPage: 'Page À propos de nous',
      aboutUsDesc: 'La page À propos de nous contient des informations sur notre mission, notre histoire et les membres de notre équipe.',
      contactInformation: 'Coordonnées',
      adminAccounts: 'Comptes administrateurs',
      adminAccountsDesc: 'Gérer l\'accès et les autorisations des administrateurs',
      notificationSettings: 'Paramètres de notification',
      notificationSettingsDesc: 'Configurer les notifications et alertes du système',
      systemBackup: 'Sauvegarde du système',
      systemBackupDesc: 'Planifier et gérer les sauvegardes de données',
      apiIntegration: 'Intégration API',
      apiIntegrationDesc: 'Gérer les clés API et les connexions tierces',
      systemInformation: 'Informations système',
      version: 'Version',
      lastUpdate: 'Dernière mise à jour',
      databaseStatus: 'État de la base de données',
      serverStatus: 'État du serveur',
      connected: 'Connecté',
      online: 'En ligne',
      loadingData: 'Chargement des données...',
      unauthorizedAccess: 'Accès non autorisé',
      noPermission: 'Vous n\'avez pas la permission d\'accéder au panneau d\'administration.',
      returnToHome: 'Retourner à l\'accueil',
      manageAdmins: 'Gérer les administrateurs',
      configure: 'Configurer',
      backupNow: 'Sauvegarder maintenant',
      viewAPIs: 'Voir les API',
      superAdministrator: 'Super Administrateur',
      darkMode: 'Mode sombre',
      lightMode: 'Mode clair',
      exportData: 'Exporter les données',
      filterData: 'Filtrer les données',
    }
  };

  // Add an effect to listen for language changes from other components (like navbar)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'language') {
        setLanguage(e.newValue || 'en');
      }
    };

    // Listen for storage events from other components
    window.addEventListener('storage', handleStorageChange);
    
    // Also check language on direct navigation/refresh
    const currentLang = localStorage.getItem('language');
    if (currentLang && currentLang !== language) {
      setLanguage(currentLang);
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Custom event for local language changes between components
  useEffect(() => {
    const handleLanguageChange = (e) => {
      setLanguage(e.detail.language);
    };

    // Create custom event listener for language changes
    document.addEventListener('languageChanged', handleLanguageChange);

    return () => {
      document.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, []);

  // Get current translations - make sure it updates when language changes
  const t = translations[language] || translations.en;

  // Mock data - in a real application, this would come from an API
  useEffect(() => {
    // Check if user is admin
    const checkAdminStatus = () => {
      // For testing purposes, set the admin status to true
      // In a real application, this would be replaced with proper authentication
      localStorage.setItem('isAdmin', 'true'); // Add this line to set admin status
      const isUserAdmin = localStorage.getItem('isAdmin') === 'true';
      setIsAdmin(isUserAdmin);
      
      // Uncomment the following when you want to implement proper authentication
      // if (!isUserAdmin) {
      //   navigate('/'); // Redirect non-admin users
      // }
    };

    checkAdminStatus();
    
    // Simulate fetching data
    setTimeout(() => {
      setUsers([
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Donor', bloodType: 'A+', status: 'Active', location: 'New York' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Recipient', bloodType: 'O-', status: 'Active', location: 'Los Angeles' },
        { id: 3, name: 'Robert Johnson', email: 'robert@example.com', role: 'Donor', bloodType: 'B+', status: 'Inactive', location: 'Chicago' },
        { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', role: 'Admin', bloodType: 'AB+', status: 'Active', location: 'Miami' },
        { id: 5, name: 'Michael Brown', email: 'michael@example.com', role: 'Donor', bloodType: 'A-', status: 'Active', location: 'Seattle' }
      ]);
      
      setDonations([
        { id: 101, donorName: 'John Doe', bloodType: 'A+', date: '2023-10-15', status: 'Completed', location: 'Central Hospital' },
        { id: 102, donorName: 'Michael Brown', bloodType: 'A-', date: '2023-10-18', status: 'Scheduled', location: 'Red Cross Center' },
        { id: 103, donorName: 'Robert Johnson', bloodType: 'B+', date: '2023-10-12', status: 'Cancelled', location: 'Community Clinic' },
        { id: 104, donorName: 'Emma Davis', bloodType: 'O+', date: '2023-10-20', status: 'Pending', location: 'Medical Center' },
        { id: 105, donorName: 'William Wilson', bloodType: 'AB-', date: '2023-10-10', status: 'Completed', location: 'Central Hospital' }
      ]);
      
      setLoading(false);
    }, 1000);

    // Apply dark mode if necessary
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [navigate, isDarkMode]);

  // Handle language change
  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  // Handle dark mode toggle
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    document.body.classList.toggle('dark-theme', newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
  };

  // Export data to CSV
  const exportToCSV = (data, filename) => {
    // Convert data to CSV format
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => Object.values(item).join(','));
    const csvContent = [headers, ...rows].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.bloodType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter donations based on search term
  const filteredDonations = donations.filter(donation => 
    donation.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    donation.bloodType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    donation.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserAction = (action, userId) => {
    if (action === 'delete') {
      if (window.confirm('Are you sure you want to delete this user?')) {
        setUsers(users.filter(user => user.id !== userId));
      }
    } else if (action === 'edit') {
      // Open edit user modal/page
      console.log(`Edit user with ID: ${userId}`);
    }
  };

  const handleDonationAction = (action, donationId) => {
    if (action === 'approve') {
      setDonations(donations.map(donation => 
        donation.id === donationId 
          ? { ...donation, status: 'Completed' } 
          : donation
      ));
    } else if (action === 'reject') {
      setDonations(donations.map(donation => 
        donation.id === donationId 
          ? { ...donation, status: 'Cancelled' } 
          : donation
      ));
    }
  };

  // Render dashboard metrics
  const renderDashboard = () => (
    <div className="admin-dashboard">
      <h2>{t.dashboardOverview}</h2>
      
      <div className="dashboard-metrics">
        <div className="metric-card">
          <div className="metric-icon">
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <div className="metric-data">
            <h3>{t.totalUsers}</h3>
            <p>{users.length}</p>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">
            <FontAwesomeIcon icon={faTint} />
          </div>
          <div className="metric-data">
            <h3>{t.totalDonations}</h3>
            <p>{donations.length}</p>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">
            <FontAwesomeIcon icon={faCalendarAlt} />
          </div>
          <div className="metric-data">
            <h3>{t.scheduledDonations}</h3>
            <p>{donations.filter(d => d.status === 'Scheduled').length}</p>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">
            <FontAwesomeIcon icon={faBell} />
          </div>
          <div className="metric-data">
            <h3>{t.pendingRequests}</h3>
            <p>{donations.filter(d => d.status === 'Pending').length}</p>
          </div>
        </div>
      </div>
      
      <div className="recent-activity">
        <h3>{t.recentActivity}</h3>
        <div className="activity-list">
          <div className="activity-item">
            <span className="activity-time">Today, 10:30 AM</span>
            <span className="activity-desc">New user registered: Emma Davis</span>
          </div>
          <div className="activity-item">
            <span className="activity-time">Yesterday, 3:45 PM</span>
            <span className="activity-desc">Donation completed: John Doe (A+)</span>
          </div>
          <div className="activity-item">
            <span className="activity-time">Yesterday, 1:15 PM</span>
            <span className="activity-desc">New donation request from: Michael Brown</span>
          </div>
          <div className="activity-item">
            <span className="activity-time">Oct 18, 2023, 11:20 AM</span>
            <span className="activity-desc">System update completed</span>
          </div>
        </div>
      </div>
      
      <div className="quick-stats">
        <h3>{t.bloodTypeAvailability}</h3>
        <div className="blood-types-grid">
          <div className="blood-type-card available">
            <h4>A+</h4>
            <span>{t.available}</span>
          </div>
          <div className="blood-type-card low">
            <h4>A-</h4>
            <span>{t.low}</span>
          </div>
          <div className="blood-type-card available">
            <h4>B+</h4>
            <span>{t.available}</span>
          </div>
          <div className="blood-type-card available">
            <h4>B-</h4>
            <span>{t.available}</span>
          </div>
          <div className="blood-type-card critical">
            <h4>AB+</h4>
            <span>{t.critical}</span>
          </div>
          <div className="blood-type-card low">
            <h4>AB-</h4>
            <span>{t.low}</span>
          </div>
          <div className="blood-type-card critical">
            <h4>O+</h4>
            <span>{t.critical}</span>
          </div>
          <div className="blood-type-card low">
            <h4>O-</h4>
            <span>{t.low}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Render users management
  const renderUsers = () => (
    <div className="admin-users">
      <h2>{t.userManagement}</h2>
      
      <div className="controls">
        <div className="search-container">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input 
            type="text" 
            placeholder={t.searchUsers} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="action-buttons">
          <button className="control-button" onClick={() => exportToCSV(users, 'users')}>
            <FontAwesomeIcon icon={faDownload} /> {t.exportData}
          </button>
          <button className="control-button">
            <FontAwesomeIcon icon={faFilter} /> {t.filterData}
          </button>
          <button className="add-button">{t.addNewUser}</button>
        </div>
      </div>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t.id}</th>
              <th>{t.name}</th>
              <th>{t.email}</th>
              <th>{t.role}</th>
              <th>{t.bloodType}</th>
              <th>{t.location}</th>
              <th>{t.status}</th>
              <th>{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.bloodType}</td>
                <td>{user.location}</td>
                <td>
                  <span className={`status-badge ${user.status.toLowerCase()}`}>
                    {user.status}
                  </span>
                </td>
                <td className="actions">
                  <button 
                    className="action-btn edit"
                    onClick={() => handleUserAction('edit', user.id)}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button 
                    className="action-btn delete"
                    onClick={() => handleUserAction('delete', user.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render donations management
  const renderDonations = () => (
    <div className="admin-donations">
      <h2>{t.donationManagement}</h2>
      
      <div className="controls">
        <div className="search-container">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input 
            type="text" 
            placeholder={t.searchDonations} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="action-buttons">
          <button className="control-button" onClick={() => exportToCSV(donations, 'donations')}>
            <FontAwesomeIcon icon={faDownload} /> {t.exportData}
          </button>
          <button className="control-button">
            <FontAwesomeIcon icon={faFilter} /> {t.filterData}
          </button>
        </div>
      </div>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t.id}</th>
              <th>{t.donorName}</th>
              <th>{t.bloodType}</th>
              <th>{t.date}</th>
              <th>{t.location}</th>
              <th>{t.status}</th>
              <th>{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {filteredDonations.map(donation => (
              <tr key={donation.id}>
                <td>{donation.id}</td>
                <td>{donation.donorName}</td>
                <td>{donation.bloodType}</td>
                <td>{donation.date}</td>
                <td>{donation.location}</td>
                <td>
                  <span className={`status-badge ${donation.status.toLowerCase()}`}>
                    {donation.status}
                  </span>
                </td>
                <td className="actions">
                  {donation.status === 'Pending' && (
                    <>
                      <button 
                        className="action-btn approve"
                        onClick={() => handleDonationAction('approve', donation.id)}
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                      <button 
                        className="action-btn reject"
                        onClick={() => handleDonationAction('reject', donation.id)}
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </>
                  )}
                  {donation.status !== 'Pending' && (
                    <button 
                      className="action-btn edit"
                      onClick={() => console.log(`View donation details for ID: ${donation.id}`)}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render content management
  const renderContent = () => (
    <div className="admin-content">
      <h2>{t.contentManagement}</h2>
      
      <div className="content-grid">
        <div className="content-card">
          <div className="content-header">
            <h3>{t.homepageBanner}</h3>
            <div className="content-actions">
              <button className="action-btn edit">
                <FontAwesomeIcon icon={faEdit} />
              </button>
            </div>
          </div>
          <div className="content-preview">
            <img src="https://via.placeholder.com/400x150?text=Homepage+Banner" alt="Homepage Banner" />
          </div>
        </div>
        
        <div className="content-card">
          <div className="content-header">
            <h3>{t.announcements}</h3>
            <div className="content-actions">
              <button className="action-btn edit">
                <FontAwesomeIcon icon={faEdit} />
              </button>
            </div>
          </div>
          <div className="content-text">
            <p><strong>{t.urgentNeed}</strong><br />
            {t.urgentNeedDesc}</p>
          </div>
        </div>
        
        <div className="content-card">
          <div className="content-header">
            <h3>{t.aboutUsPage}</h3>
            <div className="content-actions">
              <button className="action-btn edit">
                <FontAwesomeIcon icon={faEdit} />
              </button>
            </div>
          </div>
          <div className="content-text">
            <p>{t.aboutUsDesc}</p>
          </div>
        </div>
        
        <div className="content-card">
          <div className="content-header">
            <h3>{t.contactInformation}</h3>
            <div className="content-actions">
              <button className="action-btn edit">
                <FontAwesomeIcon icon={faEdit} />
              </button>
            </div>
          </div>
          <div className="content-text">
            <p>
              Email: contact@redhope.org<br />
              Phone: (123) 456-7890<br />
              Address: 123 Health Street, Medical City
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render settings
  const renderSettings = () => (
    <div className="admin-settings">
      <h2>{t.systemSettings}</h2>
      
      <div className="settings-grid">
        <div className="settings-card">
          <h3>{t.adminAccounts}</h3>
          <p>{t.adminAccountsDesc}</p>
          <button className="settings-btn">{t.manageAdmins}</button>
        </div>
        
        <div className="settings-card">
          <h3>{t.notificationSettings}</h3>
          <p>{t.notificationSettingsDesc}</p>
          <button className="settings-btn">{t.configure}</button>
        </div>
        
        <div className="settings-card">
          <h3>{t.systemBackup}</h3>
          <p>{t.systemBackupDesc}</p>
          <button className="settings-btn">{t.backupNow}</button>
        </div>
        
        <div className="settings-card">
          <h3>{t.apiIntegration}</h3>
          <p>{t.apiIntegrationDesc}</p>
          <button className="settings-btn">{t.viewAPIs}</button>
        </div>
      </div>
      
      <div className="system-info">
        <h3>{t.systemInformation}</h3>
        <div className="info-item">
          <span className="info-label">{t.version}:</span>
          <span className="info-value">RedHope v1.2.5</span>
        </div>
        <div className="info-item">
          <span className="info-label">{t.lastUpdate}:</span>
          <span className="info-value">October 15, 2023</span>
        </div>
        <div className="info-item">
          <span className="info-label">{t.databaseStatus}:</span>
          <span className="info-value">{t.connected}</span>
        </div>
        <div className="info-item">
          <span className="info-label">{t.serverStatus}:</span>
          <span className="info-value">{t.online}</span>
        </div>
      </div>
    </div>
  );

  if (!isAdmin) {
    return (
      <>
        <Navbar />
        <div className="admin-unauthorized">
          <h2>{t.unauthorizedAccess}</h2>
          <p>{t.noPermission}</p>
          <button onClick={() => navigate('/')}>{t.returnToHome}</button>
        </div>
      </>
    );
  }

  return (
    <div className="admin-wrapper">
      <Navbar />
      <div className="admin-page">
        <div className="admin-container">
          <div className="admin-sidebar">
            <div className="admin-profile">
              <div className="admin-avatar">
                <FontAwesomeIcon icon={faUserShield} />
              </div>
              <div className="admin-info">
                <h3>Admin User</h3>
                <p>{t.superAdministrator}</p>
              </div>
            </div>
            
            <ul className="admin-menu">
              <li 
                className={activeTab === 'dashboard' ? 'active' : ''} 
                onClick={() => setActiveTab('dashboard')}
              >
                <FontAwesomeIcon icon={faChartLine} />
                <span>{t.dashboard}</span>
              </li>
              <li 
                className={activeTab === 'users' ? 'active' : ''} 
                onClick={() => setActiveTab('users')}
              >
                <FontAwesomeIcon icon={faUsers} />
                <span>{t.userManagement}</span>
              </li>
              <li 
                className={activeTab === 'donations' ? 'active' : ''} 
                onClick={() => setActiveTab('donations')}
              >
                <FontAwesomeIcon icon={faTint} />
                <span>{t.donations}</span>
              </li>
              <li 
                className={activeTab === 'content' ? 'active' : ''} 
                onClick={() => setActiveTab('content')}
              >
                <FontAwesomeIcon icon={faNewspaper} />
                <span>{t.content}</span>
              </li>
              <li 
                className={activeTab === 'settings' ? 'active' : ''} 
                onClick={() => setActiveTab('settings')}
              >
                <FontAwesomeIcon icon={faCog} />
                <span>{t.settings}</span>
              </li>
            </ul>
          </div>
          
          <div className="admin-content-area">
            {loading ? (
              <div className="admin-loading">
                <div className="spinner"></div>
                <p>{t.loadingData}</p>
              </div>
            ) : (
              <>
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'users' && renderUsers()}
                {activeTab === 'donations' && renderDonations()}
                {activeTab === 'content' && renderContent()}
                {activeTab === 'settings' && renderSettings()}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
