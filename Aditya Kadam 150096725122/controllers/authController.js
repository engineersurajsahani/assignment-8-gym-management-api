const User = require('../models/User');

const register = async (req, res) => {
  try {
    const { username, email, password, membershipTier, membershipDuration, emergencyContact } = req.body;
    
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email or username' });
    }
    
    const durationDays = membershipDuration || 30;
    const membershipExpiryDate = new Date();
    membershipExpiryDate.setDate(membershipExpiryDate.getDate() + durationDays);
    
    const user = new User({
      username,
      email,
      password,
      membershipTier: membershipTier || 'Bronze',
      membershipExpiryDate,
      emergencyContact
    });
    
    await user.save();
    
    req.login(user, (err) => {
      if (err) return res.status(500).json({ error: 'Login failed after registration' });
      
      const userResponse = user.toObject();
      delete userResponse.password;
      userResponse.remainingDays = user.getRemainingDays();
      
      res.status(201).json({ message: 'Registration successful', user: userResponse });
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
};

const login = (req, res) => {
  const user = req.user.toObject();
  delete user.password;
  user.remainingDays = req.user.getRemainingDays();
  
  res.json({ message: 'Login successful', user });
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.checkAndUpdateExpiry();
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    userResponse.remainingDays = user.getRemainingDays();
    
    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user profile' });
  }
};

const logout = (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ message: 'Logout successful' });
  });
};

module.exports = { register, login, getCurrentUser, logout };
