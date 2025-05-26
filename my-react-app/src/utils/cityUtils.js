import { wilayaService } from '../services/api';

const cityNameCache = {};

/**
 * Get the wilaya name from a city/wilaya code
 * @param {string|number} cityId - The city/wilaya code
 * @returns {Promise<string>} - The city/wilaya name
 */
export const getCityNameFromCode = async (cityId) => {

  if (!cityId) return null;

  const cacheKey = String(cityId).padStart(2, '0');
  if (cityNameCache[cacheKey]) {
    return cityNameCache[cacheKey];
  }
  
  try {
    const response = await wilayaService.getWilayaByCode(cityId);
    
    if (response && response.data) {
      const wilayaName = response.data.name;
      cityNameCache[cacheKey] = wilayaName;
      return wilayaName;
    }
  } catch (error) {
    console.error(`Error fetching city name for code ${cityId}:`, error);
    const fallbackName = getFallbackCityName(cityId);
    if (fallbackName) {
      cityNameCache[cacheKey] = fallbackName;
      return fallbackName;
    }
  }
  
  return `Wilaya ${cityId}`;
};

/**
 * Fallback function to get city names without API call
 * @param {string|number} code - The city/wilaya code
 * @returns {string|null} - The city name or null if not found
 */
const getFallbackCityName = (code) => {
  const wilayaMap = {
    "01": "Adrar", "02": "Chlef", "03": "Laghouat", "04": "Oum El Bouaghi",
    "05": "Batna", "06": "Béjaïa", "07": "Biskra", "08": "Béchar",
    "09": "Blida", "10": "Bouira", "11": "Tamanrasset", "12": "Tébessa",
    "13": "Tlemcen", "14": "Tiaret", "15": "Tizi Ouzou", "16": "Alger",
    "17": "Djelfa", "18": "Jijel", "19": "Sétif", "20": "Saïda",
    "21": "Skikda", "22": "Sidi Bel Abbès", "23": "Annaba", "24": "Guelma",
    "25": "Constantine", "26": "Médéa", "27": "Mostaganem", "28": "M'Sila",
    "29": "Mascara", "30": "Ouargla", "31": "Oran", "32": "El Bayadh",
    "33": "Illizi", "34": "Bordj Bou Arréridj", "35": "Boumerdès", "36": "El Tarf",
    "37": "Tindouf", "38": "Tissemsilt", "39": "El Oued", "40": "Khenchela",
    "41": "Souk Ahras", "42": "Tipaza", "43": "Mila", "44": "Aïn Defla",
    "45": "Naâma", "46": "Aïn Témouchent", "47": "Ghardaïa", "48": "Relizane",
    "49": "El M'ghair", "50": "El Meniaa", "51": "Ouled Djellal", 
    "52": "Bordj Badji Mokhtar", "53": "Béni Abbès", "54": "Timimoun",
    "55": "Touggourt", "56": "Djanet", "57": "In Salah", "58": "In Guezzam"
  };

  const formattedCode = String(code).padStart(2, '0');
  return wilayaMap[formattedCode] || null;
};

/**
 * Convert a cityId to a wilaya name synchronously (using only fallback data)
 * @param {string|number} cityId - The city/wilaya code
 * @returns {string} - The city name or formatted code if not found
 */
export const getCityNameSync = (cityId) => {
  if (!cityId) return "Unknown";

  const cacheKey = String(cityId).padStart(2, '0');
  if (cityNameCache[cacheKey]) {
    return cityNameCache[cacheKey];
  }

  const fallbackName = getFallbackCityName(cityId);
  if (fallbackName) {
    cityNameCache[cacheKey] = fallbackName;
    return fallbackName;
  }

  return `Wilaya ${cityId}`;
};
