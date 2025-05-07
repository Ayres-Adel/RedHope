import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import Navbar from './Navbar';
import '../styles/AdminPage.css';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import adminService from '../services/adminService';
import userService from '../services/userService';
import ActionButton from './ui/ActionButton';
import StatusBadge from './ui/StatusBadge';
// Import the components
import DashboardMetrics from './admin/DashboardMetrics';
import BloodSupplySection from './admin/BloodSupplySection';
import RecentActivitySection from './admin/RecentActivitySection';
import AdminSidebar from './admin/AdminSidebar';
import ContentManagement from './admin/ContentManagement';
import SystemSettings from './admin/SystemSettings';
import UserManagement from './admin/UserManagement';
import DonationManagement from './admin/DonationManagement';
import AdminManagement from './admin/AdminManagement';
import AdminModals from './admin/AdminModals';

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
  password: '',
};

const INITIAL_ADMIN_FORM_DATA = {
  username: '',
  email: '',
  role: ROLES.ADMIN,
  password: '',
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
    bloodCounts: {}, // Add bloodCounts to state
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
      donorEmail: 'Donor Email',
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
      donorEmail: 'Email du donneur',
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
        const bloodCounts = {}; // Store the actual counts
        
        Object.entries(bloodData).forEach(([type, count]) => {
          // Determine status based on count
          if (count >= 10) supply[type] = BLOOD_SUPPLY_STATUS.STABLE;
          else if (count >= 5) supply[type] = BLOOD_SUPPLY_STATUS.LOW;
          else supply[type] = BLOOD_SUPPLY_STATUS.CRITICAL;
          
          // Store the count
          bloodCounts[type] = count;
        });
        
        setStats(prev => ({ 
          ...prev, 
          bloodSupply: supply, 
          bloodCounts: bloodCounts, // Add counts to stats
          bloodSupplyUnavailable: false 
        }));
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      handleApiError('retrieve blood supply', err);
      setStats(prev => ({ 
        ...prev, 
        bloodSupply: {}, 
        bloodCounts: {}, // Clear counts on error
        bloodSupplyUnavailable: true 
      }));
    }
  }, [getAuthHeaders, handleApiError]);

  const fetchStatsFromDatabase = useCallback(async () => {
    try {
      setLoading('dashboard', true);
      
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
          setStats(prev => ({ ...prev, totalUsers: 0, totalDonors: 0 }));
          setUsers([]);
          console.warn("No users found in API response");
        }
      } catch (apiError) {
        console.error("User fetch failed:", apiError);
        handleApiError('retrieve users', apiError);
        setStats(prev => ({ ...prev, totalUsers: 0, totalDonors: 0 }));
        setUsers([]);
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
        handleApiError('retrieve donation stats', donationError);
        setStats(prev => ({ ...prev, totalDonations: 0, pendingRequests: 0 }));
        setDonations([]);
      }
    } catch (err) {
      handleApiError('retrieve stats data', err);
      setStats({
        totalUsers: 0,
        totalDonors: 0,
        totalDonations: 0,
        pendingRequests: 0,
        bloodSupply: {},
        bloodSupplyUnavailable: true,
      });
      setUsers([]);
      setDonations([]);
    } finally {
      setLoading('dashboard', false);
    }
  }, [getAuthHeaders, handleApiError, setLoading]);

  const fetchStats = useCallback(async () => {
    setLoading('dashboard', true);
    setError(null);
    
    try {
      console.log('Fetching dashboard stats...');
      const response = await axios.get(`${API_BASE_URL}/api/stats/dashboard`, getAuthHeaders());
      console.log('Dashboard API response:', response.data);
      
      if (response.data && response.data.success) {
        console.log('Successfully loaded dashboard stats');
        setStats(prev => ({ 
          ...prev, 
          ...(response.data.stats || {}),
          bloodSupplyUnavailable: prev.bloodSupplyUnavailable
        }));
      } else {
        console.warn('Dashboard API returned success:false or invalid format');
        await fetchStatsFromDatabase();
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      await fetchStatsFromDatabase();
    }
    
    // Fetch blood supply separately to isolate potential failures
    try {
      await fetchBloodSupply();
    } catch (bloodErr) {
      console.error('Error fetching blood supply:', bloodErr);
      setStats(prev => ({
        ...prev,
        bloodSupplyUnavailable: true
      }));
    } finally {
      setLoading('dashboard', false);
    }
  }, [getAuthHeaders, handleApiError, fetchBloodSupply, fetchStatsFromDatabase, setLoading]);

  const fetchAllUsers = useCallback(async (page = 1, limit = ITEMS_PER_PAGE, searchQuery = '') => {
    setLoading('users', true);
    setError(null);
    try {
      console.log('Fetching users with params:', { page, limit, searchQuery });
      const response = await userService.getAllUsers(page, limit, searchQuery);
      console.log('User API response:', response);

      if (response.data && (response.data.success || response.data.users)) {
        const userData = response.data.users || [];
        console.log('User data extracted:', userData);

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
        
        // Update page info based on server response
        setPageInfo(prev => ({
          ...prev,
          users: {
            page: response.data.pagination?.currentPage || page,
            totalPages: response.data.pagination?.totalPages || 1,
            totalItems: response.data.pagination?.totalItems || userData.length
          }
        }));
      } else {
        console.error('Invalid user API response format:', response.data);
        throw new Error(response.data?.message || 'Invalid response format');
      }
    } catch (err) {
      console.error('User fetch error details:', err);
      handleApiError('retrieve all users', err);
      setAllUsers([]);
      setPageInfo(prev => ({ ...prev, users: { page: 1, totalPages: 1, totalItems: 0 } }));
    } finally {
      setLoading('users', false);
    }
  }, [handleApiError, setLoading]);

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

  const fetchAdminAccounts = useCallback(async (page = 1, limit = ITEMS_PER_PAGE, searchQuery = '') => {
    setLoading('admins', true);
    setError(null);
    try {
      console.log('Fetching admin accounts with params:', { page, limit, searchQuery });
      const response = await adminService.getAllAdmins(page, limit, searchQuery);
      console.log('Admin accounts API response:', response);
      
      if (response.data && (response.data.success || response.data.admins)) {
        const adminData = response.data.admins || [];
        console.log('Admin data extracted:', adminData);
        
        const normalizedAdmins = adminData.map(admin => ({
          id: admin.id || admin._id,
          username: admin.username || 'Unknown Admin',
          email: admin.email || 'No email',
          role: admin.role || ROLES.ADMIN,
          permissions: admin.permissions || { 
            ...INITIAL_ADMIN_FORM_DATA.permissions, 
            manageSettings: admin.role === ROLES.SUPERADMIN 
          },
          lastLogin: admin.lastLogin || null,
          isActive: admin.isActive !== false,
        }));
        setAdminAccounts(normalizedAdmins);
      } else {
        console.error('Invalid admin API response format:', response.data);
        throw new Error(response.data?.message || 'Invalid response format');
      }
    } catch (err) {
      console.error('Admin accounts fetch error details:', err);
      handleApiError('retrieve admin accounts', err);
      setAdminAccounts([]);
    } finally {
      setLoading('admins', false);
    }
  }, [handleApiError, setLoading]);

  // --- CRUD Operations ---
  const createUser = useCallback(async (userData) => {
    setLoading('action', true);
    setError(null);
    try {
      const response = await userService.createUser(userData);
      if (response.data?.success) {
        alert('User created successfully!');
        await fetchAllUsers(pageInfo.users.page, ITEMS_PER_PAGE, searchTerm);
        return true;
      } else {
        throw new Error(response.data?.message || 'Failed to create user');
      }
    } catch (err) {
      handleApiError('create user', err);
      return false;
    } finally {
      setLoading('action', false);
    }
  }, [handleApiError, fetchAllUsers, pageInfo.users.page, searchTerm, setLoading]);

  const updateUser = useCallback(async (userId, userData) => {
    setLoading('action', true);
    setError(null);
    try {
      const response = await userService.updateUser(userId, userData);
      if (response.data?.success) {
        alert('User updated successfully!');
        await fetchAllUsers(pageInfo.users.page, ITEMS_PER_PAGE, searchTerm);
        return true;
      } else {
        throw new Error(response.data?.message || 'Failed to update user');
      }
    } catch (err) {
      handleApiError('update user', err);
      return false;
    } finally {
      setLoading('action', false);
    }
  }, [handleApiError, fetchAllUsers, pageInfo.users.page, searchTerm, setLoading]);

  const deleteUser = useCallback(async (userId, username) => {
    if (window.confirm(`Are you sure you want to delete user: ${username}?`)) {
      setLoading('action', true);
      setError(null);
      try {
        const response = await userService.deleteUser(userId);
        if (response.data?.success) {
          alert('User deleted successfully!');
          await fetchAllUsers(pageInfo.users.page, ITEMS_PER_PAGE, searchTerm);
        } else {
          throw new Error(response.data?.message || 'Failed to delete user');
        }
      } catch (err) {
        handleApiError('delete user', err);
      } finally {
        setLoading('action', false);
      }
    }
  }, [handleApiError, fetchAllUsers, pageInfo.users.page, searchTerm, setLoading]);

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
    setError(null);
    try {
      const response = await adminService.createAdmin(data);
      if (response.data?.success) {
        alert('Admin created successfully!');
        await fetchAdminAccounts();
        return true;
      } else {
        throw new Error(response.data?.message || 'Failed to create admin');
      }
    } catch (err) {
      handleApiError('create admin', err);
      return false;
    } finally {
      setLoading('action', false);
    }
  }, [handleApiError, fetchAdminAccounts, setLoading]);

  const updateAdmin = useCallback(async (adminId, data) => {
    setLoading('action', true);
    setError(null);
    try {
      const response = await adminService.updateAdmin(adminId, data);
      if (response.data?.success) {
        alert('Admin updated successfully!');
        await fetchAdminAccounts();
        return true;
      } else {
        throw new Error(response.data?.message || 'Failed to update admin');
      }
    } catch (err) {
      handleApiError('update admin', err);
      return false;
    } finally {
      setLoading('action', false);
    }
  }, [handleApiError, fetchAdminAccounts, setLoading]);

  const deleteAdmin = useCallback(async (adminId, adminUsername) => {
    if (window.confirm(`Are you sure you want to delete admin "${adminUsername}"? This action cannot be undone.`)) {
      setLoading('action', true);
      setError(null);
      try {
        const response = await adminService.deleteAdmin(adminId);
        if (response.data?.success) {
          alert('Admin account deleted successfully!');
          await fetchAdminAccounts();
        } else {
          throw new Error(response.data?.message || 'Failed to delete admin');
        }
      } catch (err) {
        handleApiError('delete admin', err);
      } finally {
        setLoading('action', false);
      }
    }
  }, [handleApiError, fetchAdminAccounts, setLoading]);

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
      }

      switch (activeTab) {
        case 'dashboard':
          fetchStats();
          break;
        case 'users':
          fetchAllUsers(1, ITEMS_PER_PAGE, '');
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

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (activeTab === 'users') {
      // Add debounce for search
      const handler = setTimeout(() => {
        fetchAllUsers(1, ITEMS_PER_PAGE, value);
      }, DEBOUNCE_DELAY);
      return () => clearTimeout(handler);
    }
  }, [activeTab, fetchAllUsers]);

  const handlePageChange = useCallback((type, newPage) => {
    if (type === 'users') {
      fetchAllUsers(newPage, ITEMS_PER_PAGE, searchTerm);
    } else if (type === 'donations') {
      fetchDonations(newPage, ITEMS_PER_PAGE, searchTerm);
    }
  }, [fetchAllUsers, fetchDonations, searchTerm]);

  // --- Event Handlers ---
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
        password: data.password || '',
      } : INITIAL_USER_FORM_DATA);
    } else if (type === MODAL_TYPE.ADMIN) {
      setAdminFormData(data ? {
        username: data.username,
        email: data.email,
        role: data.role,
        password: data.password || '',
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
    if (modalState.data && modalState.data.id) {
      success = await updateAdmin(modalState.data.id, adminFormData);
    } else {
      success = await createAdmin(adminFormData);
    }
    if (success) {
      closeModal();
    }
  }, [modalState.data, adminFormData, updateAdmin, createAdmin, closeModal]);

  const exportToCSV = useCallback(async (type) => {
    setLoading('action', true);
    setError(null);
    try {
      let response;
      let filename;
      
      if (type === 'users') {
        response = await userService.exportUserData('csv');
        filename = 'users-export.csv';
      } else if (type === 'donations') {
        // Keep existing donation export logic
        response = await axios.get(`${API_BASE_URL}/api/donations/export`, {
          ...getAuthHeaders(),
          responseType: 'blob'
        });
        filename = 'donations-export.csv';
      } else {
        throw new Error('Invalid export type');
      }
      
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
            <DashboardMetrics stats={stats} translations={t} />
            
            <BloodSupplySection stats={stats} translations={t} />
            
            <RecentActivitySection translations={t} />
          </>
        )}
      </div>
    );
  }, [t, stats, loadingStates.dashboard]);

  const renderUsers = useCallback(() => {
    return (
      <UserManagement
        users={allUsers}
        loading={loadingStates.users}
        actionLoading={loadingStates.action}
        searchTerm={searchTerm}
        pageInfo={pageInfo.users}
        translations={t}
        onSearchChange={handleSearchChange}
        onExportCSV={exportToCSV}
        onOpenModal={openModal}
        onDeleteUser={deleteUser}
        onPageChange={handlePageChange}
        modalType={MODAL_TYPE.USER}
        EmptyStateMessage={EmptyStateMessage}
        Pagination={Pagination}
        LoadingIndicator={LoadingIndicator}
      />
    );
  }, [t, allUsers, loadingStates.users, loadingStates.action, searchTerm, pageInfo.users, handleSearchChange, exportToCSV, openModal, deleteUser, handlePageChange]);

  const renderDonations = useCallback(() => {
    return (
      <DonationManagement
        donations={donations}
        loading={loadingStates.donations}
        actionLoading={loadingStates.action}
        searchTerm={searchTerm}
        pageInfo={pageInfo.donations}
        translations={t}
        onSearchChange={handleSearchChange}
        onExportCSV={exportToCSV}
        onUpdateStatus={updateDonationStatus}
        onPageChange={handlePageChange}
        EmptyStateMessage={EmptyStateMessage}
        Pagination={Pagination}
        LoadingIndicator={LoadingIndicator}
        STATUS={STATUS}
      />
    );
  }, [t, donations, loadingStates.donations, loadingStates.action, searchTerm, pageInfo.donations, handleSearchChange, exportToCSV, updateDonationStatus, handlePageChange]);

  const renderAdminManagement = useCallback(() => {
    return (
      <AdminManagement
        admins={adminAccounts}
        loading={loadingStates.admins}
        searchTerm={searchTerm}
        translations={t}
        onSearchChange={handleSearchChange}
        onOpenModal={openModal}
        onDeleteAdmin={deleteAdmin}
        modalType={MODAL_TYPE.ADMIN}
        roles={ROLES}
        EmptyStateMessage={EmptyStateMessage}
        LoadingIndicator={LoadingIndicator}
      />
    );
  }, [t, adminAccounts, loadingStates.admins, searchTerm, handleSearchChange, openModal, deleteAdmin]);

  // Replace the existing render functions with component calls
  const renderContent = useCallback(() => {
    return <ContentManagement translations={t} />;
  }, [t]);

  const renderSettings = useCallback(() => {
    return <SystemSettings translations={t} />;
  }, [t]);

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
          <AdminSidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            translations={t} 
          />

          <div className="admin-content-area">
            {renderTabContent()}
          </div>
        </div>
      </div>

      <AdminModals
        modalState={modalState}
        userFormData={userFormData}
        adminFormData={adminFormData}
        handleUserFormChange={handleUserFormChange}
        handleAdminFormChange={handleAdminFormChange}
        handleUserSubmit={handleUserSubmit}
        handleAdminSubmit={handleAdminSubmit}
        closeModal={closeModal}
        loadingAction={loadingStates.action}
        translations={t}
        roles={ROLES}
        bloodTypes={BLOOD_TYPES}
        modalTypes={MODAL_TYPE}
      />
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
