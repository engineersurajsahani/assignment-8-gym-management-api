const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const FitnessClass = require('../models/FitnessClass');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await FitnessClass.deleteMany({});
});

describe('Gym & Fitness Club Management API Test Suite', () => {
  describe('Authentication & Membership Date Calculation', () => {
    test('1. Register member with 1-month plan calculates expiry exactly 30 days in future', async () => {
      const now = new Date();
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'fit_sam',
          email: 'sam@fit.com',
          password: 'mypassword',
          membershipTier: 'Gold',
          durationMonths: 1,
          emergencyContact: '123-456-7890'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('fit_sam');
      expect(res.body.data.membershipTier).toBe('Gold');
      expect(res.body.data.membershipStatus).toBe('active');

      const expiryDate = new Date(res.body.data.membershipExpiryDate);
      const diffDays = Math.round((expiryDate - now) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(30);
    });

    test('2. Member Login and Session Profile Retrieval (/api/auth/me)', async () => {
      // Register
      const agent = request.agent(app);
      await agent
        .post('/api/auth/register')
        .send({
          username: 'alex_runner',
          email: 'alex@fit.com',
          password: 'runnerpassword',
          durationMonths: 2
        });

      // Login
      const loginRes = await agent
        .post('/api/auth/login')
        .send({
          username: 'alex_runner',
          password: 'runnerpassword'
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data.remainingDays).toBeGreaterThan(0);

      // Access Me
      const meRes = await agent.get('/api/auth/me');
      expect(meRes.status).toBe(200);
      expect(meRes.body.data.email).toBe('alex@fit.com');
      expect(meRes.body.data.remainingDays).toBeGreaterThanOrEqual(59);
    });
  });

  describe('Fitness Class Management & Capacity Constraints', () => {
    test('3. Class Capacity Limit: 3rd booking into a maxCapacity=2 class fails with 400', async () => {
      // Create Agents for 3 members
      const agent1 = request.agent(app);
      const agent2 = request.agent(app);
      const agent3 = request.agent(app);

      // Register 3 members
      await agent1.post('/api/auth/register').send({
        username: 'user1',
        email: 'user1@test.com',
        password: 'pass123Password'
      });

      await agent2.post('/api/auth/register').send({
        username: 'user2',
        email: 'user2@test.com',
        password: 'pass123Password'
      });

      await agent3.post('/api/auth/register').send({
        username: 'user3',
        email: 'user3@test.com',
        password: 'pass123Password'
      });

      // Create a class with maxCapacity = 2
      const classRes = await agent1.post('/api/classes').send({
        title: 'HIIT Bootcamp',
        trainerName: 'Coach Carter',
        scheduleDate: new Date(Date.now() + 86400000).toISOString(),
        durationMinutes: 45,
        maxCapacity: 2
      });

      expect(classRes.status).toBe(201);
      const classId = classRes.body.data._id;

      // Book User 1 (1st seat)
      const book1 = await agent1.post(`/api/classes/${classId}/book`);
      expect(book1.status).toBe(200);
      expect(book1.body.data.enrolledMembers.length).toBe(1);

      // Book User 2 (2nd seat - full capacity)
      const book2 = await agent2.post(`/api/classes/${classId}/book`);
      expect(book2.status).toBe(200);
      expect(book2.body.data.enrolledMembers.length).toBe(2);

      // Book User 3 (3rd booking must fail)
      const book3 = await agent3.post(`/api/classes/${classId}/book`);
      expect(book3.status).toBe(400);
      expect(book3.body.message).toMatch(/capacity reached/i);
    });

    test('4. Cancel Booking frees up seat for waiting members', async () => {
      const agent1 = request.agent(app);
      const agent2 = request.agent(app);

      await agent1.post('/api/auth/register').send({
        username: 'cancel_user1',
        email: 'c1@test.com',
        password: 'pass123Password'
      });

      await agent2.post('/api/auth/register').send({
        username: 'cancel_user2',
        email: 'c2@test.com',
        password: 'pass123Password'
      });

      const classRes = await agent1.post('/api/classes').send({
        title: 'Yoga Flow',
        trainerName: 'Sarah',
        scheduleDate: new Date(Date.now() + 86400000).toISOString(),
        maxCapacity: 1
      });

      const classId = classRes.body.data._id;

      // User 1 books the only seat
      await agent1.post(`/api/classes/${classId}/book`);

      // User 2 cannot book
      const failedBook = await agent2.post(`/api/classes/${classId}/book`);
      expect(failedBook.status).toBe(400);

      // User 1 cancels
      const cancelRes = await agent1.delete(`/api/classes/${classId}/cancel`);
      expect(cancelRes.status).toBe(200);

      // User 2 can now book
      const successBook = await agent2.post(`/api/classes/${classId}/book`);
      expect(successBook.status).toBe(200);
      expect(successBook.body.data.enrolledMembers.length).toBe(1);
    });
  });

  describe('Membership Renewal & Expired Members Query', () => {
    test('5. Query Expired Members and Renew Membership', async () => {
      // Create user with past expiry date
      const pastDate = new Date(Date.now() - 10 * 86400000); // 10 days ago
      const expiredUser = await User.create({
        username: 'expired_user',
        email: 'expired@fit.com',
        password: 'hashedpassword',
        membershipTier: 'Bronze',
        membershipStatus: 'expired',
        membershipExpiryDate: pastDate
      });

      // Query /api/members/expired
      const expiredRes = await request(app).get('/api/members/expired');
      expect(expiredRes.status).toBe(200);
      expect(expiredRes.body.count).toBeGreaterThanOrEqual(1);
      expect(expiredRes.body.data.some((u) => u.username === 'expired_user')).toBe(true);

      // Authenticate an admin/user to perform renewal
      const agent = request.agent(app);
      await agent.post('/api/auth/register').send({
        username: 'admin_renew',
        email: 'admin@fit.com',
        password: 'adminpassword'
      });

      // Renew expired user for 3 months with Platinum tier
      const renewRes = await agent
        .patch(`/api/members/${expiredUser._id}/renew`)
        .send({
          additionalMonths: 3,
          tier: 'Platinum'
        });

      expect(renewRes.status).toBe(200);
      expect(renewRes.body.data.membershipTier).toBe('Platinum');
      expect(renewRes.body.data.membershipStatus).toBe('active');
      expect(renewRes.body.data.remainingDays).toBeGreaterThanOrEqual(89);
    });
  });
});
