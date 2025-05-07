import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNewspaper, faUsers, faMapMarkerAlt, faEdit } from '@fortawesome/free-solid-svg-icons';

/**
 * ContentManagement component for handling site content in admin panel
 */
const ContentManagement = ({ translations }) => {
  return (
    <div className="admin-content">
      <h2>{translations.contentManagement}</h2>
      <div className="content-sections-container">
        <div className="content-section">
          <div className="section-header">
            <div className="section-icon"><FontAwesomeIcon icon={faNewspaper} /></div>
            <div className="section-content">
              <h3>{translations.homepageBanner}</h3>
              <div className="content-status published">Published</div>
              <h4>{translations.urgentNeed}</h4>
              <p className="content-description">{translations.urgentNeedDesc}</p>
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
              <h3>{translations.aboutUsPage}</h3>
              <div className="content-status published">Published</div>
              <h4>About Us</h4>
              <p className="content-description">{translations.aboutUsDesc}</p>
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
              <h3>{translations.contactInformation}</h3>
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
};

ContentManagement.propTypes = {
  translations: PropTypes.object.isRequired,
};

export default React.memo(ContentManagement);
