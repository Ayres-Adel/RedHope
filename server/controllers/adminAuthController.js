const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');


const maxAge = 3 * 24 * 60 * 60;


const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: maxAge
  });
};

module.exports.login_post = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.login(email, password);
    
    if (!admin.isActive) {
      return res.status(401).json({ error: 'Account is disabled' });
    }
    
    const token = createToken(admin._id);
    
    res.status(200).json({
      adminId: admin._id,
      token,
      role: admin.role,
      username: admin.username,
      permissions: admin.permissions
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(400).json({ error: err.message });
  }
};

module.exports.get_admin_profile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password');
    
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    res.json(admin);
  } catch (err) {
    console.error('Error fetching admin profile:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
