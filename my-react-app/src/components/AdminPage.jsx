import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faTint, faNewspaper, faCog, faBell,
  faSearch, faEdit, faTrash, faCheck, faTimes,
  faChartLine, faUserShield, faCalendarAlt, faMapMarkerAlt,
  faDownload, faFilter, faLanguage, faMoon, faSun,
  faExclamationTriangle, faUserPlus, faServer, faDatabase
} from '@fortawesome/free-solid-svg-icons';
import Navbar from './Navbar';
import '../styles/AdminPage.css';
import axios from 'axios';
import { API_BASE_URL } from '../config';

// --- Constants ---
const ITEMS_PER_PAGE = 10;
const DEBOUNCE_DELAY = 500;

const ROLES = {
  USER: 'user',
  DONOR: 'donor',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
};

const STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const BLOOD_SUPPLY_STATUS = {
  STABLE: 'stable',
  LOW: 'low',
  CRITICAL: 'critical',
};

const MODAL_TYPE = {
  USER: 'user',
  ADMIN: 'admin',
};

const INITIAL_USER_FORM_DATA = {
  username: '',
  email: '',
  role: ROLES.USER,
  bloodType: '',
  isDonor: false,
  isActive: true,
};

const INITIAL_ADMIN_FORM_DATA = {
  username: '',
  email: '',
  role: ROLES.ADMIN,
  permissions: {
    manageUsers: true,
    manageDonations: true,
    manageContent: true,
    manageSettings: false,
  },
};

// --- Helper Components (Internal) ---
const EmptyStateMessage = ({ type, message, icon = faExclamationTriangle }) => (
  <div className="no-data-message error">
    <FontAwesomeIcon icon={icon} size="2x" />
    <p>{message || `Unable to retrieve ${type} data. Please check connection.`}</p>
  </div>
);

const LoadingIndicator = ({ message }) => (
  <div className="admin-loading">
    <div className="spinner"></div>
    <p>{message}</p>
  </div>
);

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous Page">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
        </svg>
      </button>
      <span className="page-info">Page {currentPage} of {totalPages}</span>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Next Page">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
        </svg>
      </button>
    </div>
  );
};

const ActionButton = ({ type, onClick, title }) => {
  const icons = { edit: faEdit, delete: faTrash, approve: faCheck, reject: faTimes };
  return (
    <button className={`action-btn ${type}`} onClick={onClick} title={title || type}>
      <FontAwesomeIcon icon={icons[type]} />
    </button>
  );
};

const StatusBadge = ({ status, isDonor }) => {
  let badgeClass = (status || '').toLowerCase();
  let text = status;

  if (typeof isDonor !== 'undefined') {
    badgeClass = isDonor ? 'active' : 'cancelled'; // Reusing styles
    text = isDonor ? 'Donor' : 'Non-Donor';
  }

  return <span className={`status-badge ${badgeClass}`}>{text}</span>;
};

// --- Main Component ---
const AdminPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAdmin, setIsAdmin] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');
  const [isDarkMode, setIsDarkMode] = useState(() => document.body.classList.contains('dark-theme'));

  // Data States
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [donations, setDonations] = useState([]);
  const [adminAccounts, setAdminAccounts] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonors: 0,
    totalDonations: 0,
    pendingRequests: 0,
    bloodSupply: {},
    bloodSupplyUnavailable: false,
  });

  // UI States
  const [loadingStates, setLoadingStates] = useState({
    global: true, // For initial admin check
    dashboard: false,
    users: false,
    donations: false,
    admins: false,
    action: false, // For specific actions like delete/update/create
  });
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageInfo, setPageInfo] = useState({
    users: { page: 1, totalPages: 1, totalItems: 0 },
    donations: { page: 1, totalPages: 1, totalItems: 0 },
  });

  // Modal State
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null, // 'user' or 'admin'
    data: null, // user or admin object for editing
  });
  const [userFormData, setUserFormData] = useState(INITIAL_USER_FORM_DATA);
  const [adminFormData, setAdminFormData] = useState(INITIAL_ADMIN_FORM_DATA);

  // --- Translations ---
  const translations = useMemo(() => ({
    en: {
      dashboard: 'Dashboard',
      dashboardOverview: 'Dashboard Overview',
      userManagement: 'User Management',
      adminManagement: 'Admin Management',
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
      totalDonors: 'Total Donors',
      recentActivity: 'Recent Activity',
      bloodTypeAvailability: 'Blood Type Availability',
      available: 'Available',
      low: 'Low',
      critical: 'Critical',
      searchUsers: 'Search users...',
      searchDonations: 'Search donations...',
      addNewUser: 'Add New User',
      addNewAdmin: 'Add New Admin',
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
      adminAccountsManagement: 'Admin Accounts Management',
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
      noBloodSupplyData: 'No blood supply data available',
    },
    fr: {
      dashboard: 'Tableau de bord',
      dashboardOverview: 'Aperçu du tableau de bord',
      userManagement: 'Gestion des utilisateurs',
      adminManagement: 'Gestion des Administrateurs',
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
      totalDonors: 'Donneurs totaux',
      recentActivity: 'Activité récente',
      bloodTypeAvailability: 'Disponibilité des groupes sanguins',
      available: 'Disponible',
      low: 'Faible',
      critical: 'Critique',
      searchUsers: 'Rechercher des utilisateurs...',
      searchDonations: 'Rechercher des dons...',
      addNewUser: 'Ajouter un nouvel utilisateur',
      addNewAdmin: 'Ajouter un Admin',
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
      adminAccountsManagement: 'Gestion des Comptes Administrateurs',
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
      noBloodSupplyData: 'Aucune donnée sur l\'approvisionnement en sang disponible',
    }
  }), [language]); // Only depends on language

  const t = useMemo(() => translations[language], [translations, language]);

  // --- Helper Functions ---
  const setLoading = useCallback((key, value) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleApiError = useCallback((operation, error) => {
    const errorMessage = `Failed to ${operation}: ${error?.response?.data?.message || error?.message || 'Unknown error'}`;
    console.error(errorMessage, error);
    setError(errorMessage);
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, []);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  }, []);

  // --- API Fetching Functions ---
  const fetchBloodSupply = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/stats/blood-types`, getAuthHeaders());
      if (response.data?.success) {
        const bloodData = response.data.data?.bloodTypes || {};
        const supply = {};
        Object.entries(bloodData).forEach(([type, count]) => {
          if (count >= 10) supply[type] = BLOOD_SUPPLY_STATUS.STABLE;
          else if (count >= 5) supply[type] = BLOOD_SUPPLY_STATUS.LOW;
          else supply[type] = BLOOD_SUPPLY_STATUS.CRITICAL;
        });
        setStats(prev => ({ ...prev, bloodSupply: supply, bloodSupplyUnavailable: false }));
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      handleApiError('retrieve blood supply', err);
      setStats(prev => ({ ...prev, bloodSupply: {}, bloodSupplyUnavailable: true }));
    }
  }, [getAuthHeaders, handleApiError]);

  const fetchStatsFromDatabase = useCallback(async () => {
    try {
      const mockUsers = [
        { _id: 1, username: 'John Doe', email: 'john@example.com', role: 'Donor', bloodType: 'A+', status: 'Active', location: 'New York', isDonor: true },
        { _id: 2, username: 'Jane Smith', email: 'jane@example.com', role: 'Recipient', bloodType: 'O-', status: 'Active', location: 'Los Angeles', isDonor: false },
        { _id: 3, username: 'Robert Johnson', email: 'robert@example.com', role: 'Donor', bloodType: 'B+', status: 'Inactive', location: 'Chicago', isDonor: true },
        { _id: 4, username: 'Sarah Williams', email: 'sarah@example.com', role: 'Admin', bloodType: 'AB+', status: 'Active', location: 'Miami', isDonor: false },
        { _id: 5, username: 'Michael Brown', email: 'michael@example.com', role: 'Donor', bloodType: 'A-', status: 'Active', location: 'Seattle', isDonor: true },
        { _id: 6, username: 'Emily Davis', email: 'emily@example.com', role: 'Donor', bloodType: 'O+', status: 'Active', location: 'Boston', isDonor: true }
      ];

      try {
        const userResponse = await axios.get(`${API_BASE_URL}/api/user/all`, getAuthHeaders());
        const usersData = userResponse.data.users || [];

        if (usersData.length > 0) {
          setStats(prev => ({
            ...prev,
            totalUsers: usersData.length,
            totalDonors: usersData.filter(u => u.isDonor === true).length,
          }));
          setUsers(usersData.map(user => ({
            _id: user._id || user.id,
            username: user.username || user.name,
            email: user.email,
            role: user.role || 'user',
            bloodType: user.bloodType || 'N/A',
            status: user.isActive !== false ? 'Active' : 'Inactive',
            location: user.location || 'N/A',
            isDonor: Boolean(user.isDonor)
          })));
        } else {
          throw new Error("No users found in API response for fallback");
        }
      } catch (apiError) {
        console.warn("Fallback user fetch failed, using mock data:", apiError);
        setStats(prev => ({
          ...prev,
          totalUsers: mockUsers.length,
          totalDonors: mockUsers.filter(u => u.isDonor === true).length,
        }));
        setUsers(mockUsers);
      }

      try {
        const donationsResponse = await axios.get(`${API_BASE_URL}/api/donations`, getAuthHeaders());
        if (donationsResponse.data?.donations) {
          const donationsData = donationsResponse.data.donations;
          setStats(prev => ({
            ...prev,
            totalDonations: donationsData.length,
            pendingRequests: donationsData.filter(d => d.status === STATUS.PENDING).length
          }));
          setDonations(donationsData);
        } else {
          setStats(prev => ({ ...prev, totalDonations: 0, pendingRequests: 0 }));
          setDonations([]);
        }
      } catch (donationError) {
        handleApiError('retrieve fallback donation stats', donationError);
        setStats(prev => ({ ...prev, totalDonations: 0, pendingRequests: 0 }));
        setDonations([]);
      }
    } catch (err) {
      handleApiError('retrieve fallback user/stats data', err);
      const mockUsers = [
        { _id: 1, username: 'John Doe', email: 'john@example.com', role: 'Donor', bloodType: 'A+', status: 'Active', location: 'New York', isDonor: true },
        { _id: 2, username: 'Jane Smith', email: 'jane@example.com', role: 'Recipient', bloodType: 'O-', status: 'Active', location: 'Los Angeles', isDonor: false },
      ];
      setUsers(mockUsers);
      setStats({
        totalUsers: mockUsers.length,
        totalDonors: mockUsers.filter(u => u.isDonor === true).length,
        totalDonations: 8,
        pendingRequests: 3,
        bloodSupply: {},
        bloodSupplyUnavailable: true,
      });
      setDonations([]);
    }
  }, [getAuthHeaders, handleApiError]);

  const fetchStats = useCallback(async () => {
    setLoading('dashboard', true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/stats/dashboard`, getAuthHeaders());
      if (response.data?.success) {
        setStats(prev => ({ ...prev, ...response.data.stats, bloodSupplyUnavailable: false }));
      } else {
        console.warn('Primary stats fetch failed, attempting fallback.');
        await fetchStatsFromDatabase();
      }
      await fetchBloodSupply();
    } catch (err) {
      handleApiError('retrieve dashboard statistics', err);
      try {
        await fetchStatsFromDatabase();
      } catch (fallbackErr) {
        console.error('Fallback stats fetch also failed:', fallbackErr);
      }
    } finally {
      setLoading('dashboard', false);
    }
  }, [getAuthHeaders, handleApiError, fetchBloodSupply, fetchStatsFromDatabase, setLoading]);

  const fetchAllUsers = useCallback(async () => {
    setLoading('users', true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/user/all`, {
        ...getAuthHeaders(),
      });

      const responseData = response.data || {};
      const userData = responseData.users || [];

      const normalizedUsers = userData.map(user => ({
        _id: user._id || user.id,
        username: user.username || user.name || 'Unknown',
        email: user.email || 'No email',
        role: user.role || ROLES.USER,
        bloodType: user.bloodType || 'N/A',
        location: user.location || 'N/A',
        isDonor: Boolean(user.isDonor),
        isActive: user.isActive !== false,
      }));

      setAllUsers(normalizedUsers);

    } catch (err) {
      handleApiError('retrieve all users', err);
      setAllUsers([]);
    } finally {
      setLoading('users', false);
    }
  }, [getAuthHeaders, handleApiError, setLoading]);

  const filteredAndPaginatedUsers = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();

    const filtered = allUsers.filter(user =>
      (user.username?.toLowerCase() || '').includes(lowerSearchTerm) ||
      (user.email?.toLowerCase() || '').includes(lowerSearchTerm) ||
      (user._id?.toLowerCase() || '').includes(lowerSearchTerm)
    );

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const currentPage = Math.max(1, Math.min(pageInfo.users.page, totalPages));

    const calculatedPageInfo = {
      page: currentPage,
      totalPages: totalPages,
      totalItems: totalItems
    };

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginated = filtered.slice(startIndex, endIndex);

    return { paginatedUsers: paginated, calculatedPageInfo };

  }, [allUsers, searchTerm, pageInfo.users.page]);

  useEffect(() => {
    setUsers(filteredAndPaginatedUsers.paginatedUsers);
    if (pageInfo.users.page !== filteredAndPaginatedUsers.calculatedPageInfo.page ||
      pageInfo.users.totalPages !== filteredAndPaginatedUsers.calculatedPageInfo.totalPages ||
      pageInfo.users.totalItems !== filteredAndPaginatedUsers.calculatedPageInfo.totalItems) {
      setPageInfo(prev => ({
        ...prev,
        users: filteredAndPaginatedUsers.calculatedPageInfo
      }));
    }
  }, [filteredAndPaginatedUsers, pageInfo.users]);

  const fetchDonations = useCallback(async (page = 1, limit = ITEMS_PER_PAGE, searchQuery = '') => {
    setLoading('donations', true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/donations`, {
        ...getAuthHeaders(),
        params: { page, limit, search: searchQuery }
      });
      setDonations(response.data?.donations || []);
      setPageInfo(prev => ({
        ...prev,
        donations: {
          page: response.data?.page || page,
          totalPages: response.data?.totalPages || 1,
          totalItems: response.data?.totalItems || 0
        }
      }));
    } catch (err) {
      handleApiError('retrieve donations', err);
      setDonations([]);
      setPageInfo(prev => ({ ...prev, donations: { page: 1, totalPages: 1, totalItems: 0 } }));
    } finally {
      setLoading('donations', false);
    }
  }, [getAuthHeaders, handleApiError, setLoading]);

  const fetchAdminAccounts = useCallback(async () => {
    setLoading('admins', true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/accounts`, getAuthHeaders());
      if (response.data?.success) {
        const adminData = response.data.admins || [];
        const normalizedAdmins = adminData.map(admin => ({
          id: admin.id || admin._id,
          username: admin.username || 'Unknown Admin',
          email: admin.email || 'No email',
          role: admin.role || ROLES.ADMIN,
          permissions: admin.permissions || { ...INITIAL_ADMIN_FORM_DATA.permissions, manageSettings: admin.role === ROLES.SUPERADMIN },
          lastLogin: admin.lastLogin || null,
          isActive: admin.isActive !== false,
        }));
        setAdminAccounts(normalizedAdmins);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      handleApiError('retrieve admin accounts', err);
      setAdminAccounts([]);
    } finally {
      setLoading('admins', false);
    }
  }, [getAuthHeaders, handleApiError, setLoading]);

  // --- CRUD Operations ---
  const createUser = useCallback(async (userData) => {
    setLoading('action', true);
    setError(null);
    try {
      await axios.post(`${API_BASE_URL}/api/user/create`, userData, getAuthHeaders());
      alert('User created successfully!');
      await fetchAllUsers();
      setPageInfo(prev => ({ ...prev, users: { ...prev.users, page: 1 } }));
      return true;
    } catch (err) {
      handleApiError('create user', err);
      return false;
    } finally {
      setLoading('action', false);
    }
  }, [getAuthHeaders, handleApiError, fetchAllUsers, setLoading]);

  const updateUser = useCallback(async (userId, userData) => {
    setLoading('action', true);
    setError(null);
    try {
      await axios.put(`${API_BASE_URL}/api/user/${userId}`, userData, getAuthHeaders());
      alert('User updated successfully!');
      await fetchAllUsers();
      return true;
    } catch (err) {
      handleApiError('update user', err);
      return false;
    } finally {
      setLoading('action', false);
    }
  }, [getAuthHeaders, handleApiError, fetchAllUsers, setLoading]);

  const deleteUser = useCallback(async (userId, username) => {
    if (window.confirm(`Are you sure you want to delete user: ${username}?`)) {
      setLoading('action', true);
      setError(null);
      try {
        await axios.delete(`${API_BASE_URL}/api/user/${userId}`, getAuthHeaders());
        alert('User deleted successfully!');
        await fetchAllUsers();
      } catch (err) {
        handleApiError('delete user', err);
      } finally {
        setLoading('action', false);
      }
    }
  }, [getAuthHeaders, handleApiError, fetchAllUsers, setLoading]);

  const updateDonationStatus = useCallback(async (donationId, status) => {
    setLoading('action', true);
    setError(null);
    try {
      await axios.put(`${API_BASE_URL}/api/donations/${donationId}/status`, { status }, getAuthHeaders());
      fetchDonations(pageInfo.donations.page, ITEMS_PER_PAGE, searchTerm);
    } catch (err) {
      handleApiError(`update donation status to ${status}`, err);
    } finally {
      setLoading('action', false);
    }
  }, [getAuthHeaders, handleApiError, fetchDonations, setLoading, pageInfo.donations.page, searchTerm]);

  const createAdmin = useCallback(async (data) => {
    setLoading('action', true);
    console.log("Mock Create Admin:", data);
    await new Promise(resolve => setTimeout(resolve, 500));
    const newAdmin = {
      id: `mock-${Date.now()}`,
      ...data,
      lastLogin: null,
      isActive: true,
    };
    setAdminAccounts(prev => [...prev, newAdmin]);
    alert('Admin account created successfully (mock)!');
    setLoading('action', false);
    return true;
  }, [setLoading]);

  const updateAdmin = useCallback(async (adminId, data) => {
    setLoading('action', true);
    console.log("Mock Update Admin:", adminId, data);
    await new Promise(resolve => setTimeout(resolve, 500));
    setAdminAccounts(prev => prev.map(admin =>
      admin.id === adminId ? { ...admin, ...data } : admin
    ));
    alert('Admin account updated successfully (mock)!');
    setLoading('action', false);
    return true;
  }, [setLoading]);

  const deleteAdmin = useCallback(async (adminId, username) => {
    if (window.confirm(`Are you sure you want to delete admin: ${username}?`)) {
      setLoading('action', true);
      console.log("Mock Delete Admin:", adminId);
      await new Promise(resolve => setTimeout(resolve, 500));
      setAdminAccounts(prev => prev.filter(admin => admin.id !== adminId));
      alert('Admin account deleted successfully (mock)!');
      setLoading('action', false);
    }
  }, [setLoading]);

  // --- Effects ---
  useEffect(() => {
    const checkAdminStatus = async () => {
      setLoading('global', true);
      const token = localStorage.getItem('token');
      const isAdminStored = localStorage.getItem('isAdmin') === 'true';

      if (!token) {
        navigate('/login');
        return;
      }

      let adminVerified = isAdminStored;
      if (!isAdminStored) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/admin/verify`, { headers: { Authorization: `Bearer ${token}` } });
          if (response.data?.success) {
            localStorage.setItem('isAdmin', 'true');
            localStorage.setItem('userRole', response.data.role || ROLES.ADMIN);
            adminVerified = true;
          } else {
            throw new Error('Not authorized');
          }
        } catch (err) {
          console.error('Admin verification failed:', err);
          localStorage.removeItem('isAdmin');
          localStorage.removeItem('userRole');
          navigate('/login');
          return;
        }
      }

      setIsAdmin(adminVerified);
      if (adminVerified) {
        fetchStats();
      }
      setLoading('global', false);
    };

    checkAdminStatus();

    const darkModeEnabled = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(darkModeEnabled);
    document.body.classList.toggle('dark-theme', darkModeEnabled);
  }, [navigate, fetchStats, setLoading]);

  useEffect(() => {
    if (isAdmin) {
      if (['users', 'donations', 'adminManagement'].includes(activeTab)) {
        setSearchTerm('');
        if (activeTab === 'users') {
          setPageInfo(prev => ({ ...prev, users: { ...prev.users, page: 1 } }));
        }
      }

      switch (activeTab) {
        case 'dashboard':
          fetchStats();
          break;
        case 'users':
          fetchAllUsers();
          break;
        case 'donations':
          fetchDonations(1, ITEMS_PER_PAGE, '');
          break;
        case 'adminManagement':
          fetchAdminAccounts();
          break;
        default:
          break;
      }
    }
  }, [activeTab, isAdmin, fetchStats, fetchAllUsers, fetchDonations, fetchAdminAccounts]);

  useEffect(() => {
    if (!loadingStates.global && isAdmin) {
      const handler = setTimeout(() => {
        if (activeTab === 'donations') {
          fetchDonations(1, ITEMS_PER_PAGE, searchTerm);
        }
      }, DEBOUNCE_DELAY);

      if (activeTab === 'users') {
        setPageInfo(prev => ({ ...prev, users: { ...prev.users, page: 1 } }));
      }

      return () => clearTimeout(handler);
    }
  }, [searchTerm, activeTab, isAdmin, loadingStates.global, fetchDonations]);

  // --- Event Handlers ---
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
    if (activeTab === 'users') {
      setPageInfo(prev => ({ ...prev, users: { ...prev.users, page: 1 } }));
    }
  }, [activeTab]);

  const handlePageChange = useCallback((type, newPage) => {
    if (type === 'users') {
      setPageInfo(prev => ({ ...prev, users: { ...prev.users, page: newPage } }));
    } else if (type === 'donations') {
      fetchDonations(newPage, ITEMS_PER_PAGE, searchTerm);
    }
  }, [fetchDonations, searchTerm]);

  const openModal = useCallback((type, data = null) => {
    setError(null);
    setModalState({ isOpen: true, type, data });
    if (type === MODAL_TYPE.USER) {
      setUserFormData(data ? {
        username: data.username,
        email: data.email,
        role: data.role,
        bloodType: data.bloodType || '',
        isDonor: data.isDonor || false,
        isActive: data.isActive !== false,
      } : INITIAL_USER_FORM_DATA);
    } else if (type === MODAL_TYPE.ADMIN) {
      setAdminFormData(data ? {
        username: data.username,
        email: data.email,
        role: data.role,
        permissions: { ...INITIAL_ADMIN_FORM_DATA.permissions, ...data.permissions },
      } : INITIAL_ADMIN_FORM_DATA);
    }
  }, []);

  const closeModal = useCallback(() => {
    setModalState({ isOpen: false, type: null, data: null });
    setUserFormData(INITIAL_USER_FORM_DATA);
    setAdminFormData(INITIAL_ADMIN_FORM_DATA);
  }, []);

  const handleUserFormChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setUserFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);

  const handleAdminFormChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('permission_')) {
      const permission = name.replace('permission_', '');
      setAdminFormData(prev => ({
        ...prev,
        permissions: { ...prev.permissions, [permission]: checked }
      }));
    } else {
      setAdminFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  }, []);

  const handleUserSubmit = useCallback(async (e) => {
    e.preventDefault();
    let success = false;
    if (modalState.data) {
      success = await updateUser(modalState.data._id, userFormData);
    } else {
      success = await createUser(userFormData);
    }
    if (success) {
      closeModal();
    }
  }, [modalState.data, userFormData, updateUser, createUser, closeModal]);

  const handleAdminSubmit = useCallback(async (e) => {
    e.preventDefault();
    let success = false;
    if (modalState.data) {
      success = await updateAdmin(modalState.data.id, adminFormData);
    } else {
      success = await createAdmin(adminFormData);
    }
    if (success) {
      closeModal();
    }
  }, [modalState.data, adminFormData, updateAdmin, createAdmin, closeModal]);

  const exportToCSV = useCallback(async (type) => {
    let endpoint, filename;
    if (type === 'users') {
      endpoint = '/user/export';
      filename = 'users-export.csv';
    } else if (type === 'donations') {
      endpoint = '/donations/export';
      filename = 'donations-export.csv';
    } else {
      handleApiError('export data', new Error('Invalid export type'));
      return;
    }

    setLoading('action', true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api${endpoint}`, {
        ...getAuthHeaders(),
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      handleApiError(`export ${type} data`, err);
    } finally {
      setLoading('action', false);
    }
  }, [getAuthHeaders, handleApiError, setLoading]);

  // --- Render Functions ---
  const renderDashboard = useCallback(() => {
    return (
      <div className="admin-dashboard">
        <h2>{t.dashboardOverview}</h2>
        {loadingStates.dashboard ? (
          <LoadingIndicator message={t.loadingData} />
        ) : (
          <>
            <div className="dashboard-metrics">
              <div className="metric-card">
                <div className="metric-icon"><FontAwesomeIcon icon={faUsers} /></div>
                <div className="metric-data"><h3>{t.totalUsers}</h3><p>{stats.totalUsers}</p></div>
              </div>
              <div className="metric-card">
                <div className="metric-icon"><FontAwesomeIcon icon={faUserShield} /></div>
                <div className="metric-data"><h3>{t.totalDonors}</h3><p>{stats.totalDonors}</p></div>
              </div>
              <div className="metric-card">
                <div className="metric-icon"><FontAwesomeIcon icon={faTint} /></div>
                <div className="metric-data"><h3>{t.totalDonations}</h3><p>{stats.totalDonations}</p></div>
              </div>
              <div className="metric-card">
                <div className="metric-icon"><FontAwesomeIcon icon={faBell} /></div>
                <div className="metric-data"><h3>{t.pendingRequests}</h3><p>{stats.pendingRequests}</p></div>
              </div>
            </div>

            <div className="blood-supply-section">
              <h3>{t.bloodTypeAvailability}</h3>
              <div className="blood-types-grid">
                {stats.bloodSupplyUnavailable ? (
                  <div className="blood-supply-unavailable">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <p>{t.noBloodSupplyData}</p>
                  </div>
                ) : Object.keys(stats.bloodSupply || {}).length > 0 ? (
                  Object.entries(stats.bloodSupply).map(([type, status]) => (
                    <div key={type} className={`blood-type-card ${status}`}>
                      <h4>{type}</h4>
                      <span>{t[status] || status}</span>
                    </div>
                  ))
                ) : (
                  <div className="no-blood-data">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <p>{t.noBloodSupplyData}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="recent-activity-section">
              <h3>{t.recentActivity}</h3>
              <div className="activity-list">
                <div className="activity-item">
                  <span className="activity-time">{new Date().toLocaleTimeString()} - {new Date().toLocaleDateString()}</span>
                  <span className="activity-desc">Admin logged in</span>
                </div>
                <div className="activity-item">
                  <span className="activity-time">{new Date().toLocaleTimeString()} - {new Date().toLocaleDateString()}</span>
                  <span className="activity-desc">System stats updated</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }, [t, stats, loadingStates.dashboard]);

  const renderUsers = useCallback(() => {
    const displayUsers = filteredAndPaginatedUsers.paginatedUsers;
    const currentPageInfo = filteredAndPaginatedUsers.calculatedPageInfo;

    return (
      <div className="admin-users">
        <h2>{t.userManagement}</h2>
        <div className="controls">
          <div className="search-container">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input type="text" placeholder={t.searchUsers} value={searchTerm} onChange={handleSearchChange} />
          </div>
          <div className="action-buttons">
            <button className="control-button" onClick={() => exportToCSV('users')} disabled={loadingStates.action}>
              <FontAwesomeIcon icon={faDownload} /> {loadingStates.action ? 'Exporting...' : t.exportData}
            </button>
            <button className="add-button" onClick={() => openModal(MODAL_TYPE.USER)}>
              <FontAwesomeIcon icon={faUserPlus} /> {t.addNewUser}
            </button>
          </div>
        </div>

        <div className="table-container">
          {loadingStates.users && allUsers.length === 0 ? (
            <LoadingIndicator message={t.loadingData} />
          ) : displayUsers.length === 0 ? (
            <EmptyStateMessage type="user" message={searchTerm ? 'No users match search.' : (allUsers.length === 0 ? 'No users found.' : 'No users match search.')} />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.id}</th>
                  <th>{t.name}</th>
                  <th>{t.email}</th>
                  <th>{t.bloodType}</th>
                  <th>{t.location}</th>
                  <th>{t.status}</th>
                  <th>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {displayUsers.map(user => (
                  <tr key={user._id}>
                    <td>{user._id.slice(-6)}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.bloodType}</td>
                    <td>{user.location}</td>
                    <td><StatusBadge isDonor={user.isDonor} /></td>
                    <td className="actions">
                      <ActionButton type="edit" onClick={() => openModal(MODAL_TYPE.USER, user)} />
                      <ActionButton type="delete" onClick={() => deleteUser(user._id, user.username)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination
          currentPage={currentPageInfo.page}
          totalPages={currentPageInfo.totalPages}
          onPageChange={(newPage) => handlePageChange('users', newPage)}
        />
      </div>
    );
  }, [t, filteredAndPaginatedUsers, loadingStates.users, loadingStates.action, searchTerm, allUsers, handleSearchChange, exportToCSV, openModal, deleteUser, handlePageChange]);

  const renderDonations = useCallback(() => {
    return (
      <div className="admin-donations">
        <h2>{t.donationManagement}</h2>
        <div className="controls">
          <div className="search-container">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input type="text" placeholder={t.searchDonations} value={searchTerm} onChange={handleSearchChange} />
          </div>
          <div className="action-buttons">
            <button className="control-button" onClick={() => exportToCSV('donations')} disabled={loadingStates.action}>
              <FontAwesomeIcon icon={faDownload} /> {loadingStates.action ? 'Exporting...' : t.exportData}
            </button>
          </div>
        </div>

        <div className="table-container">
          {loadingStates.donations ? (
            <LoadingIndicator message={t.loadingData} />
          ) : donations.length === 0 ? (
            <EmptyStateMessage type="donation" message={searchTerm ? 'No donations match search.' : 'No donations found.'} />
          ) : (
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
                {donations.map(donation => (
                  <tr key={donation._id}>
                    <td>{donation._id.slice(-6)}</td>
                    <td>{donation.donorName || 'N/A'}</td>
                    <td>{donation.bloodType}</td>
                    <td>{new Date(donation.date).toLocaleDateString()}</td>
                    <td>{donation.location}</td>
                    <td><StatusBadge status={donation.status} /></td>
                    <td className="actions">
                      {donation.status === STATUS.PENDING && (
                        <>
                          <ActionButton type="approve" onClick={() => updateDonationStatus(donation._id, STATUS.COMPLETED)} />
                          <ActionButton type="reject" onClick={() => updateDonationStatus(donation._id, STATUS.CANCELLED)} />
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination
          currentPage={pageInfo.donations.page}
          totalPages={pageInfo.donations.totalPages}
          onPageChange={(newPage) => handlePageChange('donations', newPage)}
        />
      </div>
    );
  }, [t, donations, loadingStates.donations, loadingStates.action, searchTerm, pageInfo.donations, handleSearchChange, exportToCSV, updateDonationStatus, handlePageChange]);

  const renderAdminManagement = useCallback(() => {
    const filteredAdmins = adminAccounts.filter(admin =>
      (admin.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (admin.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="admin-management">
        <h2>{t.adminAccountsManagement}</h2>
        <div className="controls">
          <div className="search-container">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input type="text" placeholder="Search admins..." value={searchTerm} onChange={handleSearchChange} />
          </div>
          <div className="action-buttons">
            <button className="add-button" onClick={() => openModal(MODAL_TYPE.ADMIN)}>
              <FontAwesomeIcon icon={faUserPlus} /> {t.addNewAdmin}
            </button>
          </div>
        </div>

        <div className="table-container">
          {loadingStates.admins ? (
            <LoadingIndicator message={t.loadingData} />
          ) : adminAccounts.length === 0 ? (
            <EmptyStateMessage type="admin account" message="No admin accounts found." />
          ) : filteredAdmins.length === 0 && searchTerm ? (
            <EmptyStateMessage type="admin account" message="No admins match search." />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Permissions</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map(admin => (
                  <tr key={admin.id}>
                    <td>{typeof admin.id === 'string' ? admin.id.slice(-6) : admin.id}</td>
                    <td>{admin.username}</td>
                    <td>{admin.email}</td>
                    <td>
                      <span className={`status-badge ${admin.role === ROLES.SUPERADMIN ? 'active' : ''}`}>
                        {admin.role === ROLES.SUPERADMIN ? 'Super Admin' : 'Admin'}
                      </span>
                    </td>
                    <td>
                      <div className="permission-badges">
                        {admin.permissions.manageUsers && <span title="Users" className="permission-badge">👥</span>}
                        {admin.permissions.manageDonations && <span title="Donations" className="permission-badge">🩸</span>}
                        {admin.permissions.manageContent && <span title="Content" className="permission-badge">📄</span>}
                        {admin.permissions.manageSettings && <span title="Settings" className="permission-badge">⚙️</span>}
                      </div>
                    </td>
                    <td>{admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : 'Never'}</td>
                    <td className="actions">
                      <ActionButton type="edit" onClick={() => openModal(MODAL_TYPE.ADMIN, admin)} />
                      <ActionButton type="delete" onClick={() => deleteAdmin(admin.id, admin.username)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }, [t, adminAccounts, loadingStates.admins, searchTerm, handleSearchChange, openModal, deleteAdmin]);

  const renderContent = useCallback(() => {
    return (
      <div className="admin-content">
        <h2>{t.contentManagement}</h2>
        <div className="content-sections-container">
          <div className="content-section">
            <div className="section-header">
              <div className="section-icon"><FontAwesomeIcon icon={faNewspaper} /></div>
              <div className="section-content">
                <h3>{t.homepageBanner}</h3>
                <div className="content-status published">Published</div>
                <h4>{t.urgentNeed}</h4>
                <p className="content-description">{t.urgentNeedDesc}</p>
                <div className="content-footer">
                  <span className="last-modified">Last modified: {new Date().toLocaleDateString()}</span>
                  <button className="control-button"><FontAwesomeIcon icon={faEdit} /> Edit</button>
                </div>
              </div>
            </div>
          </div>
          <div className="content-section">
            <div className="section-header">
              <div className="section-icon"><FontAwesomeIcon icon={faUsers} /></div>
              <div className="section-content">
                <h3>{t.aboutUsPage}</h3>
                <div className="content-status published">Published</div>
                <h4>About Us</h4>
                <p className="content-description">{t.aboutUsDesc}</p>
                <div className="content-footer">
                  <span className="last-modified">Last modified: {new Date().toLocaleDateString()}</span>
                  <button className="control-button"><FontAwesomeIcon icon={faEdit} /> Edit</button>
                </div>
              </div>
            </div>
          </div>
          <div className="content-section">
            <div className="section-header">
              <div className="section-icon"><FontAwesomeIcon icon={faMapMarkerAlt} /></div>
              <div className="section-content">
                <h3>{t.contactInformation}</h3>
                <div className="content-status published">Published</div>
                <h4>Contact Info</h4>
                <p className="content-description">Address: 123 Main St, Algiers<br />Phone: +213 123 456 789<br />Email: contact@redhope.dz</p>
                <div className="content-footer">
                  <span className="last-modified">Last modified: {new Date().toLocaleDateString()}</span>
                  <button className="control-button"><FontAwesomeIcon icon={faEdit} /> Edit</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [t]);

  const renderSettings = useCallback(() => {
    return (
      <div className="admin-settings">
        <h2>{t.systemSettings}</h2>
        <div className="settings-grid">
          <div className="settings-card">
            <div className="card-content">
              <div className="card-icon"><FontAwesomeIcon icon={faBell} /></div>
              <h3>{t.notificationSettings}</h3>
              <p>{t.notificationSettingsDesc}</p>
              <button className="control-button"><FontAwesomeIcon icon={faCog} /> {t.configure}</button>
            </div>
          </div>
          <div className="settings-card">
            <div className="card-content">
              <div className="card-icon"><FontAwesomeIcon icon={faDatabase} /></div>
              <h3>{t.systemBackup}</h3>
              <p>{t.systemBackupDesc}</p>
              <button className="control-button"><FontAwesomeIcon icon={faDownload} /> {t.backupNow}</button>
            </div>
          </div>
          <div className="settings-card">
            <div className="card-content">
              <div className="card-icon"><FontAwesomeIcon icon={faServer} /></div>
              <h3>{t.apiIntegration}</h3>
              <p>{t.apiIntegrationDesc}</p>
              <button className="control-button"><FontAwesomeIcon icon={faEdit} /> {t.viewAPIs}</button>
            </div>
          </div>
        </div>
        <div className="system-info">
          <h3><FontAwesomeIcon icon={faChartLine} /> {t.systemInformation}</h3>
          <div className="info-grid">
            <div className="info-item"><span className="info-label">{t.version}</span><span className="info-value">1.0.0</span></div>
            <div className="info-item"><span className="info-label">{t.lastUpdate}</span><span className="info-value">{new Date().toLocaleDateString()}</span></div>
            <div className="info-item"><span className="info-label">{t.databaseStatus}</span><span className="info-value status-ok">{t.connected}</span></div>
            <div className="info-item"><span className="info-label">{t.serverStatus}</span><span className="info-value status-ok">{t.online}</span></div>
          </div>
        </div>
      </div>
    );
  }, [t]);

  const ModalWrapper = ({ title, isOpen, onClose, onSubmit, children, isSubmitting }) => {
    if (!isOpen) return null;
    return (
      <div className="modal-overlay">
        <div className="user-modal">
          <div className="modal-header">
            <h3>{title}</h3>
            <button className="close-btn" onClick={onClose} disabled={isSubmitting}>×</button>
          </div>
          <form onSubmit={onSubmit}>
            <div className="modal-body">{children}</div>
            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>Cancel</button>
              <button type="submit" className="btn-save" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (modalState.data ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const FormGroup = ({ label, htmlFor, children }) => (
    <div className="form-group">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
  const CheckboxGroup = ({ label, name, checked, onChange }) => (
    <div className="form-group checkbox-group">
      <label>
        <input type="checkbox" name={name} checked={checked} onChange={onChange} /> {label}
      </label>
    </div>
  );

  const UserModal = useCallback(() => (
    <ModalWrapper
      title={modalState.data ? `Edit User: ${modalState.data.username}` : t.addNewUser}
      isOpen={modalState.isOpen && modalState.type === MODAL_TYPE.USER}
      onClose={closeModal}
      onSubmit={handleUserSubmit}
      isSubmitting={loadingStates.action}
    >
      <FormGroup label="Username" htmlFor="username">
        <input type="text" id="username" name="username" value={userFormData.username} onChange={handleUserFormChange} required />
      </FormGroup>
      <FormGroup label="Email" htmlFor="email">
        <input type="email" id="email" name="email" value={userFormData.email} onChange={handleUserFormChange} required />
      </FormGroup>
      <FormGroup label="Role" htmlFor="role">
        <select id="role" name="role" value={userFormData.role} onChange={handleUserFormChange}>
          {Object.values(ROLES).map(role => <option key={role} value={role}>{role}</option>)}
        </select>
      </FormGroup>
      <FormGroup label="Blood Type" htmlFor="bloodType">
        <select id="bloodType" name="bloodType" value={userFormData.bloodType} onChange={handleUserFormChange}>
          <option value="">Select Blood Type</option>
          {BLOOD_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      </FormGroup>
      <CheckboxGroup label="Registered as Donor" name="isDonor" checked={userFormData.isDonor} onChange={handleUserFormChange} />
      <CheckboxGroup label="Active Account" name="isActive" checked={userFormData.isActive} onChange={handleUserFormChange} />
    </ModalWrapper>
  ), [t, modalState, userFormData, handleUserFormChange, handleUserSubmit, closeModal, loadingStates.action]);

  const AdminModal = useCallback(() => (
    <ModalWrapper
      title={modalState.data ? `Edit Admin: ${modalState.data.username}` : t.addNewAdmin}
      isOpen={modalState.isOpen && modalState.type === MODAL_TYPE.ADMIN}
      onClose={closeModal}
      onSubmit={handleAdminSubmit}
      isSubmitting={loadingStates.action}
    >
      <FormGroup label="Username" htmlFor="username">
        <input type="text" id="username" name="username" value={adminFormData.username} onChange={handleAdminFormChange} required />
      </FormGroup>
      <FormGroup label="Email" htmlFor="email">
        <input type="email" id="email" name="email" value={adminFormData.email} onChange={handleAdminFormChange} required />
      </FormGroup>
      <FormGroup label="Role" htmlFor="role">
        <select id="role" name="role" value={adminFormData.role} onChange={handleAdminFormChange}>
          <option value={ROLES.ADMIN}>Admin</option>
          <option value={ROLES.SUPERADMIN}>Super Admin</option>
        </select>
      </FormGroup>
      <FormGroup label="Permissions">
        <CheckboxGroup label="Manage Users" name="permission_manageUsers" checked={adminFormData.permissions.manageUsers} onChange={handleAdminFormChange} />
        <CheckboxGroup label="Manage Donations" name="permission_manageDonations" checked={adminFormData.permissions.manageDonations} onChange={handleAdminFormChange} />
        <CheckboxGroup label="Manage Content" name="permission_manageContent" checked={adminFormData.permissions.manageContent} onChange={handleAdminFormChange} />
        <CheckboxGroup label="Manage Settings" name="permission_manageSettings" checked={adminFormData.permissions.manageSettings} onChange={handleAdminFormChange} />
      </FormGroup>
    </ModalWrapper>
  ), [t, modalState, adminFormData, handleAdminFormChange, handleAdminSubmit, closeModal, loadingStates.action]);

  if (loadingStates.global) {
    return <LoadingIndicator message="Verifying access..." />;
  }

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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'users': return renderUsers();
      case 'adminManagement': return renderAdminManagement();
      case 'donations': return renderDonations();
      case 'content': return renderContent();
      case 'settings': return renderSettings();
      default: return <p>Unknown tab selected.</p>;
    }
  };

  return (
    <div className="admin-wrapper">
      <Navbar />
      {error && (
        <div className="error-banner">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
      <div className="admin-page">
        <div className="admin-container">
          <div className="admin-sidebar">
            <div className="admin-profile">
              <div className="admin-avatar"><FontAwesomeIcon icon={faUserShield} /></div>
              <div className="admin-info">
                <h3>Admin User</h3>
                <p>{t.superAdministrator}</p>
              </div>
            </div>
            <ul className="admin-menu">
              <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
                <FontAwesomeIcon icon={faChartLine} /><span>{t.dashboard}</span>
              </li>
              <li className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
                <FontAwesomeIcon icon={faUsers} /><span>{t.userManagement}</span>
              </li>
              <li className={activeTab === 'adminManagement' ? 'active' : ''} onClick={() => setActiveTab('adminManagement')}>
                <FontAwesomeIcon icon={faUserShield} /><span>{t.adminManagement}</span>
              </li>
              <li className={activeTab === 'donations' ? 'active' : ''} onClick={() => setActiveTab('donations')}>
                <FontAwesomeIcon icon={faTint} /><span>{t.donations}</span>
              </li>
              <li className={activeTab === 'content' ? 'active' : ''} onClick={() => setActiveTab('content')}>
                <FontAwesomeIcon icon={faNewspaper} /><span>{t.content}</span>
              </li>
              <li className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>
                <FontAwesomeIcon icon={faCog} /><span>{t.settings}</span>
              </li>
            </ul>
          </div>

          <div className="admin-content-area">
            {renderTabContent()}
          </div>
        </div>
      </div>

      <UserModal />
      <AdminModal />
    </div>
  );
};

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const refreshToken = localStorage.getItem('refreshToken');

    if (refreshToken &&
        error.response?.status === 401 &&
        error.response?.data?.message === 'jwt expired' &&
        !originalRequest._retry) {

      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post(`${API_BASE_URL}/api/refresh-token`, { refreshToken });

        const { token, refreshToken: newRefreshToken } = refreshResponse.data;

        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers['Authorization'] = `Bearer ${token}`;

        return axios(originalRequest);

      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('userRole');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default AdminPage;
