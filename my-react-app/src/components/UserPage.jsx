import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/UserPage.css';
import Navbar from './Navbar';
import Toast from './Toast';
import { FiEye, FiEyeOff } from 'react-icons/fi';

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
      networkError: 'Network error. Please try again.'
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
      networkError: 'Erreur réseau. Veuillez réessayer.'
    }
  };

  const t = translations[language];

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get('http://localhost:3000/api/user/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const userData = response.data;
        setUserInfo({
          name: userData.username || userData.name || 'N/A',
          email: userData.email || 'N/A',
          phone: userData.phone || 'N/A',
          bloodType: userData.bloodType || 'N/A',
          location: userData.location || userData.country || 'N/A'
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        addMessage(t.failedLoad, 'error');
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate, t.failedLoad]);

  // Language change effect
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
    
    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      addMessage(t.passwordRequired, 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      addMessage(t.passwordMismatch, 'error');
      return;
    }

    if (newPassword.length < 6) {
      addMessage(t.passwordLength, 'error');
      return;
    }

    setIsChangingPassword(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.put(
        'http://localhost:3000/api/user/change-password', 
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
      
      // Reset fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (err) {
      console.error('Password change error:', err);
      if (err.response) {
        if (err.response.status === 400) {
          addMessage(err.response.data.error || t.invalidRequest, 'error');
        } else if (err.response.status === 401) {
          addMessage(t.sessionExpired, 'error');
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          addMessage('Failed to change password', 'error');
        }
      } else {
        addMessage(t.networkError, 'error');
      }
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
      
      await axios.delete('http://localhost:3000/api/user/delete-account', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Clear user data from local storage
      localStorage.removeItem('token');
      addMessage(t.accountDeleted, 'success');
      
      // Redirect to home page
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

    // Cleanup event listener
    return () => {
      toggle.removeEventListener('change', () => {
        document.body.classList.toggle('dark-theme', toggle.checked);
      });
    };
  }, []);

  return (
    <>
      <Navbar />
      <div className="user-page">
        <div className="settings-wrapper">
          {loading ? (
            <div className="loading-spinner">{t.loading}</div>
          ) : (
            <div className="settings-card">
              <div className="settings-header">
                <h1>{t.accountSettings}</h1>
              </div>

              {/* Profile Information */}
              <div className="settings-section">
                <div className="section-header">
                  <h2>{t.profileInformation}</h2>
                </div>
                <div className="info-grid">
                  <div className="info-item">
                    <label>{t.name}</label>
                    <p>{userInfo.name}</p>
                  </div>
                  <div className="info-item">
                    <label>{t.email}</label>
                    <p>{userInfo.email}</p>
                  </div>
                  <div className="info-item">
                    <label>{t.phone}</label>
                    <p>{userInfo.phone}</p>
                  </div>
                  <div className="info-item">
                    <label>{t.bloodType}</label>
                    <p>{userInfo.bloodType}</p>
                  </div>
                  <div className="info-item">
                    <label>{t.location}</label>
                    <p>{userInfo.location}</p>
                  </div>
                </div>
                <div className="profile-actions">
                  <button className="button button-outline">{t.editInformation}</button>
                </div>
              </div>

              {/* Password Change */}
              <div className="settings-section">
                <div className="section-header">
                  <h2>{t.changePassword}</h2>
                </div>
                <div className="password-form">
                  <div className="form-item">
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
                  <div className="form-item">
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
                  <div className="form-item">
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
                  <button 
                    className="button button-outline" 
                    onClick={handlePasswordChange}
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? t.changing : t.changePasswordButton}
                  </button>
                </div>
              </div>

              {/* Delete Account */}
              <div className="settings-section">
                <div className="section-header">
                  <h2>{t.deleteAccount}</h2>
                </div>
                <div className="danger-zone">
                  <button className="button button-danger" onClick={() => setShowDeleteModal(true)}>
                    {t.deleteButton}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>{t.deleteAccount}</h3>
              <p>{t.deleteWarning}</p>
              <input
                type="text"
                placeholder={t.deleteConfirmation}
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
              />
              <div className="modal-buttons">
                <button
                  className="button button-cancel"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmation('');
                  }}
                >
                  {t.cancel}
                </button>
                <button
                  className="button button-danger"
                  onClick={() => {
                    if (deleteConfirmation !== 'DELETE') {
                      addMessage(t.deleteConfirmText, 'error');
                      return;
                    }
                    handleDeleteAccount();
                  }}
                >
                  {t.deleteButton}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Toast Messages */}
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