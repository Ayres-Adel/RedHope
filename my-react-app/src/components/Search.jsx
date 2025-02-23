import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/Search.css';

export default function Search() {
  const [message, setMessage] = useState('');
  const [buttonClicked, setButtonClicked] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [donors, setDonors] = useState([]);

  const logout = () => {
    localStorage.removeItem('token');
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login'); // Redirect to sign-in if no token
        return;
      }
      try {
        const res = await axios.get('http://127.0.0.1:3000/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMessage(res.data.msg);
      } catch (err) {
        console.error(err);
        setMessage('Failed to fetch data');
      }
    };
    fetchData();
  }, []);

  const fetchLocationDetails = async (latitude, longitude) => {
    const apiKey = '4bcabb4ac4e54f1692c1e4d811bb29e5';
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${latitude},${longitude}&key=${apiKey}`;
    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status.code === 200 && data.results.length > 0) {
        const { country, county, hamlet } = data.results[0].components;
        
        return {
          country: country || 'N/A',
          county: county || 'N/A',
          hamlet: hamlet || 'N/A',
        };
      }
      return { country: 'Location details unavailable', county: '', hamlet: '' };
    } catch (error) {
      console.error('Error fetching location details:', error);
      return { country: 'Error fetching location', county: '', hamlet: '' };
    }
  };

  const handleFindDonorsClick = async () => {
    setButtonClicked(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://127.0.0.1:3000/nearby', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Add location transformation logic here
      const updatedDonors = await Promise.all(
        res.data.map(async (donor) => {
          if (donor.location) {
            const [latitude, longitude] = donor.location.split(',').map(coord => coord.trim());
            const locationDetails = await fetchLocationDetails(latitude, longitude);
            return { ...donor, locationDetails };
          }
          return { ...donor, locationDetails: { country: 'Unknown Location', county: '', hamlet: '' } };
        })
      );

      setDonors(updatedDonors);
      setTimeout(() => {
        setShowTable(true); // Show the table after data is loaded
      }, 300); // Delay to match the animation duration
    } catch (err) {
      console.error(err);
      setDonors([]);
      alert('Failed to fetch nearby donors');
    }
  };

  useEffect(() => {
    const toggle = document.getElementById('toggle');

    // Check localStorage for saved dark mode preference
    const savedMode = localStorage.getItem('darkMode');

    // Apply the saved mode (if any) when the page is loaded
    if (savedMode === 'true') {
      document.body.classList.add('dark-theme');
      toggle.checked = true;
    } else {
      document.body.classList.remove('dark-theme');
      toggle.checked = false;
    }

    // Add event listener for the toggle button to save mode
    toggle.addEventListener('change', () => {
      // Toggle dark theme on body
      document.body.classList.toggle('dark-theme', toggle.checked);

      // Save the dark mode preference in localStorage
      localStorage.setItem('darkMode', toggle.checked);
    });

    // Cleanup event listener
    return () => {
      toggle.removeEventListener('change', () => {
        document.body.classList.toggle('dark-theme', toggle.checked);
        localStorage.setItem('darkMode', toggle.checked);
      });
    };
  }, []);

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

  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
    const changeLanguage = (lang) => {
      setLanguage(lang);
      localStorage.setItem('language', lang);
    };

    const translations = {
      en: {
        findNearby: 'Find Nearby Donors',
        clickToLocate: 'Click to locate blood donors near you and save lives today.',
        findDonors: 'Find Donors',
        noDonors: 'No donors found nearby.',
        username: 'Username',
        gender: 'Gender',
        email: 'Email',
        phone: 'Phone Number',
        bloodType: 'Blood Type',
        country: 'Country',
        county: 'County',
        hamlet: 'Hamlet',
        logout: 'Log Out'
      },
      fr: {
        findNearby: 'Trouver des donneurs à proximité',
        clickToLocate: 'Cliquez pour localiser les donneurs de sang près de chez vous et sauver des vies.',
        findDonors: 'Trouver des donneurs',
        noDonors: 'Aucun donneur trouvé à proximité.',
        username: 'Nom d’utilisateur',
        gender: 'Genre',
        email: 'E-mail',
        phone: 'Numéro de téléphone',
        bloodType: 'Groupe sanguin',
        country: 'Pays',
        county: 'Comté',
        hamlet: 'Hameau',
        logout: 'Se déconnecter'
      }
    };

  return (
    <>
      <header>
        <nav>
          <div className="RedHope" style={{ marginLeft: '-40px', paddingRight: '350px' }}>
            <img src="/src/assets/images/RedHope_Logo.png" alt="RedHope Logo" />
            <a href="/">
              <h1>
                <span>Red</span>Hope
              </h1>
            </a>
          </div>
          <div className="User">
            <a href="">
              <div className="User_Profile">{message}</div>
            </a>
            <a href="/">
              <div className="User-Profile" onClick={logout}>
                Log Out
              </div>
            </a>
          </div>

          <div className='theme_change'>
          <div className="toggle-container">
            <input type="checkbox" id="toggle" />
            <label htmlFor="toggle" className="display">
              <div className="circle">
                <svg className="sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z" />
                </svg>
                <svg className="moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z" clipRule="evenodd" />
                </svg>
              </div>
            </label>
          </div>
        </div>
        
        <div className='language-switcher'>
            <select value={language} onChange={(e) => changeLanguage(e.target.value)}>
              <option value='en'>English</option>
              <option value='fr'>Français</option>
            </select>
          </div>

        

        </nav>
      </header>

      <div className="Lean-More">
      <h1>{translations[language].findNearby}</h1>
        <p>{translations[language].clickToLocate}</p>
        <div className="button-container">
          {buttonClicked ? (
            <div className={`donor-table-wrapper ${showTable ? 'show' : ''}`}>
              <table border="1" style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    <th>{translations[language].username}</th>
                    <th>{translations[language].gender}</th>
                    <th>{translations[language].email}</th>
                    <th>{translations[language].phone}</th>
                    <th>{translations[language].bloodType}</th>
                    <th>{translations[language].country}</th>
                    <th>{translations[language].county}</th>
                    <th>{translations[language].hamlet}</th>
                  </tr>
                </thead>
                <tbody>
                  {donors.length > 0 ? (
                    donors.map((donor, index) => (
                      <tr key={index}>
                        <td>{donor.username}</td>
                        <td>{donor.gender}</td>
                        <td>{donor.email}</td>
                        <td>{donor.phoneNumber}</td>
                        <td>{donor.bloodType}</td>
                        <td>{donor.locationDetails?.country || 'N/A'}</td>
                        <td>{donor.locationDetails?.county || 'N/A'}</td>
                        <td>{donor.locationDetails?.hamlet || 'N/A'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center' }}>
                         {translations[language].noDonors}
                      </td> 
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <button className="find-donors-button" onClick={handleFindDonorsClick}>
              {translations[language].findDonors}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
