import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/UserPage.css';
import Navbar from './Navbar';
import Toast from './Toast';

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
        addMessage('Failed to load user data', 'error');
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const addMessage = (text, type) => {
    const id = Date.now();
    setMessages(prev => [...prev, { id, text, type }]);
  };

  const removeMessage = (id) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      addMessage('Please fill all password fields', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      addMessage('New passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 6) {
      addMessage('Password must be at least 6 characters', 'error');
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
      
      addMessage('Password changed successfully!', 'success');
      
      // Reset fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (err) {
      console.error('Password change error:', err);
      if (err.response) {
        if (err.response.status === 400) {
          addMessage(err.response.data.error || 'Invalid request', 'error');
        } else if (err.response.status === 401) {
          addMessage('Session expired. Please login again.', 'error');
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          addMessage('Failed to change password', 'error');
        }
      } else {
        addMessage('Network error. Please try again.', 'error');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      addMessage('Please type DELETE to confirm', 'error');
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
      addMessage('Account deleted successfully', 'success');
      
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

  return (
    <>
      <Navbar />
      <div className="user-page">
        <div className="settings-wrapper">
          {loading ? (
            <div className="loading-spinner">Loading...</div>
          ) : (
            <div className="settings-card">
              <div className="settings-header">
                <h1>Account Settings</h1>
              </div>

              {/* Profile Information */}
              <div className="settings-section">
                <div className="section-header">
                  <h2>Profile Information</h2>
                </div>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Name</label>
                    <p>{userInfo.name}</p>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <p>{userInfo.email}</p>
                  </div>
                  <div className="info-item">
                    <label>Phone</label>
                    <p>{userInfo.phone}</p>
                  </div>
                  <div className="info-item">
                    <label>Blood Type</label>
                    <p>{userInfo.bloodType}</p>
                  </div>
                  <div className="info-item">
                    <label>Location</label>
                    <p>{userInfo.location}</p>
                  </div>
                </div>
                <div className="profile-actions">
                  <button className="button button-outline">Edit Information</button>
                </div>
              </div>

              {/* Password Change */}
              <div className="settings-section">
                <div className="section-header">
                  <h2>Change Password</h2>
                </div>
                <div className="password-form">
                  <div className="form-item">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="form-item">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="form-item">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <button 
                    className="button button-outline" 
                    onClick={handlePasswordChange}
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </div>

              {/* Delete Account */}
              <div className="settings-section">
                <div className="section-header">
                  <h2>Delete Account</h2>
                </div>
                <div className="danger-zone">
                  <button className="button button-danger" onClick={() => setShowDeleteModal(true)}>
                    Delete Account
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
              <h3>Delete Account</h3>
              <p>This action cannot be undone. Please type "DELETE" to confirm account deletion.</p>
              <input
                type="text"
                placeholder='Type "DELETE" to confirm'
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
                  Cancel
                </button>
                <button
                  className="button button-danger"
                  onClick={() => {
                    if (deleteConfirmation !== 'DELETE') {
                      addMessage('Please type DELETE to confirm', 'error');
                      return;
                    }
                    handleDeleteAccount();
                  }}
                >
                  Delete Account
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