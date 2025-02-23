// controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');


// Max token age: 3 days
const maxAge = 3 * 24 * 60 * 60;

// Function to create JWT token
const createToken = (id) => {
  return jwt.sign({ id }, 'net ninja secret', { expiresIn: maxAge });
};

// Handle errors (customized for various cases)
const handleErrors = (err) => {
  let errors = { email: '', password: '' };

  if (err.message === ' ') {
    errors.email = 'That email is not registered';
  }
  if (err.message === 'incorrect password') {
    errors.password = 'That password is incorrect';
  }

  if (err.code === 11000) {
    errors.email = 'That email is already registered';
    return errors;
  }

  if (err.message.includes('User validation failed')) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }

  return errors;
};

// Handle signup
module.exports.signup_post = async (req, res) => {
  const { username, email, dateOfBirth, location, bloodType, gender, password, isDonor, phoneNumber } = req.body;

  try {
    await User.checkExisting({ email, phoneNumber, password });

    const user = await User.create({
      username,  // Even if the username repeats, MongoDB will allow it
      email,
      dateOfBirth,
      location,
      bloodType,
      gender,
      password,
      isDonor,
      phoneNumber,
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};



// Handle login
module.exports.login_post = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.login(email, password); // Assuming User model has login method

    const payload = { userId: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });


    

  } catch (err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }
};

module.exports.dashboard_get =  async (req, res) => {
  try {
      const user = await User.findById(req.user.userId).select('-password');
      res.json({
        msg: `${user.email}`,
      });
  } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
  }
};

const haversineDistance = (coords1, coords2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  
  const [lat1, lon1] = coords1;
  const [lat2, lon2] = coords2;

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

module.exports.nearby_get = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !user.location) {
      return res.status(400).json({ msg: 'User location not found.' });
    }

    const userLocation = user.location.split(',').map(Number); // Convert to [latitude, longitude]

    // Fetch all users who are donors except the current user
    const donors = await User.find({
      isDonor: true,
      _id: { $ne: req.user.userId }, // Exclude the current user
    });

    // Calculate distances for each donor
    const donorsWithDistance = donors.map((donor) => {
      const donorLocation = donor.location.split(',').map(Number); // Convert to [latitude, longitude]
      const distance = haversineDistance(userLocation, donorLocation);
      return { ...donor._doc, distance }; // Spread donor fields and add distance
    });

    // Sort donors by distance (ascending)
    donorsWithDistance.sort((a, b) => a.distance - b.distance);

    res.json(donorsWithDistance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};



