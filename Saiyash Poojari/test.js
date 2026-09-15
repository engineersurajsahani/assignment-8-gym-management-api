const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

process.env.NODE_ENV = 'test';
process.env.PORT = '5002';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gym_management_test';

const app = require('./server');
const User = require('./models/User');
const FitnessClass = require('./models/FitnessClass');

let server;

async function runTests() {
  console.log('🧪 Starting Gym API Comprehensive Test Suite...\n');

  try {
    // 1. Connect DB & Start Server
    await mongoose.connect(process.env.MONGO_URI);
    await User.deleteMany({});
    await FitnessClass.deleteMany({});

    await new Promise((resolve) => {
      server = app.listen(5002, resolve);
    });
    console.log('✅ Test server running on port 5002\n');

    const baseUrl = 'http://localhost:5002';
    let cookieMember1 = '';
    let cookieMember2 = '';
    let cookieMember3 = '';
    let cookieExpired = '';

    let member1Id = '';
    let member2Id = '';
    let member3Id = '';
    let expiredMemberId = '';
    let testClassId = '';

    // Test 1: Register Member with 1-month duration
    console.log('Test 1: Registering member with 1-month duration...');
    const regRes1 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'sam_fit',
        email: 'sam@fit.com',
        password: 'password123',
        membershipTier: 'Gold',
        durationMonths: 1
      })
    });
    const regData1 = await regRes1.json();
    if (regRes1.status !== 201) throw new Error(`Registration 1 failed: ${JSON.stringify(regData1)}`);
    member1Id = regData1.user._id;

    const expiryDate = new Date(regData1.user.membershipExpiryDate);
    const now = new Date();
    const daysDiff = Math.round((expiryDate - now) / (1000 * 60 * 60 * 24));
    console.log(` -> Member 1 registered. Expiry date calculated as ~${daysDiff} days in future.`);
    if (daysDiff < 28 || daysDiff > 32) throw new Error('1-month expiry date calculation incorrect!');
    console.log(' PASSED!\n');

    // Register Member 2 & Member 3
    const regRes2 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'alex_fit',
        email: 'alex@fit.com',
        password: 'password123',
        membershipTier: 'Silver',
        durationMonths: 2
      })
    });
    const regData2 = await regRes2.json();
    member2Id = regData2.user._id;

    const regRes3 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'john_fit',
        email: 'john@fit.com',
        password: 'password123',
        membershipTier: 'Bronze',
        durationMonths: 1
      })
    });
    const regData3 = await regRes3.json();
    member3Id = regData3.user._id;

    // Create an expired member manually
    const pastDate = new Date();
    pastDate.setMonth(pastDate.getMonth() - 2);
    const expiredUser = new User({
      username: 'expired_bob',
      email: 'bob@expired.com',
      password: 'password123',
      membershipTier: 'Bronze',
      membershipStatus: 'expired',
      membershipExpiryDate: pastDate
    });
    await expiredUser.save();
    expiredMemberId = expiredUser._id.toString();

    // Test 2: Login via Passport Local & Session Cookie
    console.log('Test 2: Passport Local Login for member 1...');
    const loginRes1 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'sam_fit', password: 'password123' })
    });
    const loginData1 = await loginRes1.json();
    if (loginRes1.status !== 200) throw new Error(`Login failed: ${JSON.stringify(loginData1)}`);
    cookieMember1 = loginRes1.headers.get('set-cookie');
    console.log(' -> Login successful, session cookie obtained. PASSED!\n');

    // Login member 2, 3, and expired user
    const loginRes2 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alex_fit', password: 'password123' })
    });
    cookieMember2 = loginRes2.headers.get('set-cookie');

    const loginRes3 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'john_fit', password: 'password123' })
    });
    cookieMember3 = loginRes3.headers.get('set-cookie');

    const loginResExp = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'expired_bob', password: 'password123' })
    });
    cookieExpired = loginResExp.headers.get('set-cookie');

    // Test 3: GET /api/auth/me (Fetch Profile & Remaining Days)
    console.log('Test 3: Fetching profile & remaining days (/api/auth/me)...');
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: cookieMember1 }
    });
    const meData = await meRes.json();
    if (meRes.status !== 200) throw new Error(`GET /me failed: ${JSON.stringify(meData)}`);
    console.log(` -> Remaining Days: ${meData.remainingDays}`);
    if (typeof meData.remainingDays !== 'number') throw new Error('remainingDays missing!');
    console.log(' PASSED!\n');

    // Test 4: Create Workout Class (maxCapacity: 2)
    console.log('Test 4: Creating workout class (maxCapacity: 2)...');
    const classRes = await fetch(`${baseUrl}/api/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'HIIT Express',
        trainerName: 'Maria',
        scheduleDate: '2026-04-15T09:00:00Z',
        durationMinutes: 45,
        maxCapacity: 2
      })
    });
    const classData = await classRes.json();
    if (classRes.status !== 201) throw new Error(`Create class failed: ${JSON.stringify(classData)}`);
    testClassId = classData.fitnessClass._id;
    console.log(' -> Fitness class created successfully. PASSED!\n');

    // Test 5: Book 2 members into class (Capacity: 2)
    console.log('Test 5: Booking 2 members into class...');
    const bookRes1 = await fetch(`${baseUrl}/api/classes/${testClassId}/book`, {
      method: 'POST',
      headers: { Cookie: cookieMember1 }
    });
    if (bookRes1.status !== 200) throw new Error('Member 1 booking failed');

    const bookRes2 = await fetch(`${baseUrl}/api/classes/${testClassId}/book`, {
      method: 'POST',
      headers: { Cookie: cookieMember2 }
    });
    if (bookRes2.status !== 200) throw new Error('Member 2 booking failed');
    console.log(' -> 2 members booked successfully. PASSED!\n');

    // Test 6: Attempt 3rd member booking -> Verify Capacity Limit Reached (400)
    console.log('Test 6: Booking 3rd member into class (Should fail with 400)...');
    const bookRes3 = await fetch(`${baseUrl}/api/classes/${testClassId}/book`, {
      method: 'POST',
      headers: { Cookie: cookieMember3 }
    });
    const bookData3 = await bookRes3.json();
    console.log(` -> Response Status: ${bookRes3.status}, Response:`, bookData3);
    if (bookRes3.status !== 400 || !bookData3.error.toLowerCase().includes('capacity')) {
      throw new Error('Overbooking constraint check failed!');
    }
    console.log(' -> Successfully prevented over-enrollment! PASSED!\n');

    // Test 7: Expired member booking attempt -> Verify Failure (400)
    console.log('Test 7: Booking attempt by expired member (Should fail with 400)...');
    const bookResExp = await fetch(`${baseUrl}/api/classes/${testClassId}/book`, {
      method: 'POST',
      headers: { Cookie: cookieExpired }
    });
    const bookDataExp = await bookResExp.json();
    console.log(` -> Response Status: ${bookResExp.status}, Response:`, bookDataExp);
    if (bookResExp.status !== 400) throw new Error('Expired member booking check failed!');
    console.log(' -> Successfully blocked expired member booking! PASSED!\n');

    // Test 8: Renew Membership (PATCH /api/members/:id/renew)
    console.log('Test 8: Renewing expired membership (6 months, Platinum tier)...');
    const renewRes = await fetch(`${baseUrl}/api/members/${expiredMemberId}/renew`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ additionalMonths: 6, tier: 'Platinum' })
    });
    const renewData = await renewRes.json();
    if (renewRes.status !== 200) throw new Error(`Renewal failed: ${JSON.stringify(renewData)}`);
    console.log(' -> Renewal Response User:', renewData.user);
    if (renewData.user.membershipTier !== 'Platinum' || renewData.user.membershipStatus !== 'active') {
      throw new Error('Renewal fields not updated properly!');
    }
    console.log(' -> Membership renewed successfully! PASSED!\n');

    // Test 9: Get Expired Members (GET /api/members/expired)
    console.log('Test 9: Querying expired members (/api/members/expired)...');
    const expiredRes = await fetch(`${baseUrl}/api/members/expired`);
    const expiredData = await expiredRes.json();
    if (expiredRes.status !== 200) throw new Error(`GET /expired failed: ${JSON.stringify(expiredData)}`);
    console.log(` -> Found ${expiredData.count} expired member(s). PASSED!\n`);

    console.log('🎉 ALL INTEGRATION TESTS PASSED WITH 100% SUCCESS!\n');
  } catch (err) {
    console.error('❌ Test Failed:', err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await mongoose.connection.close();
  }
}

runTests();
