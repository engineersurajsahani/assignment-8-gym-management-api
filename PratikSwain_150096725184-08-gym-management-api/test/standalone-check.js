const assert = require('assert');
const User = require('../models/User');
const FitnessClass = require('../models/FitnessClass');

console.log('🧪 Starting Smoke & Logic Validation...');

// Test 1: User Schema validation & Expiry calculation
function testDateCalculation() {
  console.log('Testing 30-day date calculation for 1 month...');
  const durationMonths = 1;
  const now = new Date();
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + durationMonths * 30);

  const diffDays = Math.round((expiryDate - now) / (1000 * 60 * 60 * 24));
  assert.strictEqual(diffDays, 30, 'Expiry date must be exactly 30 days ahead');
  console.log('✅ Date calculation passed: 30 days ahead');
}

// Test 2: User schema structure
function testUserSchema() {
  console.log('Testing User schema fields and defaults...');
  const user = new User({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    membershipExpiryDate: new Date(Date.now() + 30 * 86400000)
  });

  assert.strictEqual(user.membershipTier, 'Bronze', 'Default tier should be Bronze');
  assert.strictEqual(user.membershipStatus, 'active', 'Default status should be active');
  assert.strictEqual(user.getRemainingDays(), 30, 'Remaining days should be 30');
  console.log('✅ User schema tests passed');
}

// Test 3: Fitness Class capacity constraint
function testClassCapacity() {
  console.log('Testing FitnessClass capacity logic...');
  const fitClass = new FitnessClass({
    title: 'Yoga',
    trainerName: 'Sarah',
    scheduleDate: new Date(),
    maxCapacity: 2,
    enrolledMembers: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']
  });

  assert.strictEqual(fitClass.enrolledMembers.length, 2);
  assert.strictEqual(fitClass.availableSeats, 0, 'Available seats should be 0');
  console.log('✅ Class capacity test passed');
}

function runAll() {
  try {
    testDateCalculation();
    testUserSchema();
    testClassCapacity();
    console.log('\n🎉 All local smoke tests passed successfully!');
  } catch (err) {
    console.error('❌ Validation test failed:', err);
    process.exit(1);
  }
}

runAll();
