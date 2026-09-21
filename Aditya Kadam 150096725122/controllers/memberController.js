const User = require('../models/User');

const renewMembership = async (req, res) => {
  try {
    const { durationDays, membershipTier } = req.body;
    const member = await User.findById(req.params.id);
    
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    const days = durationDays || 30;
    
    let newExpiryDate;
    if (member.membershipStatus === 'expired' || new Date() > member.membershipExpiryDate) {
      newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + days);
    } else {
      newExpiryDate = new Date(member.membershipExpiryDate);
      newExpiryDate.setDate(newExpiryDate.getDate() + days);
    }
    
    member.membershipExpiryDate = newExpiryDate;
    member.membershipStatus = 'active';
    
    if (membershipTier) {
      member.membershipTier = membershipTier;
    }
    
    await member.save();
    
    const memberResponse = member.toObject();
    delete memberResponse.password;
    memberResponse.remainingDays = member.getRemainingDays();
    
    res.json({ 
      message: 'Membership renewed successfully', 
      member: memberResponse,
      newExpiryDate: member.membershipExpiryDate
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to renew membership', details: error.message });
  }
};

const getExpiredMemberships = async (req, res) => {
  try {
    const expiredMembers = await User.find({
      $or: [
        { membershipStatus: 'expired' },
        { membershipExpiryDate: { $lt: new Date() } }
      ]
    }).select('-password');
    
    const membersWithDays = expiredMembers.map(member => {
      const memberObj = member.toObject();
      memberObj.daysSinceExpiry = Math.abs(member.getRemainingDays());
      return memberObj;
    });
    
    res.json(membersWithDays);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expired memberships' });
  }
};

module.exports = { renewMembership, getExpiredMemberships };
