const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config();

// We will start the server and run full HTTP calls against it
const app = require('./server');

let server;
const PORT = 5001; // use 5001 for test to avoid any conflict

const runTests = async () => {
  try {
    const User = require('./models/User');
    const FitnessClass = require('./models/FitnessClass');
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gym-fitness-api');
    }
    console.log('🧹 Cleaning test database collections...');
    await User.deleteMany({});
    await FitnessClass.deleteMany({});
    console.log('✅ Database cleaned.');

    server = app.listen(PORT, async () => {
      console.log(`\n🚀 Test server running on port ${PORT}\n`);
      try {
        let cookie1 = '';
        let cookie2 = '';
        let cookie3 = '';
        let cookie4 = '';
        let user1Id = '';
        let user2Id = '';
        let user3Id = '';
        let user4Id = '';
        let classId = '';

        // Helper for HTTP requests
        const request = (method, path, body = null, cookie = '') => {
          return new Promise((resolve, reject) => {
            const payload = body ? JSON.stringify(body) : null;
            const headers = {
              'Content-Type': 'application/json'
            };
            if (payload) {
              headers['Content-Length'] = Buffer.byteLength(payload);
            }
            if (cookie) {
              headers['Cookie'] = cookie;
            }

            const req = http.request(
              {
                hostname: 'localhost',
                port: PORT,
                path,
                method,
                headers
              },
              (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => {
                  let parsed;
                  try {
                    parsed = JSON.parse(data);
                  } catch {
                    parsed = data;
                  }
                  const setCookieHeader = res.headers['set-cookie'];
                  const sessionCookie = setCookieHeader
                    ? setCookieHeader.map((c) => c.split(';')[0]).join('; ')
                    : '';
                  resolve({
                    status: res.statusCode,
                    body: parsed,
                    cookie: sessionCookie
                  });
                });
              }
            );

            req.on('error', reject);
            if (payload) {
              req.write(payload);
            }
            req.end();
          });
        };

        // 1. Root health check
        console.log('👉 1. Testing GET /');
        const health = await request('GET', '/');
        console.log('   Status:', health.status, '| Response:', health.body);
        if (health.status !== 200 || !health.body.success) throw new Error('Health check failed');

        // 2. Register User 1 (1 month duration)
        console.log('\n👉 2. Testing POST /api/auth/register (User 1, 1 month)');
        const reg1 = await request('POST', '/api/auth/register', {
          username: 'alice',
          email: 'alice@example.com',
          password: 'Password123',
          membershipTier: 'Gold',
          durationMonths: 1,
          emergencyContact: '123-456-7890'
        });
        console.log('   Status:', reg1.status, '| Response:', reg1.body);
        if (reg1.status !== 201) throw new Error(`Register 1 failed: ${JSON.stringify(reg1.body)}`);
        user1Id = reg1.body.data._id;

        // Check month math
        const now = new Date();
        const expiry1 = new Date(reg1.body.data.membershipExpiryDate);
        console.log(`   Registered on: ${now.toISOString().slice(0,10)}, Expiry: ${expiry1.toISOString().slice(0,10)}`);

        // 3. Login User 1
        console.log('\n👉 3. Testing POST /api/auth/login (User 1)');
        const login1 = await request('POST', '/api/auth/login', {
          username: 'alice',
          password: 'Password123'
        });
        console.log('   Status:', login1.status, '| Logged In:', login1.body.data?.username);
        if (login1.status !== 200 || !login1.cookie) throw new Error('Login 1 failed');
        cookie1 = login1.cookie;

        // 4. GET /api/auth/me (User 1)
        console.log('\n👉 4. Testing GET /api/auth/me');
        const me1 = await request('GET', '/api/auth/me', null, cookie1);
        console.log('   Status:', me1.status, '| Profile:', me1.body.data?.username, '| remainingDays:', me1.body.data?.remainingDays);
        if (me1.status !== 200 || me1.body.data?.remainingDays === undefined) throw new Error('Get me failed');

        // 5. Create Fitness Class (maxCapacity: 2)
        console.log('\n👉 5. Testing POST /api/classes (maxCapacity: 2)');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 2);
        const classRes = await request('POST', '/api/classes', {
          title: 'Spin & Core HIIT',
          trainerName: 'Marcus Vance',
          scheduleDate: tomorrow.toISOString(),
          durationMinutes: 45,
          maxCapacity: 2
        });
        console.log('   Status:', classRes.status, '| Class:', classRes.body.data?.title, '| Capacity:', classRes.body.data?.maxCapacity);
        if (classRes.status !== 201) throw new Error('Create class failed');
        classId = classRes.body.data._id;

        // 6. List classes with query filter ?trainer=Marcus
        console.log('\n👉 6. Testing GET /api/classes?trainer=Marcus');
        const listRes = await request('GET', '/api/classes?trainer=Marcus');
        console.log('   Status:', listRes.status, '| Found:', listRes.body.count, 'classes');
        if (listRes.status !== 200 || listRes.body.count < 1) throw new Error('List classes failed');

        // 7. Get class by ID
        console.log(`\n👉 7. Testing GET /api/classes/${classId}`);
        const getSingleClass = await request('GET', `/api/classes/${classId}`);
        console.log('   Status:', getSingleClass.status, '| Title:', getSingleClass.body.data?.title);
        if (getSingleClass.status !== 200) throw new Error('Get single class failed');

        // 8. Book class with User 1
        console.log(`\n👉 8. Testing POST /api/classes/${classId}/book (User 1)`);
        const book1 = await request('POST', `/api/classes/${classId}/book`, null, cookie1);
        console.log('   Status:', book1.status, '| Enrolled members count:', book1.body.data?.enrolledMembers.length);
        if (book1.status !== 200 || book1.body.data?.enrolledMembers.length !== 1) throw new Error('Book 1 failed');

        // 9. Register & Login User 2
        console.log('\n👉 9. Registering & Logging in User 2 (Bob)');
        const reg2 = await request('POST', '/api/auth/register', {
          username: 'bob',
          email: 'bob@example.com',
          password: 'Password123',
          membershipTier: 'Silver',
          durationMonths: 3
        });
        user2Id = reg2.body.data._id;
        const login2 = await request('POST', '/api/auth/login', { username: 'bob', password: 'Password123' });
        cookie2 = login2.cookie;

        // 10. Book class with User 2 -> Class capacity should be full (2/2)
        console.log(`\n👉 10. Testing POST /api/classes/${classId}/book (User 2) -> Fills capacity to 2/2`);
        const book2 = await request('POST', `/api/classes/${classId}/book`, null, cookie2);
        console.log('   Status:', book2.status, '| Enrolled members count:', book2.body.data?.enrolledMembers.length);
        if (book2.status !== 200 || book2.body.data?.enrolledMembers.length !== 2) throw new Error('Book 2 failed');

        // 11. Register & Login User 3 (Charlie)
        console.log('\n👉 11. Registering & Logging in User 3 (Charlie)');
        const reg3 = await request('POST', '/api/auth/register', {
          username: 'charlie',
          email: 'charlie@example.com',
          password: 'Password123',
          durationMonths: 6
        });
        user3Id = reg3.body.data._id;
        const login3 = await request('POST', '/api/auth/login', { username: 'charlie', password: 'Password123' });
        cookie3 = login3.cookie;

        // 12. Book class with User 3 -> Should fail with 400 "Class capacity reached"
        console.log(`\n👉 12. Testing POST /api/classes/${classId}/book (User 3) -> Expect 400 Class capacity reached`);
        const book3Full = await request('POST', `/api/classes/${classId}/book`, null, cookie3);
        console.log('   Status:', book3Full.status, '| Message:', book3Full.body.message);
        if (book3Full.status !== 400 || !book3Full.body.message.includes('Class capacity reached')) {
          throw new Error('Capacity limit check failed');
        }

        // 13. Duplicate booking attempt by User 1 -> Should fail with 400 "User is already enrolled in this class"
        console.log('\n👉 13. Testing Duplicate booking by User 1 -> Expect 400');
        const book1Dup = await request('POST', `/api/classes/${classId}/book`, null, cookie1);
        console.log('   Status:', book1Dup.status, '| Message:', book1Dup.body.message);
        if (book1Dup.status !== 400 || !book1Dup.body.message.includes('already enrolled')) {
          throw new Error('Duplicate booking check failed');
        }

        // 14. Cancel booking by User 1
        console.log(`\n👉 14. Testing DELETE /api/classes/${classId}/cancel (User 1)`);
        const cancel1 = await request('DELETE', `/api/classes/${classId}/cancel`, null, cookie1);
        console.log('   Status:', cancel1.status, '| Enrolled members count after cancel:', cancel1.body.data?.enrolledMembers.length);
        if (cancel1.status !== 200 || cancel1.body.data?.enrolledMembers.length !== 1) throw new Error('Cancel booking failed');

        // 15. Now User 3 books the newly freed spot
        console.log(`\n👉 15. Testing User 3 booking newly available spot`);
        const book3Success = await request('POST', `/api/classes/${classId}/book`, null, cookie3);
        console.log('   Status:', book3Success.status, '| Enrolled count:', book3Success.body.data?.enrolledMembers.length);
        if (book3Success.status !== 200 || book3Success.body.data?.enrolledMembers.length !== 2) throw new Error('Spot rebooking failed');

        // 16. Test Expired User behavior & Self-Healing
        console.log('\n👉 16. Creating Expired User 4 (Diana)');
        const reg4 = await request('POST', '/api/auth/register', {
          username: 'diana',
          email: 'diana@example.com',
          password: 'Password123',
          durationMonths: 1
        });
        user4Id = reg4.body.data._id;

        // Manually set diana expiry to 10 days ago in DB
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 10);
        const User = require('./models/User');
        await User.findByIdAndUpdate(user4Id, { membershipExpiryDate: pastDate, membershipStatus: 'active' });

        const login4 = await request('POST', '/api/auth/login', { username: 'diana', password: 'Password123' });
        cookie4 = login4.cookie;

        // Try booking with expired user -> Expect 400 "Membership expired"
        console.log('\n👉 17. Expired User 4 attempts to book class -> Expect 400');
        const book4Expired = await request('POST', `/api/classes/${classId}/book`, null, cookie4);
        console.log('   Status:', book4Expired.status, '| Message:', book4Expired.body.message);
        if (book4Expired.status !== 400 || !book4Expired.body.message.includes('Membership expired')) {
          throw new Error('Expired membership check failed');
        }

        // 18. Self-healing expired members query
        console.log('\n👉 18. Testing GET /api/members/expired');
        const expiredRes = await request('GET', '/api/members/expired');
        console.log('   Status:', expiredRes.status, '| Expired members found:', expiredRes.body.count);
        const healedDiana = await User.findById(user4Id);
        console.log('   Diana self-healed status in DB:', healedDiana.membershipStatus);
        if (expiredRes.status !== 200 || healedDiana.membershipStatus !== 'expired') {
          throw new Error('Self-healing expired query failed');
        }

        // 19. Renew Member 4
        console.log(`\n👉 19. Testing PATCH /api/members/${user4Id}/renew (additionalMonths: 3, tier: Platinum)`);
        const renewRes = await request('PATCH', `/api/members/${user4Id}/renew`, {
          additionalMonths: 3,
          membershipTier: 'Platinum'
        });
        console.log('   Status:', renewRes.status, '| New Expiry:', renewRes.body.data?.membershipExpiryDate, '| Status:', renewRes.body.data?.membershipStatus, '| Tier:', renewRes.body.data?.membershipTier);
        if (renewRes.status !== 200 || renewRes.body.data?.membershipStatus !== 'active' || renewRes.body.data?.membershipTier !== 'Platinum') {
          throw new Error('Member renewal failed');
        }

        // 20. Testing GET /api/members
        console.log('\n👉 20. Testing GET /api/members and filters');
        const allMembersRes = await request('GET', '/api/members');
        console.log('   Status:', allMembersRes.status, '| Total members:', allMembersRes.body.count);
        if (allMembersRes.status !== 200 || allMembersRes.body.count < 4) throw new Error('Get all members failed');

        const platinumMembers = await request('GET', '/api/members?tier=Platinum');
        console.log('   Status:', platinumMembers.status, '| Platinum members:', platinumMembers.body.count);
        if (platinumMembers.status !== 200 || platinumMembers.body.count !== 1) throw new Error('Filter members by tier failed');

        // 21. Logout User 1
        console.log('\n👉 21. Testing POST /api/auth/logout (User 1)');
        const logout1 = await request('POST', '/api/auth/logout', null, cookie1);
        console.log('   Status:', logout1.status, '| Message:', logout1.body.message);
        if (logout1.status !== 200) throw new Error('Logout failed');

        // 22. Calling GET /api/auth/me after logout -> Expect 401
        console.log('\n👉 22. Testing GET /api/auth/me after logout -> Expect 401');
        const meAfterLogout = await request('GET', '/api/auth/me', null, cookie1);
        console.log('   Status:', meAfterLogout.status, '| Message:', meAfterLogout.body.message);
        if (meAfterLogout.status !== 401) throw new Error('Auth protection after logout failed');

        console.log('\n🎉 ========================================================');
        console.log('🎉 ALL ENDPOINTS AND BUSINESS LOGIC TESTS PASSED 100%!');
        console.log('🎉 ========================================================\n');

        process.exit(0);
      } catch (err) {
        console.error('\n❌ Test failure:', err);
        process.exit(1);
      }
    });
  } catch (err) {
    console.error('\n❌ Server bootstrap failure:', err);
    process.exit(1);
  }
};

runTests();
