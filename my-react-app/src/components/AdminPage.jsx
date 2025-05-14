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
import hospitalService from '../services/hospitalService'; // Add this import
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
import AdminManagement from './admin/AdminManagement';
import AdminModals from './admin/AdminModals';
import HospitalManagement from './admin/HospitalManagement'; // Add this import to fix the error

// --- Constants ---
const ITEMS_PER_PAGE = 10;
const DEBOUNCE_DELAY = 500;
const EXPORT_LOADING_KEY = 'export'; // Add new loading key for exports

const ROLES = {
  USER: 'user',
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
  HOSPITAL: 'hospital', // Add this type
};

const INITIAL_USER_FORM_DATA = {
  username: '',
  email: '',
  role: ROLES.USER,
  bloodType: '',
  isDonor: true, // Changed from false to true - users are donors by default
  isActive: true,
  password: '',
  phoneNumber: '0500000000', // Default phone number to satisfy API requirements
  dateOfBirth: new Date('1990-01-01').toISOString().split('T')[0], // Default date of birth (YYYY-MM-DD)
  location: '0.000000, 0.000000', // Coordinated location format (latitude, longitude)
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

const INITIAL_HOSPITAL_FORM_DATA = {
  name: '',
  structure: '',
  location: {
    type: 'Point',
    coordinates: [0, 0] // [longitude, latitude]
  },
  telephone: '',
  fax: '',
  wilaya: '',
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

  // Add polling for language changes
  useEffect(() => {
    const interval = setInterval(() => {
      const currentLang = localStorage.getItem('language') || 'en';
      if (currentLang !== language) {
        setLanguage(currentLang);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [language]);

  // Data States
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [adminAccounts, setAdminAccounts] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonors: 0,
    totalHospitals: 0,
    pendingRequests: 0,
    bloodSupply: {},
    bloodCounts: {},
    bloodSupplyUnavailable: false,
  });

  // UI States
  const [loadingStates, setLoadingStates] = useState({
    global: true,
    dashboard: false,
    users: false,
    hospitals: false,
    admins: false,
    action: false,
    export: false, // New export-specific loading state
  });
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageInfo, setPageInfo] = useState({
    users: { page: 1, totalPages: 1, totalItems: 0 },
    hospitals: { page: 1, totalPages: 1, totalItems: 0 },
  });

  // Modal State
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null, // 'user', 'admin', or 'hospital'
    data: null, // user, admin, or hospital object for editing
  });
  const [userFormData, setUserFormData] = useState(INITIAL_USER_FORM_DATA);
  const [adminFormData, setAdminFormData] = useState(INITIAL_ADMIN_FORM_DATA);
  const [hospitalFormData, setHospitalFormData] = useState(INITIAL_HOSPITAL_FORM_DATA); // Add this state

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
      addNewHospital: 'Add New Hospital',
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
      hospitals: 'Hospitals',
      hospitalManagement: 'Hospital Management',
      searchHospitals: 'Search hospitals...',
      noHospitalsFound: 'No hospitals found',
      structure: 'Structure',
      wilaya: 'Wilaya',
      telephone: 'Telephone',
      fax: 'Fax',
      coordinates: 'Coordinates',
      edit: 'Edit',
      delete: 'Delete',

      // Modal translations
      editUser: 'Edit User',
      editAdmin: 'Edit Admin',
      editHospital: 'Edit Hospital',
      passwordLeaveBlank: 'Password (leave blank to keep current)',
      save: 'Save',
      update: 'Update',
      create: 'Create',
      cancel: 'Cancel',
      saving: 'Saving...',
      permissions: 'Permissions',
      manageUsers: 'Manage Users',
      manageHospitals: 'Manage Hospitals',
      manageContent: 'Manage Content',
      manageSettings: 'Manage Settings',
      bloodTypeLabel: 'Blood Type',
      selectBloodType: 'Select Blood Type',
      hospitalName: 'Hospital Name',
      locationCoordinates: 'Location Coordinates',
      latitude: 'Latitude',
      longitude: 'Longitude',
      latitudeExample: 'Ex: 36.7538',
      longitudeExample: 'Ex: 3.0588',
      latitudeBetween: 'Values between -90 and 90',
      longitudeBetween: 'Values between -180 and 180',
      algeriaCoordinates: 'For Algeria, coordinates are typically latitude ~36 and longitude ~3',
      donors: 'donors',
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
      addNewHospital: 'Ajouter un Nouvel Hôpital',
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
      hospitals: 'Hôpitaux',
      hospitalManagement: 'Gestion des Hôpitaux',
      searchHospitals: 'Rechercher des hôpitaux...',
      noHospitalsFound: 'Aucun hôpital trouvé',
      structure: 'Structure',
      wilaya: 'Wilaya',
      telephone: 'Téléphone',
      fax: 'Fax',
      coordinates: 'Coordonnées',
      edit: 'Modifier',
      delete: 'Supprimer',

      // Modal translations
      editUser: 'Modifier l\'utilisateur',
      editAdmin: 'Modifier l\'administrateur',
      editHospital: 'Modifier l\'hôpital',
      passwordLeaveBlank: 'Mot de passe (laisser vide pour conserver l\'actuel)',
      save: 'Enregistrer',
      update: 'Mettre à jour',
      create: 'Créer',
      cancel: 'Annuler',
      saving: 'Enregistrement...',
      permissions: 'Permissions',
      manageUsers: 'Gérer les utilisateurs',
      manageHospitals: 'Gérer les hôpitaux',
      manageContent: 'Gérer le contenu',
      manageSettings: 'Gérer les paramètres',
      bloodTypeLabel: 'Groupe sanguin',
      selectBloodType: 'Sélectionner un groupe sanguin',
      hospitalName: 'Nom de l\'hôpital',
      locationCoordinates: 'Coordonnées de localisation',
      latitude: 'Latitude',
      longitude: 'Longitude',
      latitudeExample: 'Ex: 36.7538',
      longitudeExample: 'Ex: 3.0588',
      latitudeBetween: 'Valeurs entre -90 et 90',
      longitudeBetween: 'Valeurs entre -180 et 180',
      algeriaCoordinates: 'Pour l\'Algérie, les coordonnées sont généralement latitude ~36 et longitude ~3',
      donors: 'donneurs',
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
          if (count >= 20) supply[type] = BLOOD_SUPPLY_STATUS.STABLE;
          else if (count >= 10) supply[type] = BLOOD_SUPPLY_STATUS.LOW;
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
        // Make a paginated request to get all hospitals with count information
        const hospitalsResponse = await hospitalService.getAllHospitals(1, 1, '');
        
        if (hospitalsResponse.data?.success || hospitalsResponse.data?.hospitals) {
          // Extract the total count from pagination metadata instead of array length
          const totalHospitalsCount = hospitalsResponse.data.pagination?.totalItems || 0;
          
          setStats(prev => ({
            ...prev,
            totalHospitals: totalHospitalsCount
          }));
        } else {
          console.warn("Invalid hospital response format:", hospitalsResponse.data);
          setStats(prev => ({ ...prev, totalHospitals: 0 }));
        }
      } catch (hospitalError) {
        console.error("Hospital stats fetch error:", hospitalError);
        handleApiError('retrieve hospital stats', hospitalError);
        setStats(prev => ({ ...prev, totalHospitals: 0 }));
      }
    } catch (err) {
      handleApiError('retrieve stats data', err);
      setStats({
        totalUsers: 0,
        totalDonors: 0,
        totalHospitals: 0,
        pendingRequests: 0,
        bloodSupply: {},
        bloodSupplyUnavailable: true,
      });
      setUsers([]);
    } finally {
      setLoading('dashboard', false);
    }
  }, [getAuthHeaders, handleApiError, setLoading]);

  const fetchStats = useCallback(async () => {
    setLoading('dashboard', true);
    setError(null);
    
    // Skip the API call to /api/stats/dashboard and use fetchStatsFromDatabase directly
    try {
      await fetchStatsFromDatabase();
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
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
  }, [fetchBloodSupply, fetchStatsFromDatabase, setLoading]);

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

  const fetchHospitals = useCallback(async (page = 1, limit = ITEMS_PER_PAGE, searchQuery = '') => {
    setLoading('hospitals', true);
    setError(null);
    try {
      // Log the request
      console.log('Fetching hospitals with params:', { page, limit, searchQuery });
      
      const response = await hospitalService.getAllHospitals(page, limit, searchQuery);
      console.log('Hospital API response:', response);
      
      if (response.data && (response.data.success || response.data.hospitals)) {
        const hospitalData = response.data.hospitals || [];
        
        // Ensure hospitalData is an array before setting state
        if (Array.isArray(hospitalData)) {
          setHospitals(hospitalData);
          
          setPageInfo(prev => ({
            ...prev,
            hospitals: {
              page: response.data.pagination?.currentPage || page,
              totalPages: response.data.pagination?.totalPages || 1,
              totalItems: response.data.pagination?.totalItems || hospitalData.length
            }
          }));
        } else {
          console.error('Hospital data is not an array:', hospitalData);
          // If hospitalData is not an array, initialize with empty array
          setHospitals([]);
          setPageInfo(prev => ({ 
            ...prev, 
            hospitals: { page: 1, totalPages: 1, totalItems: 0 } 
          }));
        }
      } else {
        console.error('Invalid hospital API response format:', response.data);
        throw new Error(response.data?.message || 'Invalid response format');
      }
    } catch (err) {
      console.error('Hospital fetch error details:', err);
      handleApiError('retrieve hospitals', err);
      setHospitals([]);
      setPageInfo(prev => ({ ...prev, hospitals: { page: 1, totalPages: 1, totalItems: 0 } }));
    } finally {
      setLoading('hospitals', false);
    }
  }, [handleApiError, setLoading]);

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
      // Log what we're sending to the API
      console.log('Sending user data to API:', userData);
      
      // Ensure required fields are present
      if (!userData.username || !userData.email || !userData.password) {
        setError('Username, email, and password are required fields.');
        return false;
      }
      
      // Send the request
      const response = await userService.createUser({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        role: userData.role || ROLES.USER,
        bloodType: userData.bloodType || '',
        isDonor: userData.isDonor || true, // Default to true
        isActive: userData.isActive !== false,
        phoneNumber: userData.phoneNumber || '0500000000', // Default phone number to satisfy API requirements
        dateOfBirth: userData.dateOfBirth || new Date('1990-01-01').toISOString().split('T')[0], // Default date of birth (YYYY-MM-DD)
        location: userData.location || 'N/A',
      });
      
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
  }, [handleApiError, fetchAllUsers, pageInfo.users.page, searchTerm, setLoading, setError]);

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

  const createAdmin = useCallback(async (data) => {
    setLoading('action', true);
    setError(null);
    try {
      // Log what we're sending to the API
      console.log('Sending admin data to API:', data);
      
      // Ensure required fields are present
      if (!data.username || !data.email || !data.password) {
        setError('Username, email, and password are required fields.');
        return false;
      }
      
      // Send the request with explicitly defined fields
      const response = await adminService.createAdmin({
        username: data.username,
        email: data.email,
        password: data.password,
        role: data.role || ROLES.ADMIN,
        permissions: data.permissions || INITIAL_ADMIN_FORM_DATA.permissions
      });
      
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
  }, [handleApiError, fetchAdminAccounts, setLoading, setError]);

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

  const createHospital = useCallback(async (hospitalData) => {
    setLoading('action', true);
    setError(null);
    try {
      // Log what we're sending to the API
      console.log('Sending hospital data to API:', hospitalData);
      
      // Ensure required fields are present
      if (!hospitalData.name || !hospitalData.structure || !hospitalData.wilaya) {
        setError('Name, structure, and wilaya are required fields.');
        return false;
      }
      
      // Extract and validate coordinates
      const latitude = parseFloat(hospitalData.latitude);
      const longitude = parseFloat(hospitalData.longitude);
      
      // Create the hospital data object with proper GeoJSON format
      const formattedData = {
        name: hospitalData.name,
        structure: hospitalData.structure,
        wilaya: hospitalData.wilaya,
        telephone: hospitalData.telephone || '',
        fax: hospitalData.fax || '',
        // Only include location if both coordinates are valid numbers
        ...((!isNaN(latitude) && !isNaN(longitude)) ? {
          location: {
            type: 'Point',
            coordinates: [longitude, latitude] // GeoJSON format is [longitude, latitude]
          }
        } : {})
      };
      
      console.log('Formatted hospital data for API:', formattedData);
      
      const response = await hospitalService.createHospital(formattedData);
      
      if (response.data?.success || response.status === 201) {
        alert('Hospital created successfully!');
        await fetchHospitals(pageInfo.hospitals.page, ITEMS_PER_PAGE, searchTerm);
        return true;
      } else {
        throw new Error(response.data?.message || 'Failed to create hospital');
      }
    } catch (err) {
      handleApiError('create hospital', err);
      return false;
    } finally {
      setLoading('action', false);
    }
  }, [fetchHospitals, handleApiError, pageInfo.hospitals.page, searchTerm, setError, setLoading]);

  const updateHospital = useCallback(async (hospitalId, hospitalData) => {
    setLoading('action', true);
    setError(null);
    try {
      // Ensure required fields are present
      if (!hospitalData.name || !hospitalData.structure || !hospitalData.wilaya) {
        setError('Name, structure, and wilaya are required fields.');
        return false;
      }
      
      // Extract and validate coordinates
      const latitude = parseFloat(hospitalData.latitude);
      const longitude = parseFloat(hospitalData.longitude);
      
      // Create the hospital data object with proper GeoJSON format
      const formattedData = {
        name: hospitalData.name,
        structure: hospitalData.structure,
        wilaya: hospitalData.wilaya,
        telephone: hospitalData.telephone || '',
        fax: hospitalData.fax || '',
        // Only include location if both coordinates are valid numbers
        ...((!isNaN(latitude) && !isNaN(longitude)) ? {
          location: {
            type: 'Point',
            coordinates: [longitude, latitude] // GeoJSON format is [longitude, latitude]
          }
        } : {})
      };
      
      console.log('Formatted hospital data for update API:', formattedData);
      
      const response = await hospitalService.updateHospital(hospitalId, formattedData);
      
      if (response.data?.success) {
        alert('Hospital updated successfully!');
        await fetchHospitals(pageInfo.hospitals.page, ITEMS_PER_PAGE, searchTerm);
        return true;
      } else {
        throw new Error(response.data?.message || 'Failed to update hospital');
      }
    } catch (err) {
      handleApiError('update hospital', err);
      return false;
    } finally {
      setLoading('action', false);
    }
  }, [fetchHospitals, handleApiError, pageInfo.hospitals.page, searchTerm, setError, setLoading]);

  const deleteHospital = useCallback(async (hospitalId, hospitalName) => {
    if (window.confirm(`Are you sure you want to delete hospital: ${hospitalName}? This action cannot be undone.`)) {
      setLoading('action', true);
      setError(null);
      try {
        console.log(`Deleting hospital ID: ${hospitalId}`);
        const response = await hospitalService.deleteHospital(hospitalId);
        
        if (response.data?.success) {
          alert('Hospital deleted successfully!');
          // Re-fetch the list to update UI
          await fetchHospitals(pageInfo.hospitals.page, ITEMS_PER_PAGE, searchTerm);
          return true;
        } else {
          throw new Error(response.data?.message || 'Failed to delete hospital');
        }
      } catch (err) {
        handleApiError('delete hospital', err);
        return false;
      } finally {
        setLoading('action', false);
      }
    }
    return false;
  }, [fetchHospitals, handleApiError, pageInfo.hospitals.page, searchTerm, setLoading]);

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
      if (['users', 'hospitals', 'adminManagement'].includes(activeTab)) {
        setSearchTerm('');
      }

      switch (activeTab) {
        case 'dashboard':
          fetchStats();
          break;
        case 'users':
          fetchAllUsers(1, ITEMS_PER_PAGE, '');
          break;
        case 'hospitals': // Changed from 'donations'
          fetchHospitals(1, ITEMS_PER_PAGE, '');
          break;
        case 'adminManagement':
          fetchAdminAccounts();
          break;
        default:
          break;
      }
    }
  }, [activeTab, isAdmin, fetchStats, fetchAllUsers, fetchHospitals, fetchAdminAccounts]);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (activeTab === 'users') {
      // Add debounce for search
      const handler = setTimeout(() => {
        fetchAllUsers(1, ITEMS_PER_PAGE, value);
      }, DEBOUNCE_DELAY);
      return () => clearTimeout(handler);
    } else if (activeTab === 'hospitals') { // Changed from 'donations'
      // Add debounce for search
      const handler = setTimeout(() => {
        fetchHospitals(1, ITEMS_PER_PAGE, value);
      }, DEBOUNCE_DELAY);
      return () => clearTimeout(handler);
    }
  }, [activeTab, fetchAllUsers, fetchHospitals]);

  const handlePageChange = useCallback((type, newPage) => {
    if (type === 'users') {
      fetchAllUsers(newPage, ITEMS_PER_PAGE, searchTerm);
    } else if (type === 'hospitals') { // Changed from 'donations'
      fetchHospitals(newPage, ITEMS_PER_PAGE, searchTerm);
    }
  }, [fetchAllUsers, fetchHospitals, searchTerm]);

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
        isDonor: true, // Always set to true, regardless of existing value
        isActive: true, // Always set to true, regardless of existing value
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
    } else if (type === MODAL_TYPE.HOSPITAL) {
      // Format hospital data for edit or create new
      if (data) {
        console.log('Opening edit modal with hospital data:', data);
        const locationCoords = data.location?.coordinates || [0, 0];
        setHospitalFormData({
          name: data.name || '',
          structure: data.structure || '',
          location: {
            type: 'Point',
            coordinates: locationCoords
          },
          telephone: data.telephone || '',
          fax: data.fax || '',
          wilaya: data.wilaya || ''
        });
      } else {
        console.log('Opening new hospital modal');
        setHospitalFormData(INITIAL_HOSPITAL_FORM_DATA);
      }
    }
  }, []);

  const closeModal = useCallback(() => {
    setModalState({ isOpen: false, type: null, data: null });
    setUserFormData(INITIAL_USER_FORM_DATA);
    setAdminFormData(INITIAL_ADMIN_FORM_DATA);
    setHospitalFormData(INITIAL_HOSPITAL_FORM_DATA); // Reset hospital form
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

  const handleHospitalFormChange = useCallback((e) => {
    const { name, value } = e.target;
    
    if (name === 'latitude' || name === 'longitude') {
      // Handle coordinate changes separately
      setHospitalFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          coordinates: name === 'longitude' 
            ? [parseFloat(value) || 0, prev.location.coordinates[1]] 
            : [prev.location.coordinates[0], parseFloat(value) || 0]
        }
      }));
    } else {
      // Handle all other fields
      setHospitalFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  }, []);

  const handleUserSubmit = useCallback(async (e, formData) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.username || !formData.email || (!modalState.data && !formData.password)) {
      setError('Username, email, and password are required fields.');
      return;
    }
    
    let success = false;
    if (modalState.data) {
      // When updating, only include password if it's provided
      const dataToUpdate = {...formData};
      if (!dataToUpdate.password) delete dataToUpdate.password;
      success = await updateUser(modalState.data._id, dataToUpdate);
    } else {
      // Log the data being sent to createUser
      console.log('Form data submitted to createUser:', formData);
      success = await createUser(formData);
    }
    if (success) {
      closeModal();
    }
  }, [modalState.data, updateUser, createUser, closeModal, setError]);

  const handleAdminSubmit = useCallback(async (e, formData) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.username || !formData.email || (!modalState.data && !formData.password)) {
      setError('Username, email, and password are required fields.');
      return;
    }
    
    let success = false;
    if (modalState.data && modalState.data.id) {
      // When updating, only include password if it's provided
      const dataToUpdate = {...formData};
      if (!dataToUpdate.password) delete dataToUpdate.password;
      success = await updateAdmin(modalState.data.id, dataToUpdate);
    } else {
      // Log the data being sent to createAdmin
      console.log('Form data submitted to createAdmin:', formData);
      success = await createAdmin(formData);
    }
    if (success) {
      closeModal();
    }
  }, [modalState.data, updateAdmin, createAdmin, closeModal, setError]);

  const handleHospitalSubmit = useCallback(async (e, formData) => {
    e.preventDefault();
    console.log('Hospital form submitted with data:', formData);
    
    // Validate required fields
    if (!formData.name || !formData.structure || !formData.wilaya) {
      setError('Name, structure, and wilaya are required fields.');
      return;
    }
    
    let success = false;
    if (modalState.data && modalState.data._id) {
      console.log(`Updating hospital ID: ${modalState.data._id}`);
      success = await updateHospital(modalState.data._id, formData);
    } else {
      console.log('Creating new hospital');
      success = await createHospital(formData);
    }
    if (success) {
      closeModal();
    }
  }, [modalState.data, updateHospital, createHospital, closeModal, setError]);

  const exportToCSV = useCallback(async (type) => {
    setLoading('export', true); // Use specific export loading state
    setError(null);
    try {
      let csvContent = '';
      let filename = '';
      let dataToExport = [];
      
      // Convert array of objects to CSV format
      const convertToCSV = (objArray) => {
        // Extract column headers from the first object
        const headers = Object.keys(objArray[0] || {}).filter(key => 
          // Skip complex objects or arrays
          typeof objArray[0][key] !== 'object' && 
          typeof objArray[0][key] !== 'function' &&
          key !== 'password'); 

        // Create header row
        const headerRow = headers.join(',');
        
        // Create data rows
        const rows = objArray.map(item => {
          return headers.map(header => {
            // Handle special cases like nulls, quotes in text
            const cell = item[header] === null || item[header] === undefined ? '' : String(item[header]);
            // Escape quotes and wrap in quotes to handle commas in data
            return `"${cell.replace(/"/g, '""')}"`;
          }).join(',');
        });
        
        // Combine headers and rows
        return [headerRow, ...rows].join('\n');
      };
      
      // Fetch complete data sets based on export type
      if (type === 'users') {
        console.log('Fetching all users for export...');
        try {
          // Fetch all users without pagination
          const response = await userService.getAllUsers(1, 999999, '');
          if (response.data?.success || response.data?.users) {
            const allUserData = response.data.users || [];
            dataToExport = allUserData.map(user => ({
              id: user._id || user.id,
              username: user.username || user.name,
              email: user.email || 'No email',
              bloodType: user.bloodType || 'N/A',
              location: user.location || 'N/A',
              isDonor: user.isDonor ? 'Yes' : 'No',
              isActive: user.isActive !== false ? 'Active' : 'Inactive',
              role: user.role || ROLES.USER
            }));
          }
        } catch (err) {
          console.error('Failed to fetch all users for export:', err);
          setError('Failed to fetch all users for export. Using current page data instead.');
          // Fall back to current page data
          dataToExport = allUsers.map(user => ({
            id: user._id,
            username: user.username,
            email: user.email,
            bloodType: user.bloodType || 'N/A',
            location: user.location || 'N/A',
            isDonor: user.isDonor ? 'Yes' : 'No',
            isActive: user.isActive ? 'Active' : 'Inactive',
            role: user.role
          }));
        }
        filename = 'users-export.csv';
      } else if (type === 'hospitals') {
        console.log('Fetching all hospitals for export...');
        try {
          // Fetch all hospitals without pagination
          const response = await hospitalService.getAllHospitals(1, 999999, '');
          if (response.data?.success || response.data?.hospitals) {
            const allHospitalData = response.data.hospitals || [];
            dataToExport = allHospitalData.map(hospital => ({
              id: hospital._id,
              name: hospital.name,
              structure: hospital.structure,
              wilaya: hospital.wilaya,
              telephone: hospital.telephone || 'N/A',
              fax: hospital.fax || 'N/A',
              latitude: hospital.location?.coordinates?.[1] || 'N/A',
              longitude: hospital.location?.coordinates?.[0] || 'N/A',
            }));
          }
        } catch (err) {
          console.error('Failed to fetch all hospitals for export:', err);
          setError('Failed to fetch all hospitals for export. Using current page data instead.');
          // Fall back to current page data
          dataToExport = hospitals.map(hospital => ({
            id: hospital._id,
            name: hospital.name,
            structure: hospital.structure,
            wilaya: hospital.wilaya,
            telephone: hospital.telephone || 'N/A',
            fax: hospital.fax || 'N/A',
            latitude: hospital.location?.coordinates?.[1] || 'N/A',
            longitude: hospital.location?.coordinates?.[0] || 'N/A',
          }));
        }
        filename = 'hospitals-export.csv';
      } else if (type === 'admins') {
        console.log('Fetching all admin accounts for export...');
        try {
          // Fetch all admins without pagination
          const response = await adminService.getAllAdmins(1, 999999, '');
          if (response.data?.success || response.data?.admins) {
            const allAdminData = response.data.admins || [];
            dataToExport = allAdminData.map(admin => ({
              id: admin.id || admin._id,
              username: admin.username || 'Unknown Admin',
              email: admin.email || 'No email',
              role: admin.role || ROLES.ADMIN,
              isActive: admin.isActive !== false ? 'Active' : 'Inactive',
              manageUsers: admin.permissions?.manageUsers ? 'Yes' : 'No',
              manageDonations: admin.permissions?.manageDonations ? 'Yes' : 'No',
              manageContent: admin.permissions?.manageContent ? 'Yes' : 'No',
              manageSettings: admin.permissions?.manageSettings ? 'Yes' : 'No',
              lastLogin: admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : 'Never'
            }));
          }
        } catch (err) {
          console.error('Failed to fetch all admin accounts for export:', err);
          setError('Failed to fetch all admin accounts for export. Using current page data instead.');
          // Fall back to current page data
          dataToExport = adminAccounts.map(admin => ({
            id: admin.id,
            username: admin.username,
            email: admin.email,
            role: admin.role,
            isActive: admin.isActive ? 'Active' : 'Inactive',
            manageUsers: admin.permissions?.manageUsers ? 'Yes' : 'No',
            manageDonations: admin.permissions?.manageDonations ? 'Yes' : 'No',
            manageContent: admin.permissions?.manageContent ? 'Yes' : 'No',
            manageSettings: admin.permissions?.manageSettings ? 'Yes' : 'No',
            lastLogin: admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : 'Never'
          }));
        }
        filename = 'admin-accounts-export.csv';
      } else {
        throw new Error('Invalid export type');
      }
      
      // Only continue if we have data to export
      if (dataToExport.length === 0) {
        setError(`No ${type} data to export`);
        return;
      }
      
      console.log(`Exporting ${dataToExport.length} ${type} records to CSV`);
      
      // Convert data to CSV
      csvContent = convertToCSV(dataToExport);
      
      // Create a Blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log(`Successfully exported ${dataToExport.length} ${type} records to CSV`);
    } catch (err) {
      console.error(`Error exporting ${type} to CSV:`, err);
      setError(`Failed to export ${type}: ${err.message}`);
    } finally {
      setLoading('export', false);
    }
  }, [adminAccounts, allUsers, hospitals, setError, setLoading]);

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
        exportLoading={loadingStates.export} // Add this
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
  }, [t, allUsers, loadingStates, searchTerm, pageInfo.users, handleSearchChange, exportToCSV, openModal, deleteUser, handlePageChange]);

  const renderHospitals = useCallback(() => {
    return (
      <HospitalManagement
        hospitals={hospitals}
        loading={loadingStates.hospitals}
        actionLoading={loadingStates.action}
        searchTerm={searchTerm}
        pageInfo={pageInfo.hospitals}
        translations={t}
        onSearchChange={handleSearchChange}
        onExportCSV={exportToCSV}
        onOpenModal={openModal}
        onDeleteHospital={deleteHospital}
        onPageChange={handlePageChange}
        EmptyStateMessage={EmptyStateMessage}
        Pagination={Pagination}
        LoadingIndicator={LoadingIndicator}
      />
    );
  }, [t, hospitals, loadingStates.hospitals, loadingStates.action, searchTerm, pageInfo.hospitals, handleSearchChange, exportToCSV, openModal, deleteHospital, handlePageChange]);

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
        onExportCSV={exportToCSV}  // Add this prop to pass export function
        modalType={MODAL_TYPE.ADMIN}
        roles={ROLES}
        EmptyStateMessage={EmptyStateMessage}
        LoadingIndicator={LoadingIndicator}
      />
    );
  }, [t, adminAccounts, loadingStates.admins, searchTerm, handleSearchChange, openModal, deleteAdmin, exportToCSV]);

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
      case 'hospitals': return renderHospitals(); // Changed from 'donations'
      case 'adminManagement': return renderAdminManagement();
      case 'content': return renderContent();
      case 'settings': return renderSettings();
      default: return <p>Unknown tab selected.</p>;
    }
  };

  return (
    <div className="admin-wrapper">
      <Navbar />
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
        hospitalFormData={hospitalFormData}
        handleUserFormChange={handleUserFormChange}
        handleAdminFormChange={handleAdminFormChange}
        handleHospitalFormChange={handleHospitalFormChange}
        handleUserSubmit={handleUserSubmit}
        handleAdminSubmit={handleAdminSubmit}
        handleHospitalSubmit={handleHospitalSubmit}
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
