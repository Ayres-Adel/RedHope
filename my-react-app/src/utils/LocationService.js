/**
 * LocationService.js - Utility functions for handling geolocation
 */

// In-memory cache for geocoding results to reduce API calls
const geocodeCache = {};

// Centralized API key management
export const GEOCODE_API_KEY = import.meta.env.VITE_OPENCAGE_API_KEY || '4bcabb4ac4e54f1692c1e4d811bb29e5';

/**
 * Get current user location with coordinates
 * @param {Object} options - Configuration options
 * @param {Function} options.onSuccess - Success callback with coordinates
 * @param {Function} options.onError - Error callback with error message
 * @param {Boolean} options.enableHighAccuracy - Whether to enable high accuracy
 * @param {Number} options.timeout - Timeout in milliseconds
 * @param {Number} options.maximumAge - Maximum cached position age
 * @returns {Promise} Promise that resolves with coordinates or rejects with error
 */
export const getCurrentLocation = (options = {}) => {
  const {
    onSuccess,
    onError,
    enableHighAccuracy = true,
    timeout = 20000, // Increase from 10000 to 20000 (20s)
    maximumAge = 0
  } = options;

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      const errorMsg = 'Geolocation is not supported by this browser.';
      if (onError) onError(errorMsg);
      reject(new Error(errorMsg));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        
        if (onSuccess) onSuccess(coordinates);
        resolve(coordinates);
      },
      (error) => {
        let errorMsg;
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location access was denied. Please enable location services.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMsg = 'Request for location timed out.';
            break;
          default:
            errorMsg = 'An unknown error occurred while retrieving location.';
        }
        
        if (onError) onError(errorMsg);
        reject(new Error(errorMsg));
      },
      { 
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    );
  });
};

// Optimize wilaya mapping with more concise format and improved organization
const wilayaMapping = (() => {
  // Base mapping with primary names
  const baseMap = {
    'adrar': '01', 'chlef': '02', 'laghouat': '03', 'oum el bouaghi': '04',
    'batna': '05', 'bejaia': '06', 'biskra': '07', 'bechar': '08',
    'blida': '09', 'bouira': '10', 'tamanrasset': '11', 'tebessa': '12',
    'tlemcen': '13', 'tiaret': '14', 'tizi ouzou': '15', 'alger': '16',
    'djelfa': '17', 'jijel': '18', 'setif': '19', 'saida': '20',
    'skikda': '21', 'sidi bel abbes': '22', 'annaba': '23', 'guelma': '24',
    'constantine': '25', 'medea': '26', 'mostaganem': '27', 'msila': '28',
    'mascara': '29', 'ouargla': '30', 'oran': '31', 'el bayadh': '32',
    'illizi': '33', 'bordj bou arreridj': '34', 'boumerdes': '35', 'el tarf': '36',
    'tindouf': '37', 'tissemsilt': '38', 'el oued': '39', 'khenchela': '40',
    'souk ahras': '41', 'tipaza': '42', 'mila': '43', 'ain defla': '44',
    'naama': '45', 'ain temouchent': '46', 'ghardaia': '47', 'relizane': '48',
    // New wilayas added in 2019
    'el mghair': '49', 'el meniaa': '50', 'ouled djellal': '51', 
    'bordj badji mokhtar': '52', 'beni abbes': '53', 'timimoun': '54',
    'touggourt': '55', 'djanet': '56', 'in salah': '57', 'in guezzam': '58'
  };
  
  // Add alternative spellings and accented versions
  const alternativeMap = {
    'béjaïa': '06', 'béchar': '08', 'tébessa': '12', 'sétif': '19',
    'saïda': '20', 'sidi bel abbès': '22', 'médéa': '26', 'm\'sila': '28',
    'boumerdès': '35', 'aïn defla': '44', 'naâma': '45', 'aïn témouchent': '46',
    'ghardaïa': '47', 'el m\'ghair': '49', 'el mgheir': '49', 'el menea': '50',
    'el menia': '50', 'bordj baji mokhtar': '52', 'béni abbès': '53',
    'toggourt': '55', 'tugurt': '55', 'ain salah': '57', 'in guezam': '58',
    'algiers': '16' // English name for Alger
  };
  
  return { ...baseMap, ...alternativeMap };
})();

/**
 * Optimized function to find cityId by state name
 * @param {string} stateName - State name to look up
 * @returns {string|null} - CityId if found, null otherwise
 */
const findCityIdByState = (stateName) => {
  if (!stateName) return null;
  
  // Normalize name (lowercase, no accents, trimmed)
  const normalizedName = stateName.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim();
  
  // Direct lookup (most efficient)
  if (wilayaMapping[normalizedName]) {
    return wilayaMapping[normalizedName];
  }
  
  // Partial match as fallback with early returns for efficiency
  for (const [key, value] of Object.entries(wilayaMapping)) {
    // First check if the normalized name contains the key (more likely match)
    if (normalizedName.includes(key)) {
      return value;
    }
    // Then check if the key contains the normalized name (less likely but possible)
    if (key.includes(normalizedName) && normalizedName.length > 3) { // Avoid matching very short strings
      return value;
    }
  }
  
  // No match found
  return null;
};

/**
 * Convert cityId (wilaya code) to wilaya name
 * @param {string} cityId - The wilaya code to convert
 * @param {Object} options - Optional settings
 * @param {boolean} options.normalized - Whether to return normalized name (default: false)
 * @returns {string|null} - Wilaya name or null if not found
 */
export const cityIdToWilaya = (cityId, options = { normalized: false }) => {
  if (!cityId) return null;
  
  // Ensure cityId is a string and padded to 2 digits if needed
  const formattedCityId = String(cityId).padStart(2, '0');
  
  // Map of wilaya codes to normalized names
  const wilayaCodeToName = {
    "01": "Adrar",
    "02": "Chlef",
    "03": "Laghouat",
    "04": "Oum El Bouaghi",
    "05": "Batna",
    "06": "Béjaïa",
    "07": "Biskra",
    "08": "Béchar",
    "09": "Blida",
    "10": "Bouira",
    "11": "Tamanrasset",
    "12": "Tébessa",
    "13": "Tlemcen",
    "14": "Tiaret",
    "15": "Tizi Ouzou",
    "16": "Alger",
    "17": "Djelfa",
    "18": "Jijel",
    "19": "Sétif",
    "20": "Saïda",
    "21": "Skikda",
    "22": "Sidi Bel Abbès",
    "23": "Annaba",
    "24": "Guelma",
    "25": "Constantine",
    "26": "Médéa",
    "27": "Mostaganem",
    "28": "M'Sila",
    "29": "Mascara",
    "30": "Ouargla",
    "31": "Oran",
    "32": "El Bayadh",
    "33": "Illizi",
    "34": "Bordj Bou Arréridj",
    "35": "Boumerdès",
    "36": "El Tarf",
    "37": "Tindouf",
    "38": "Tissemsilt",
    "39": "El Oued",
    "40": "Khenchela",
    "41": "Souk Ahras",
    "42": "Tipaza",
    "43": "Mila",
    "44": "Aïn Defla",
    "45": "Naâma",
    "46": "Aïn Témouchent",
    "47": "Ghardaïa",
    "48": "Relizane",
    "49": "El M'ghair",
    "50": "El Meniaa",
    "51": "Ouled Djellal",
    "52": "Bordj Badji Mokhtar",
    "53": "Béni Abbès",
    "54": "Timimoun",
    "55": "Touggourt",
    "56": "Djanet",
    "57": "In Salah",
    "58": "In Guezzam"
  };
  
  // Return the wilaya name or null if not found
  return wilayaCodeToName[formattedCityId] || null;
};

/**
 * Reverse geocode coordinates to get readable location name
 * @param {Number} latitude - Latitude coordinate
 * @param {Number} longitude - Longitude coordinate
 * @param {String} language - Preferred language for results
 * @returns {Promise} Promise that resolves with standardized location response
 */
export const reverseGeocode = async (latitude, longitude, language = 'en') => {
  try {
    // Generate cache key based on coordinates and language
    const cacheKey = `${latitude.toFixed(6)},${longitude.toFixed(6)}_${language}`;
    
    // Return cached result if available
    if (geocodeCache[cacheKey]) {
      return geocodeCache[cacheKey];
    }
    
    // Validate API key
    if (!GEOCODE_API_KEY || GEOCODE_API_KEY.length < 10) {
      console.error('Invalid or missing OpenCage API key');
      return {
        success: false,
        error: true,
        message: 'Configuration error: Invalid API key',
        formatted: `${latitude},${longitude}`
      };
    }
    
    // Ensure coordinates are valid numbers
    if (isNaN(latitude) || isNaN(longitude) || !isFinite(latitude) || !isFinite(longitude)) {
      return {
        success: false,
        error: true,
        message: 'Invalid coordinates',
        formatted: 'Invalid location'
      };
    }
    
    const reverseGeoUrl = `https://api.opencagedata.com/geocode/v1/json?q=${latitude},${longitude}&key=${GEOCODE_API_KEY}&language=${language || 'en'}&no_annotations=1`;
    
    const response = await fetch(reverseGeoUrl);
    
    // Handle HTTP errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenCage API error (${response.status}):`, errorText);
      return {
        success: false,
        error: true,
        message: `API error: ${response.status}`,
        status: { code: response.status },
        formatted: `${latitude},${longitude}`
      };
    }
    
    const data = await response.json();
    
    // Process the results to standard format
    const result = {
      success: true,
      error: false,
      raw: data,
      components: data.results?.[0]?.components || {},
      formatted: data.results?.[0]?.formatted || `${latitude},${longitude}`,
      coordinates: {
        lat: latitude,
        lng: longitude
      }
    };
    
    // Extract location details
    if (data.results && data.results.length > 0) {
      const components = data.results[0].components;
      
      // PRIMARY METHOD: Extract cityId from postal code (if available)
      const postalCode = components.postcode || '';
      let cityId = null;
      let methodUsed = 'none';
      
      // First attempt: Use postal code if available and valid
      if (postalCode && postalCode.length >= 2) {
        // Extra validation to ensure postal code is numeric (for Algeria)
        const postalPrefix = postalCode.substring(0, 2);
        if (/^\d{2}$/.test(postalPrefix)) {
          cityId = postalPrefix;
          methodUsed = 'postal';
        } 
      }
      
      // FALLBACK METHOD: Only use if postal code method failed
      if (!cityId && components.state) {
        const stateBasedCityId = findCityIdByState(components.state);
        if (stateBasedCityId) {
          cityId = stateBasedCityId;
          methodUsed = 'state';
        } 
      }
      
      result.details = {
        country: components.country || 'N/A',
        county: components.county || components.state || 'N/A',
        city: components.city || components.town || components.village || 'N/A',
        hamlet: components.hamlet || components.suburb || components.neighbourhood || 'N/A',
        postalCode,
        cityId,
        state: components.state || null,
        cityIdMethod: methodUsed // Track which method was used to get the cityId
      };
    }
    
    // Cache the result
    geocodeCache[cacheKey] = result;
    
    return result;
  } catch (error) {
    console.error('Geocoding error:', error);
    // Return standardized error structure
    return { 
      success: false,
      error: true, 
      message: error.message || 'Failed to fetch location data',
      status: { code: error.status || 500 },
      formatted: `${latitude},${longitude}`
    };
  }
};

/**
 * Format location data with improved cityId extraction
 * @param {Object} position - Position object with lat/lng or latitude/longitude
 * @param {string} language - Language code for localization
 * @returns {Promise} Promise resolving to formatted location data
 */
export const formatLocation = async (position, language = 'en') => {
  try {
    // Normalize position format
    const lat = position.lat || position.latitude;
    const lng = position.lng || position.longitude;
    
    if (!lat || !lng) {
      return {
        success: false,
        formatted: `Invalid coordinates`,
        message: 'Missing latitude or longitude'
      };
    }
    
    // Get geocoding result
    const result = await reverseGeocode(lat, lng, language);
    
    if (!result.success) {
      return {
        success: false,
        formatted: `${lat},${lng}`,
        message: result.message || 'Geocoding failed'
      };
    }
    
    // Enhanced cityId extraction logic
    let cityId = null;
    
    // Try to get cityId from the result details
    if (result.details && result.details.cityId) {
      cityId = result.details.cityId;
    }
    // Try extracting from postal code
    else if (result.components && result.components.postcode) {
      const postalCode = result.components.postcode;
      if (postalCode && postalCode.length >= 2) {
        cityId = postalCode.substring(0, 2);
      }
    }
    // Try mapping from city/state name
    else if (result.components) {
      // Map wilaya names to codes if available
      const wilayaName = result.components.state || result.components.city;
      if (wilayaName) {
        // This would map known wilaya names to codes
        const wilayaMapping = {
          'Adrar': '01', 'Chlef': '02', 'Laghouat': '03', 'Oum El Bouaghi': '04',
          'Batna': '05', 'Béjaïa': '06', 'Biskra': '07', 'Béchar': '08',
          'Blida': '09', 'Bouira': '10', // etc. - could be expanded with all wilayas
        };
        
        // Normalize names for comparison: lowercase, remove accents, trim
        const normalizedName = wilayaName.toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .trim();
          
        for (const [key, value] of Object.entries(wilayaMapping)) {
          const normalizedKey = key.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .trim();
            
          if (normalizedName.includes(normalizedKey) || normalizedKey.includes(normalizedName)) {
            cityId = value;
            break;
          }
        }
      }
    }
    
    return {
      success: true,
      formatted: result.formatted || `${lat},${lng}`,
      details: {
        ...result.details,
        cityId: cityId
      },
      components: result.components
    };
  } catch (error) {
    console.error('Error formatting location:', error);
    return {
      success: false,
      formatted: position.lat ? `${position.lat},${position.lng}` : String(position),
      message: error.message || 'Unknown error formatting location'
    };
  }
};

/**
 * Save coordinates to storage
 * @param {Object} coordinates - Coordinates to save
 * @param {Boolean} isLoggedIn - Whether user is logged in
 */
export const saveCoordinates = (coordinates, isLoggedIn = false) => {
  if (isLoggedIn) {
    localStorage.setItem('userMapCoordinates', JSON.stringify(coordinates));
  } else {
    sessionStorage.setItem('guestLocationCoordinates', JSON.stringify(coordinates));
  }
};

/**
 * Get saved coordinates from storage
 * @param {Boolean} isLoggedIn - Whether user is logged in
 * @returns {Object|null} Saved coordinates or null
 */
export const getSavedCoordinates = (isLoggedIn = false) => {
  try {
    let savedCoords = null;
    
    if (isLoggedIn) {
      const userCoords = localStorage.getItem('userMapCoordinates');
      if (userCoords) {
        savedCoords = JSON.parse(userCoords);
      }
    } else {
      const guestCoords = sessionStorage.getItem('guestLocationCoordinates');
      if (guestCoords) {
        savedCoords = JSON.parse(guestCoords);
      }
    }
    
    if (savedCoords && savedCoords.lat && savedCoords.lng && 
        savedCoords.lat !== 0 && savedCoords.lng !== 0) {
      return savedCoords;
    }
  } catch (err) {
    console.error('Error retrieving saved coordinates:', err);
  }
  
  return null;
};

/**
 * Clear all cached geocode data
 */
export const clearGeocodeCache = () => {
  Object.keys(geocodeCache).forEach(key => delete geocodeCache[key]);
};
