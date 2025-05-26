const geocodeCache = {};

export const GEOCODE_API_KEY = import.meta.env.VITE_OPENCAGE_API_KEY || '4bcabb4ac4e54f1692c1e4d811bb29e5';

export const getCurrentLocation = (options = {}) => {
  const {
    onSuccess,
    onError,
    enableHighAccuracy = true,
    timeout = 20000,
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

const wilayaMapping = (() => {
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
    'algiers': '16'
  };
  
  return { ...baseMap, ...alternativeMap };
})();

const findCityIdByState = (stateName) => {
  if (!stateName) return null;
  
  const normalizedName = stateName.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim();
  
  if (wilayaMapping[normalizedName]) {
    return wilayaMapping[normalizedName];
  }
  
  for (const [key, value] of Object.entries(wilayaMapping)) {
    if (normalizedName.includes(key)) {
      return value;
    }
    if (key.includes(normalizedName) && normalizedName.length > 3) {
      return value;
    }
  }
  
  return null;
};

export const cityIdToWilaya = (cityId, options = { normalized: false }) => {
  if (!cityId) return null;
  
  const formattedCityId = String(cityId).padStart(2, '0');
  
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
  
  return wilayaCodeToName[formattedCityId] || null;
};

export const reverseGeocode = async (latitude, longitude, language = 'en') => {
  try {
    const cacheKey = `${latitude.toFixed(6)},${longitude.toFixed(6)}_${language}`;
    
    if (geocodeCache[cacheKey]) {
      return geocodeCache[cacheKey];
    }
    
    if (!GEOCODE_API_KEY || GEOCODE_API_KEY.length < 10) {
      console.error('Invalid or missing OpenCage API key');
      return {
        success: false,
        error: true,
        message: 'Configuration error: Invalid API key',
        formatted: `${latitude},${longitude}`
      };
    }
    
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
    
    if (data.results && data.results.length > 0) {
      const components = data.results[0].components;
      
      const postalCode = components.postcode || '';
      let cityId = null;
      let methodUsed = 'none';
      
      if (postalCode && postalCode.length >= 2) {
        const postalPrefix = postalCode.substring(0, 2);
        if (/^\d{2}$/.test(postalPrefix)) {
          cityId = postalPrefix;
          methodUsed = 'postal';
        } 
      }
      
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
        cityIdMethod: methodUsed
      };
    }
    
    geocodeCache[cacheKey] = result;
    
    return result;
  } catch (error) {
    console.error('Geocoding error:', error);
    return { 
      success: false,
      error: true, 
      message: error.message || 'Failed to fetch location data',
      status: { code: error.status || 500 },
      formatted: `${latitude},${longitude}`
    };
  }
};

export const formatLocation = async (position, language = 'en') => {
  try {
    const lat = position.lat || position.latitude;
    const lng = position.lng || position.longitude;
    
    if (!lat || !lng) {
      return {
        success: false,
        formatted: `Invalid coordinates`,
        message: 'Missing latitude or longitude'
      };
    }
    
    const result = await reverseGeocode(lat, lng, language);
    
    if (!result.success) {
      return {
        success: false,
        formatted: `${lat},${lng}`,
        message: result.message || 'Geocoding failed'
      };
    }
    
    let cityId = null;
    
    if (result.details && result.details.cityId) {
      cityId = result.details.cityId;
    }
    else if (result.components && result.components.postcode) {
      const postalCode = result.components.postcode;
      if (postalCode && postalCode.length >= 2) {
        cityId = postalCode.substring(0, 2);
      }
    }
    else if (result.components) {
      const wilayaName = result.components.state || result.components.city;
      if (wilayaName) {
        const wilayaMapping = {
          'Adrar': '01', 'Chlef': '02', 'Laghouat': '03', 'Oum El Bouaghi': '04',
          'Batna': '05', 'Béjaïa': '06', 'Biskra': '07', 'Béchar': '08',
          'Blida': '09', 'Bouira': '10',
        };
        
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

export const saveCoordinates = (coordinates, isLoggedIn = false) => {
  if (isLoggedIn) {
    localStorage.setItem('userMapCoordinates', JSON.stringify(coordinates));
  } else {
    sessionStorage.setItem('guestLocationCoordinates', JSON.stringify(coordinates));
  }
};

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

export const clearGeocodeCache = () => {
  Object.keys(geocodeCache).forEach(key => delete geocodeCache[key]);
};
