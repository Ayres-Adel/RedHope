import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/UserPage.css';
import Navbar from './Navbar';
import Toast from './Toast';
import { FiEye, FiEyeOff, FiUser, FiMail, FiPhone, FiMapPin, FiDroplet, FiLock, FiTrash2, FiSettings, FiHome, FiShield } from 'react-icons/fi';
import { API_BASE_URL } from '../config';

const UserPage = () => {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: '',
    bloodType: '',
    location: ''
  });
  const [messages, setMessages] = useState([]);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
  const [activeSection, setActiveSection] = useState('profile');

  // Translations
  const translations = {
    en: {
      accountSettings: 'Account Settings',
      profileInformation: 'Profile Information',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      bloodType: 'Blood Type',
      location: 'Location',
      editInformation: 'Edit Information',
      changePassword: 'Change Password',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm New Password',
      changePasswordButton: 'Change Password',
      changing: 'Changing...',
      deleteAccount: 'Delete Account',
      deleteConfirmation: 'Type "DELETE" to confirm',
      deleteButton: 'Delete Account',
      cancel: 'Cancel',
      deleteWarning: 'This action cannot be undone. Please type "DELETE" to confirm account deletion.',
      loading: 'Loading...',
      passwordRequired: 'Please fill all password fields',
      passwordMismatch: 'New passwords do not match',
      passwordLength: 'Password must be at least 6 characters',
      passwordChanged: 'Password changed successfully!',
      sessionExpired: 'Session expired. Please login again.',
      deleteConfirmText: 'Please type DELETE to confirm',
      accountDeleted: 'Account deleted successfully',
      failedLoad: 'Failed to load user data',
      invalidRequest: 'Invalid request',
      networkError: 'Network error. Please try again.',
      dashboard: 'Dashboard',
      security: 'Security',
      myProfile: 'My Profile',
      myDonations: 'My Donations',
      overview: 'Overview'
    },
    fr: {
      accountSettings: 'Paramètres du Compte',
      profileInformation: 'Informations du Profil',
      name: 'Nom',
      email: 'Email',
      phone: 'Téléphone',
      bloodType: 'Groupe Sanguin',
      location: 'Localisation',
      editInformation: 'Modifier les Informations',
      changePassword: 'Changer le Mot de Passe',
      currentPassword: 'Mot de Passe Actuel',
      newPassword: 'Nouveau Mot de Passe',
      confirmPassword: 'Confirmer le Nouveau Mot de Passe',
      changePasswordButton: 'Changer le Mot de Passe',
      changing: 'Changement en cours...',
      deleteAccount: 'Supprimer le Compte',
      deleteConfirmation: 'Tapez "DELETE" pour confirmer',
      deleteButton: 'Supprimer le Compte',
      cancel: 'Annuler',
      deleteWarning: 'Cette action est irréversible. Veuillez taper "DELETE" pour confirmer la suppression du compte.',
      loading: 'Chargement...',
      passwordRequired: 'Veuillez remplir tous les champs du mot de passe',
      passwordMismatch: 'Les nouveaux mots de passe ne correspondent pas',
      passwordLength: 'Le mot de passe doit contenir au moins 6 caractères',
      passwordChanged: 'Mot de passe changé avec succès !',
      sessionExpired: 'Session expirée. Veuillez vous reconnecter.',
      deleteConfirmText: 'Veuillez taper DELETE pour confirmer',
      accountDeleted: 'Compte supprimé avec succès',
      failedLoad: 'Échec du chargement des données utilisateur',
      invalidRequest: 'Requête invalide',
      networkError: 'Erreur réseau. Veuillez réessayer.',
      dashboard: 'Tableau de bord',
      security: 'Sécurité',
      myProfile: 'Mon profil',
      myDonations: 'Mes dons',
      overview: 'Vue d\'ensemble'
    }
  };

  const t = translations[language];

  // Fetch user data when component mounts - optimized with better error handling
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        console.log('Fetching user profile data...');
        
        try {
          const { data } = await axios.get(`${API_BASE_URL}/api/user/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const userData = data.user || data;
          
          if (userData) {
            let formattedLocation = userData.location || 'N/A';
            
            if (typeof formattedLocation === 'string' && formattedLocation.includes(',')) {
              try {
                const coords = formattedLocation.split(',').map(coord => parseFloat(coord.trim()));
                
                if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                  const apiKey = '4bcabb4ac4e54f1692c1e4d811bb29e5';
                  const reverseGeoUrl = `https://api.opencagedata.com/geocode/v1/json?q=${coords[0]},${coords[1]}&key=${apiKey}&language=${language}`;
                  
                  const geoResponse = await axios.get(reverseGeoUrl);
                  
                  if (geoResponse.data.results && geoResponse.data.results.length > 0) {
                    const result = geoResponse.data.results[0];
                    
                    const components = result.components;
                    
                    const addressParts = [];
                    if (components.road) addressParts.push(components.road);
                    if (components.county) addressParts.push(components.county);
                    if (components.state) addressParts.push(components.state);
                    if (!components.state && !components.county && components.country) {
                      addressParts.push(components.country);
                    }
                    
                    formattedLocation = addressParts.join(', ');
                  }
                }
              } catch (geoError) {
                console.error('Error reverse geocoding:', geoError);
              }
            }
            
            setUserInfo({
              id: userData._id,
              name: userData.username || userData.name || 'N/A',
              email: userData.email || 'N/A',
              phone: userData.phoneNumber || 'N/A',
              bloodType: userData.bloodType || 'N/A',
              location: formattedLocation
            });
            setLoading(false);
          }
        } catch (error) {
          console.error('API error:', error);
          
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
            addMessage(t.sessionExpired, 'error');
            setTimeout(() => navigate('/login'), 1500);
            return;
          }
          
          addMessage(t.failedLoad, 'error');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in user data fetch:', error);
        setLoading(false);
        addMessage(t.failedLoad, 'error');
      }
    };

    fetchUserData();
  }, [navigate, t.failedLoad, t.sessionExpired, language]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentLang = localStorage.getItem('language') || 'en';
      if (currentLang !== language) {
        setLanguage(currentLang);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [language]);

  const addMessage = (text, type) => {
    const id = Date.now();
    setMessages(prev => [...prev, { id, text, type }]);
  };

  const removeMessage = (id) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const togglePasswordVisibility = (field) => {
    switch (field) {
      case 'current':
        setShowCurrentPassword(!showCurrentPassword);
        break;
      case 'new':
        setShowNewPassword(!showNewPassword);
        break;
      case 'confirm':
        setShowConfirmPassword(!showConfirmPassword);
        break;
      default:
        break;
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    const validatePasswordChange = () => {
      if (!currentPassword || !newPassword || !confirmPassword) {
        addMessage(t.passwordRequired, 'error');
        return false;
      }
      if (newPassword !== confirmPassword) {
        addMessage(t.passwordMismatch, 'error');
        return false;
      }
      if (newPassword.length < 6) {
        addMessage(t.passwordLength, 'error');
        return false;
      }
      return true;
    };

    if (!validatePasswordChange()) return;

    setIsChangingPassword(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      await axios.put(`${API_BASE_URL}/api/user/change-password`,
        {
          currentPassword,
          newPassword,
          confirmNewPassword: confirmPassword
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      addMessage(t.passwordChanged, 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        addMessage(t.sessionExpired, 'error');
        navigate('/login');
      } else {
        addMessage(err.response?.data?.error || t.networkError, 'error');
      }
      console.error('Password change error:', err);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      addMessage(t.deleteConfirmText, 'error');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      await axios.delete(`${API_BASE_URL}/api/user/${userInfo.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      localStorage.removeItem('token');
      addMessage(t.accountDeleted, 'success');
      
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Error deleting account:', err);
      if (err.response && err.response.data.error) {
        addMessage(err.response.data.error, 'error');
      } else {
        addMessage('Failed to delete account', 'error');
      }
    }
  };

  useEffect(() => {
    const toggle = document.getElementById('toggle');
    toggle.addEventListener('change', () => {
      document.body.classList.toggle('dark-theme', toggle.checked);
    });

    return () => {
      toggle.removeEventListener('change', () => {
        document.body.classList.toggle('dark-theme', toggle.checked);
      });
    };
  }, []);

  // Add a function to handle clicking outside the modal
  const handleModalOverlayClick = (e) => {
    // Only close if clicking directly on the overlay, not on the modal content
    if (e.target.className === 'modal-overlay') {
      setShowDeleteModal(false);
      setDeleteConfirmation('');
    }
  };

  return (
    <>
      <Navbar />
      <div className="user-page">
        <div className="settings-wrapper">
          <div className="admin-sidebar">
            <div className="admin-profile">
              <div className="admin-avatar">
                {loading ? '?' : userInfo.name.charAt(0).toUpperCase()}
              </div>
              <div className="admin-info">
                <h3>{loading ? t.loading : userInfo.name}</h3>
                <p>{loading ? '...' : userInfo.email}</p>
              </div>
            </div>
            
            <ul className="admin-menu">
              <li 
                className={activeSection === 'profile' ? 'active' : ''}
                onClick={() => setActiveSection('profile')}
              >
                <FiUser />
                <span>{t.myProfile}</span>
              </li>
              <li 
                className={activeSection === 'security' ? 'active' : ''}
                onClick={() => setActiveSection('security')}
              >
                <FiShield />
                <span>{t.security}</span>
              </li>
              <li 
                className={activeSection === 'danger' ? 'active' : ''}
                onClick={() => setActiveSection('danger')}
              >
                <FiTrash2 />
                <span>{t.deleteAccount}</span>
              </li>
            </ul>
          </div>
          
          <div className="admin-content-area">
            {loading ? (
              <div className="admin-loading">
                <div className="spinner"></div>
                <p>{t.loading}</p>
              </div>
            ) : (
              <>
                {activeSection === 'profile' && (
                  <section>
                    <h2>{t.profileInformation}</h2>
                    <div className="profile-box">
                      <div className="profile-header">
                        <div className="profile-icon">
                          <FiUser />
                        </div>
                        <h3>{t.overview}</h3>
                      </div>
                      <div className="info-grid">
                        <div className="info-item">
                          <span className="info-label">
                            <FiUser className="info-icon" />
                            {t.name}
                          </span>
                          <span className="info-value">{userInfo.name}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">
                            <FiMail className="info-icon" />
                            {t.email}
                          </span>
                          <span className="info-value">{userInfo.email}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">
                            <FiPhone className="info-icon" />
                            {t.phone}
                          </span>
                          <span className="info-value">{userInfo.phone}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">
                            <FiDroplet className="info-icon" />
                            {t.bloodType}
                          </span>
                          <span className="info-value">{userInfo.bloodType}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">
                            <FiMapPin className="info-icon" />
                            {t.location}
                          </span>
                          <span className="info-value">{userInfo.location}</span>
                        </div>
                      </div>
                      <div className="security-footer">
                        <button className="edit-info-btn">
                          <FiSettings /> {t.editInformation}
                        </button>
                      </div>
                    </div>
                  </section>
                )}

                {activeSection === 'security' && (
                  <section>
                    <h2>{t.security}</h2>
                    <div className="security-box">
                      <div className="security-header">
                        <div className="security-icon">
                          <FiLock />
                        </div>
                        <h3>{t.changePassword}</h3>
                      </div>
                      
                      <div className="security-content">
                        <div className="form-field">
                          <label>{t.currentPassword}</label>
                          <div className="password-input-container">
                            <input
                              type={showCurrentPassword ? "text" : "password"}
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              placeholder={t.currentPassword}
                            />
                            <span 
                              className="password-toggle"
                              onClick={() => togglePasswordVisibility('current')}
                            >
                              {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                            </span>
                          </div>
                        </div>
                        
                        <div className="form-field">
                          <label>{t.newPassword}</label>
                          <div className="password-input-container">
                            <input
                              type={showNewPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder={t.newPassword}
                            />
                            <span 
                              className="password-toggle"
                              onClick={() => togglePasswordVisibility('new')}
                            >
                              {showNewPassword ? <FiEyeOff /> : <FiEye />}
                            </span>
                          </div>
                        </div>
                        
                        <div className="form-field">
                          <label>{t.confirmPassword}</label>
                          <div className="password-input-container">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder={t.confirmPassword}
                            />
                            <span 
                              className="password-toggle"
                              onClick={() => togglePasswordVisibility('confirm')}
                            >
                              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="security-footer">
                        <button 
                          className="password-submit-btn" 
                          onClick={handlePasswordChange}
                          disabled={isChangingPassword}
                        >
                          <FiLock /> {isChangingPassword ? t.changing : t.changePasswordButton}
                        </button>
                      </div>
                    </div>
                  </section>
                )}

                {activeSection === 'danger' && (
                  <section>
                    <h2>{t.deleteAccount}</h2>
                    <div className="danger-box">
                      <div className="danger-icon">
                        <FiTrash2 />
                      </div>
                      <p>{t.deleteWarning}</p>
                      <button className="danger-action-btn" onClick={() => setShowDeleteModal(true)}>
                        <FiTrash2 /> {t.deleteButton}
                      </button>
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </div>

        {showDeleteModal && (
          <div className="modal-overlay" onClick={handleModalOverlayClick}>
            <div className="modal">
              <div className="modal-header">
                <div className="modal-icon danger-icon">
                  <FiTrash2 />
                </div>
                <h3>{t.deleteAccount}</h3>
              </div>
              <div className="modal-content">
                <p className="modal-warning">{t.deleteWarning}</p>
                <div className="form-group">
                  <label className="info-label">{t.deleteConfirmation}</label>
                  <input
                    type="text"
                    placeholder={t.deleteConfirmation}
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    className="modal-input"
                  />
                </div>
                <div className="modal-buttons">
                  <button
                    className="control-button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteConfirmation('');
                    }}
                  >
                    {t.cancel}
                  </button>
                  <button
                    className="danger-action-btn"
                    onClick={() => {
                      if (deleteConfirmation !== 'DELETE') {
                        addMessage(t.deleteConfirmText, 'error');
                        return;
                      }
                      handleDeleteAccount();
                    }}
                  >
                    <FiTrash2 /> {t.deleteButton}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="toast-container">
        {messages.map(msg => (
          <Toast
            key={msg.id}
            message={msg.text}
            type={msg.type}
            onClose={() => removeMessage(msg.id)}
          />
        ))}
      </div>
    </>
  );
};

export default UserPage;