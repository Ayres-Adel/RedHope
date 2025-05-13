import React, { memo, useCallback, useRef, useState } from 'react';
import PropTypes from 'prop-types';

// Create completely uncontrolled input components that don't re-render when typing
const UncontrolledInput = memo(({ label, id, name, defaultValue, type = "text", required = false }) => {
  // Use ref instead of state to avoid re-renders
  const inputRef = useRef();
  
  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <input 
        ref={inputRef}
        type={type}
        id={id}
        name={name}
        defaultValue={defaultValue}
        required={required}
      />
    </div>
  );
});

const UncontrolledSelect = memo(({ label, id, name, defaultValue, children }) => {
  const selectRef = useRef();
  
  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <select 
        ref={selectRef}
        id={id} 
        name={name} 
        defaultValue={defaultValue}
      >
        {children}
      </select>
    </div>
  );
});

const UncontrolledCheckbox = memo(({ label, name, defaultChecked }) => {
  const checkboxRef = useRef();
  
  return (
    <div className="form-group checkbox-group">
      <label>
        <input 
          ref={checkboxRef}
          type="checkbox" 
          name={name} 
          defaultChecked={defaultChecked}
        /> {label}
      </label>
    </div>
  );
});

// The modal wrapper component
const ModalWrapper = memo(({ title, isOpen, onClose, onSubmit, children, isSubmitting, isUpdate }) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {};
    
    // Convert FormData to a regular object
    for (let [key, value] of formData.entries()) {
      if (key.startsWith('permission_')) {
        // Handle nested permissions
        const permission = key.replace('permission_', '');
        data.permissions = data.permissions || {};
        data.permissions[permission] = true;
      } else {
        data[key] = value;
      }
    }

    // Convert string booleans to actual booleans
    if (formData.has('isDonor')) {
      data.isDonor = true;
    } else if (e.target.querySelector('input[name="isDonor"]')) {
      data.isDonor = false;
    }
    
    if (formData.has('isActive')) {
      data.isActive = true;
    } else if (e.target.querySelector('input[name="isActive"]')) {
      data.isActive = false;
    }
    
    // Handle permissions for unchecked boxes
    const permissionInputs = e.target.querySelectorAll('input[name^="permission_"]');
    if (permissionInputs.length > 0) {
      data.permissions = data.permissions || {};
      permissionInputs.forEach(input => {
        const permission = input.name.replace('permission_', '');
        if (!data.permissions[permission]) {
          data.permissions[permission] = false;
        }
      });
    }
    
    // Pass the actual form data object directly
    onSubmit(e, data);
  };
  
  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target.className === 'modal-overlay') onClose();
    }}>
      <div className="user-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose} disabled={isSubmitting}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">{children}</div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="btn-save" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (isUpdate ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

/**
 * AdminModals component containing user and admin form modals
 */
const AdminModals = ({
  modalState,
  userFormData,
  adminFormData,
  handleUserSubmit,
  handleAdminSubmit,
  closeModal,
  loadingAction,
  translations,
  roles,
  bloodTypes,
  modalTypes
}) => {
  const isEditingUser = Boolean(modalState.data && modalState.type === modalTypes.USER);
  const isEditingAdmin = Boolean(modalState.data && modalState.type === modalTypes.ADMIN);
  
  // Handle form submissions - call parent handlers with direct form data
  const onUserSubmit = useCallback((e, formData) => {
    // Pass the actual form data directly
    handleUserSubmit(e, formData);
  }, [handleUserSubmit]);

  const onAdminSubmit = useCallback((e, formData) => {
    // Pass the actual form data directly
    handleAdminSubmit(e, formData);
  }, [handleAdminSubmit]);

  const UserModal = () => (
    <ModalWrapper
      title={isEditingUser ? `Edit User: ${modalState.data?.username}` : translations.addNewUser}
      isOpen={modalState.isOpen && modalState.type === modalTypes.USER}
      onClose={closeModal}
      onSubmit={onUserSubmit}
      isSubmitting={loadingAction}
      isUpdate={isEditingUser}
    >
      <UncontrolledInput 
        label="Username" 
        id="username" 
        name="username" 
        defaultValue={userFormData.username} 
        required 
      />
      <UncontrolledInput 
        label="Email" 
        id="email" 
        name="email" 
        type="email" 
        defaultValue={userFormData.email}  
        required 
      />
      <UncontrolledInput 
        label={isEditingUser ? "Password (leave blank to keep current)" : "Password"} 
        id="password" 
        name="password" 
        type="password" 
        defaultValue={userFormData.password}  
        required={!isEditingUser} 
      />
      {/* Role field is removed - users will always have the role "user" */}
      <input type="hidden" name="role" value={roles.USER} />
      {/* Add hidden inputs for isDonor and isActive which will be true by default */}
      <input type="hidden" name="isDonor" value="true" />
      <input type="hidden" name="isActive" value="true" />
      <UncontrolledSelect 
        label="Blood Type" 
        id="bloodType" 
        name="bloodType" 
        defaultValue={userFormData.bloodType} 
      >
        <option value="">Select Blood Type</option>
        {bloodTypes.map(type => <option key={type} value={type}>{type}</option>)}
      </UncontrolledSelect>
    </ModalWrapper>
  );

  const AdminModal = () => (
    <ModalWrapper
      title={isEditingAdmin ? `Edit Admin: ${modalState.data?.username}` : translations.addNewAdmin}
      isOpen={modalState.isOpen && modalState.type === modalTypes.ADMIN}
      onClose={closeModal}
      onSubmit={onAdminSubmit}
      isSubmitting={loadingAction}
      isUpdate={isEditingAdmin}
    >
      <UncontrolledInput 
        label="Username" 
        id="username" 
        name="username" 
        defaultValue={adminFormData.username}  
        required 
      />
      <UncontrolledInput 
        label="Email" 
        id="email" 
        name="email" 
        type="email" 
        defaultValue={adminFormData.email}  
        required 
      />
      <UncontrolledInput 
        label={isEditingAdmin ? "Password (leave blank to keep current)" : "Password"} 
        id="password" 
        name="password" 
        type="password" 
        defaultValue={adminFormData.password}  
        required={!isEditingAdmin} 
      />
      <UncontrolledSelect 
        label="Role" 
        id="role" 
        name="role" 
        defaultValue={adminFormData.role}
      >
        <option value={roles.ADMIN}>Admin</option>
        <option value={roles.SUPERADMIN}>Super Admin</option>
      </UncontrolledSelect>
      <div className="form-group">
        <label>Permissions</label>
        <UncontrolledCheckbox 
          label="Manage Users" 
          name="permission_manageUsers" 
          defaultChecked={adminFormData.permissions?.manageUsers} 
        />
        <UncontrolledCheckbox 
          label="Manage Donations" 
          name="permission_manageDonations" 
          defaultChecked={adminFormData.permissions?.manageDonations} 
        />
        <UncontrolledCheckbox 
          label="Manage Content" 
          name="permission_manageContent" 
          defaultChecked={adminFormData.permissions?.manageContent} 
        />
        <UncontrolledCheckbox 
          label="Manage Settings" 
          name="permission_manageSettings" 
          defaultChecked={adminFormData.permissions?.manageSettings} 
        />
      </div>
    </ModalWrapper>
  );

  return (
    <>
      <UserModal />
      <AdminModal />
    </>
  );
};

// Add PropTypes
UncontrolledInput.propTypes = {
  label: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  defaultValue: PropTypes.string,
  type: PropTypes.string,
  required: PropTypes.bool
};

UncontrolledSelect.propTypes = {
  label: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  defaultValue: PropTypes.string,
  children: PropTypes.node.isRequired
};

UncontrolledCheckbox.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  defaultChecked: PropTypes.bool
};

// Existing PropTypes for ModalWrapper and AdminModals
ModalWrapper.propTypes = {
  title: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  isUpdate: PropTypes.bool.isRequired
};

// Existing PropTypes for AdminModals
AdminModals.propTypes = {
  modalState: PropTypes.object.isRequired,
  userFormData: PropTypes.object.isRequired,
  adminFormData: PropTypes.object.isRequired,
  handleUserSubmit: PropTypes.func.isRequired,
  handleAdminSubmit: PropTypes.func.isRequired,
  closeModal: PropTypes.func.isRequired,
  loadingAction: PropTypes.bool.isRequired,
  translations: PropTypes.object.isRequired,
  roles: PropTypes.object.isRequired,
  bloodTypes: PropTypes.array.isRequired,
  modalTypes: PropTypes.object.isRequired
};

export default memo(AdminModals);
