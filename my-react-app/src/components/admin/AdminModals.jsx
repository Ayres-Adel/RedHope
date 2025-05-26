import React, { memo, useCallback, useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

const UncontrolledInput = memo(({ label, id, name, defaultValue, type = "text", required = false }) => {
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
const ModalWrapper = memo(({ title, isOpen, onClose, onSubmit, children, isSubmitting, isUpdate, translations }) => {
  if (!isOpen) return null;
  
  // Add escape key listener
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, isSubmitting]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }

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
            <button type="button" className="control-button" onClick={onClose} disabled={isSubmitting}>
              {translations.cancel}
            </button>
            <button type="submit" className="add-button" disabled={isSubmitting}>
              {isSubmitting ? translations.saving : (isUpdate ? translations.update : translations.create)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

const CoordinatesInput = memo(({ defaultLatitude, defaultLongitude, translations }) => {
  const [errors, setErrors] = useState({ latitude: '', longitude: '' });
  
  const validateCoordinate = (value, type) => {
    if (!value) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 'Must be a number';
    
    if (type === 'latitude') {
      if (numValue < -90 || numValue > 90) return 'Must be between -90 and 90';
    } else {
      if (numValue < -180 || numValue > 180) return 'Must be between -180 and 180';
    }
    return '';
  };
  
  const handleBlur = (e) => {
    const { name, value } = e.target;
    const errorMsg = validateCoordinate(value, name);
    setErrors(prev => ({ ...prev, [name]: errorMsg }));
  };
  
  return (
    <div className="form-group coordinates-group">
      <label className="coordinates-label">
        <FontAwesomeIcon icon={faMapMarkerAlt} /> {translations.locationCoordinates}
      </label>
      
      <div className="coordinates-inputs">
        <div className="coordinate-input-wrapper">
          <label htmlFor="latitude">{translations.latitude}</label>
          <input 
            type="text" 
            id="latitude" 
            name="latitude" 
            className={errors.latitude ? 'error' : ''}
            placeholder={translations.latitudeExample} 
            defaultValue={defaultLatitude || ''}
            onBlur={handleBlur}
          />
          {errors.latitude && <div className="coordinate-error">{errors.latitude}</div>}
          <small>{translations.latitudeBetween}</small>
        </div>
        
        <div className="coordinate-input-wrapper">
          <label htmlFor="longitude">{translations.longitude}</label>
          <input 
            type="text" 
            id="longitude" 
            name="longitude"
            className={errors.longitude ? 'error' : ''} 
            placeholder={translations.longitudeExample}
            defaultValue={defaultLongitude || ''}
            onBlur={handleBlur}
          />
          {errors.longitude && <div className="coordinate-error">{errors.longitude}</div>}
          <small>{translations.longitudeBetween}</small>
        </div>
      </div>
      
      <div className="coordinate-info">
        <FontAwesomeIcon icon={faInfoCircle} />
        <span>{translations.algeriaCoordinates}</span>
      </div>
    </div>
  );
});

const AdminModals = ({
  modalState,
  userFormData,
  adminFormData,
  hospitalFormData,
  handleUserSubmit,
  handleAdminSubmit,
  handleHospitalSubmit,
  closeModal,
  loadingAction,
  translations,
  roles,
  bloodTypes,
  modalTypes
}) => {
  const isEditingUser = Boolean(modalState.data && modalState.type === modalTypes.USER);
  const isEditingAdmin = Boolean(modalState.data && modalState.type === modalTypes.ADMIN);
  const isEditingHospital = Boolean(modalState.data && modalState.type === modalTypes.HOSPITAL);
  
  const onUserSubmit = useCallback((e, formData) => {
    handleUserSubmit(e, formData);
  }, [handleUserSubmit]);

  const onAdminSubmit = useCallback((e, formData) => {
    handleAdminSubmit(e, formData);
  }, [handleAdminSubmit]);
  
  const onHospitalSubmit = useCallback((e, formData) => {
    handleHospitalSubmit(e, formData);
  }, [handleHospitalSubmit]);

  const UserModal = () => (
    <ModalWrapper
      title={isEditingUser ? `${translations.editUser}: ${modalState.data?.username}` : translations.addNewUser}
      isOpen={modalState.isOpen && modalState.type === modalTypes.USER}
      onClose={closeModal}
      onSubmit={onUserSubmit}
      isSubmitting={loadingAction}
      isUpdate={isEditingUser}
      translations={translations}
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
        label={isEditingUser ? translations.passwordLeaveBlank : "Password"} 
        id="password" 
        name="password" 
        type="password" 
        defaultValue={userFormData.password}  
        required={!isEditingUser} 
      />
      <input type="hidden" name="role" value={roles.USER} />
      <input type="hidden" name="isDonor" value="true" />
      <input type="hidden" name="isActive" value="true" />
      <UncontrolledSelect 
        label={translations.bloodTypeLabel} 
        id="bloodType" 
        name="bloodType" 
        defaultValue={userFormData.bloodType} 
      >
        <option value="">{translations.selectBloodType}</option>
        {bloodTypes.map(type => <option key={type} value={type}>{type}</option>)}
      </UncontrolledSelect>
    </ModalWrapper>
  );

  const AdminModal = () => (
    <ModalWrapper
      title={isEditingAdmin ? `${translations.editAdmin}: ${modalState.data?.username}` : translations.addNewAdmin}
      isOpen={modalState.isOpen && modalState.type === modalTypes.ADMIN}
      onClose={closeModal}
      onSubmit={onAdminSubmit}
      isSubmitting={loadingAction}
      isUpdate={isEditingAdmin}
      translations={translations}
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
        label={isEditingAdmin ? translations.passwordLeaveBlank : "Password"} 
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
    </ModalWrapper>
  );
  
  const HospitalModal = () => {
    const defaultLatitude = modalState.data?.location?.coordinates 
      ? modalState.data.location.coordinates[1] 
      : '';
    const defaultLongitude = modalState.data?.location?.coordinates 
      ? modalState.data.location.coordinates[0] 
      : '';
      
    return (
      <ModalWrapper
        title={isEditingHospital ? `${translations.editHospital}: ${modalState.data?.name}` : translations.addNewHospital}
        isOpen={modalState.isOpen && modalState.type === modalTypes.HOSPITAL}
        onClose={closeModal}
        onSubmit={onHospitalSubmit}
        isSubmitting={loadingAction}
        isUpdate={isEditingHospital}
        translations={translations}
      >
        <UncontrolledInput 
          label={translations.hospitalName} 
          id="hospital_name" 
          name="name" 
          defaultValue={hospitalFormData.name} 
          required 
        />
        <UncontrolledInput 
          label="Structure" 
          id="structure" 
          name="structure" 
          defaultValue={hospitalFormData.structure} 
          required 
        />
        <UncontrolledInput 
          label="Wilaya" 
          id="wilaya" 
          name="wilaya" 
          defaultValue={hospitalFormData.wilaya} 
          required 
        />
        <UncontrolledInput 
          label="Telephone" 
          id="telephone" 
          name="telephone" 
          defaultValue={hospitalFormData.telephone} 
        />
        <UncontrolledInput 
          label="Fax" 
          id="fax" 
          name="fax" 
          defaultValue={hospitalFormData.fax} 
        />
        
        <CoordinatesInput 
          defaultLatitude={defaultLatitude} 
          defaultLongitude={defaultLongitude} 
          translations={translations}
        />
      </ModalWrapper>
    );
  };

  return (
    <>
      <UserModal />
      <AdminModal />
      <HospitalModal />
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

ModalWrapper.propTypes = {
  title: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  isUpdate: PropTypes.bool.isRequired,
  translations: PropTypes.object.isRequired
};

CoordinatesInput.propTypes = {
  defaultLatitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  defaultLongitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  translations: PropTypes.object.isRequired
};

AdminModals.propTypes = {
  modalState: PropTypes.object.isRequired,
  userFormData: PropTypes.object.isRequired,
  adminFormData: PropTypes.object.isRequired,
  hospitalFormData: PropTypes.object.isRequired,
  handleUserSubmit: PropTypes.func.isRequired,
  handleAdminSubmit: PropTypes.func.isRequired,
  handleHospitalSubmit: PropTypes.func.isRequired,
  closeModal: PropTypes.func.isRequired,
  loadingAction: PropTypes.bool.isRequired,
  translations: PropTypes.object.isRequired,
  roles: PropTypes.object.isRequired,
  bloodTypes: PropTypes.array.isRequired,
  modalTypes: PropTypes.object.isRequired
};

export default memo(AdminModals);
