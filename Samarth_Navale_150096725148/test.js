const assert = require('assert');
const http = require('http');
const app = require('./server');

const PORT = 5566;
let server;
let member1Cookie = '';
let member2Cookie = '';
let member3Cookie = '';
let expiredMemberCookie = '';

let member1Id = '';
let member2Id = '';
let member3Id = '';
let expiredMemberId = '';
let testClassId = '';

function request(options, postData = null, cookie = '') {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        ...options,
        headers: {
          ...(postData ? { 'Content-Type': 'application/json' } : {}),
          ...(cookie ? { Cookie: cookie } : {}),
          ...(options.headers || {})
        }
      },
      (res) => {
        let body = '';
        let setCookie = '';
        if (res.headers['set-cookie']) {
          setCookie = res.headers['set-cookie'][0].split(';')[0];
        }
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            resolve({ status: res.statusCode, data: parsed, cookie: setCookie, raw: body });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body, cookie: setCookie });
          }
        });
      }
    );
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting Automated Test Suite for Assignment 8 (Gym Management API)...\n');
  server = app.listen(PORT);

  // Wait a moment for DB connection
  await new Promise((r) => setTimeout(r, 1500));

  try {
    // 1. Health check
    console.log('Test 1: Health Check (GET /)');
    const health = await request({ path: '/', method: 'GET' });
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.data.success, true);
    console.log('✅ Health check passed\n');

    // 2. Register Member 1 (1 month duration)
    console.log('Test 2: Register Member 1 with 1-month duration (POST /api/auth/register)');
    const now = Date.now();
    const reg1 = await request(
      { path: '/api/auth/register', method: 'POST' },
      {
        username: `sam_${now}`,
        email: `sam_${now}@gym.com`,
        password: 'password123',
        membershipTier: 'Gold',
        durationMonths: 1
      }
    );
    assert.strictEqual(reg1.status, 201);
    assert.strictEqual(reg1.data.success, true);
    member1Id = reg1.data.data._id;

    // Verify expiry date is ~30 days in future
    const expiry = new Date(reg1.data.data.membershipExpiryDate).getTime();
    const expectedDiff = 30 * 24 * 60 * 60 * 1000;
    const diff = expiry - now;
    assert.ok(Math.abs(diff - expectedDiff) < 10000);
    console.log(`✅ Member 1 registered with expiry ~30 days in future: ${reg1.data.data.membershipExpiryDate}\n`);

    // 3. Login Member 1 via Passport Local
    console.log('Test 3: Login Member 1 via Passport Local (POST /api/auth/login)');
    const login1 = await request(
      { path: '/api/auth/login', method: 'POST' },
      { username: `sam_${now}`, password: 'password123' }
    );
    assert.strictEqual(login1.status, 200);
    assert.strictEqual(login1.data.success, true);
    member1Cookie = login1.cookie;
    console.log(`✅ Member 1 login successful with session cookie: ${member1Cookie}\n`);

    // 4. Get Current Profile with remaining days
    console.log('Test 4: Get Profile & Days Remaining (GET /api/auth/me)');
    const me1 = await request({ path: '/api/auth/me', method: 'GET' }, null, member1Cookie);
    assert.strictEqual(me1.status, 200);
    assert.strictEqual(me1.data.success, true);
    assert.ok(me1.data.data.daysRemaining >= 29);
    console.log(`✅ Member 1 days remaining: ${me1.data.data.daysRemaining}\n`);

    // 5. Register Member 2 and Member 3
    console.log('Test 5: Register Member 2 and Member 3');
    const reg2 = await request(
      { path: '/api/auth/register', method: 'POST' },
      { username: `alex_${now}`, email: `alex_${now}@gym.com`, password: 'password123', membershipTier: 'Silver' }
    );
    member2Id = reg2.data.data._id;
    const login2 = await request(
      { path: '/api/auth/login', method: 'POST' },
      { username: `alex_${now}`, password: 'password123' }
    );
    member2Cookie = login2.cookie;

    const reg3 = await request(
      { path: '/api/auth/register', method: 'POST' },
      { username: `john_${now}`, email: `john_${now}@gym.com`, password: 'password123', membershipTier: 'Platinum' }
    );
    member3Id = reg3.data.data._id;
    const login3 = await request(
      { path: '/api/auth/login', method: 'POST' },
      { username: `john_${now}`, password: 'password123' }
    );
    member3Cookie = login3.cookie;
    console.log('✅ Member 2 and Member 3 registered and logged in\n');

    // 6. Register an Expired Member
    console.log('Test 6: Register Expired Member with 0 duration');
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    const expUser = new User({
      username: `expired_${now}`,
      email: `expired_${now}@gym.com`,
      password: await bcrypt.hash('password123', 10),
      membershipTier: 'Bronze',
      membershipStatus: 'expired',
      membershipExpiryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
    });
    await expUser.save();
    expiredMemberId = expUser._id.toString();

    const expLogin = await request(
      { path: '/api/auth/login', method: 'POST' },
      { username: `expired_${now}`, password: 'password123' }
    );
    expiredMemberCookie = expLogin.cookie;
    console.log(`✅ Expired Member created: ${expiredMemberId}\n`);

    // 7. Create Fitness Class with maxCapacity = 2
    console.log('Test 7: Create Fitness Class with maxCapacity = 2 (POST /api/classes)');
    const createClassRes = await request(
      { path: '/api/classes', method: 'POST' },
      {
        title: 'HIIT Bootcamp',
        trainerName: 'Marcus Vance',
        scheduleDate: '2026-04-20T08:00:00.000Z',
        durationMinutes: 45,
        maxCapacity: 2
      }
    );
    assert.strictEqual(createClassRes.status, 201);
    assert.strictEqual(createClassRes.data.success, true);
    testClassId = createClassRes.data.data._id;
    console.log(`✅ Class created with ID: ${testClassId}\n`);

    // 8. Book Member 1 into Class
    console.log('Test 8: Book Member 1 into Class (POST /api/classes/:id/book)');
    const book1 = await request(
      { path: `/api/classes/${testClassId}/book`, method: 'POST' },
      null,
      member1Cookie
    );
    assert.strictEqual(book1.status, 200);
    assert.strictEqual(book1.data.data.enrolledMembers.length, 1);
    console.log('✅ Member 1 booked slot 1/2\n');

    // 9. Book Member 2 into Class (Capacity full 2/2)
    console.log('Test 9: Book Member 2 into Class (POST /api/classes/:id/book)');
    const book2 = await request(
      { path: `/api/classes/${testClassId}/book`, method: 'POST' },
      null,
      member2Cookie
    );
    assert.strictEqual(book2.status, 200);
    assert.strictEqual(book2.data.data.enrolledMembers.length, 2);
    console.log('✅ Member 2 booked slot 2/2 (Class is now full)\n');

    // 10. Attempt to Book Member 3 (Expect 400 Bad Request - Capacity Reached)
    console.log('Test 10: Attempt 3rd Booking when class is full (POST /api/classes/:id/book)');
    const book3 = await request(
      { path: `/api/classes/${testClassId}/book`, method: 'POST' },
      null,
      member3Cookie
    );
    assert.strictEqual(book3.status, 400);
    assert.strictEqual(book3.data.success, false);
    assert.strictEqual(book3.data.message, 'Class capacity reached');
    console.log('✅ Over-capacity booking correctly rejected with 400 Bad Request\n');

    // 11. Attempt Booking with Expired Member (Expect 400 Bad Request - Membership Expired)
    console.log('Test 11: Attempt booking with Expired Member');
    const expBook = await request(
      { path: `/api/classes/${testClassId}/book`, method: 'POST' },
      null,
      expiredMemberCookie
    );
    assert.strictEqual(expBook.status, 400);
    assert.strictEqual(expBook.data.success, false);
    console.log('✅ Expired member booking correctly rejected with 400 Bad Request\n');

    // 12. Cancel Member 1 Booking
    console.log('Test 12: Cancel Member 1 Booking (DELETE /api/classes/:id/cancel)');
    const cancel1 = await request(
      { path: `/api/classes/${testClassId}/cancel`, method: 'DELETE' },
      null,
      member1Cookie
    );
    assert.strictEqual(cancel1.status, 200);
    assert.strictEqual(cancel1.data.data.enrolledMembers.length, 1);
    console.log('✅ Member 1 booking cancelled successfully\n');

    // 13. Now Member 3 can book the freed slot
    console.log('Test 13: Member 3 books the freed slot');
    const book3AfterCancel = await request(
      { path: `/api/classes/${testClassId}/book`, method: 'POST' },
      null,
      member3Cookie
    );
    assert.strictEqual(book3AfterCancel.status, 200);
    assert.strictEqual(book3AfterCancel.data.data.enrolledMembers.length, 2);
    console.log('✅ Member 3 successfully booked the newly opened slot\n');

    // 14. Get Expired Members List
    console.log('Test 14: Get Expired Members (GET /api/members/expired)');
    const expList = await request({ path: '/api/members/expired', method: 'GET' });
    assert.strictEqual(expList.status, 200);
    assert.ok(expList.data.data.some((m) => m._id === expiredMemberId));
    console.log(`✅ Expired members fetched (${expList.data.data.length} found)\n`);

    // 15. Renew Expired Member
    console.log('Test 15: Renew Expired Member (PATCH /api/members/:id/renew)');
    const renew = await request(
      { path: `/api/members/${expiredMemberId}/renew`, method: 'PATCH' },
      { additionalMonths: 6, tier: 'Platinum' }
    );
    assert.strictEqual(renew.status, 200);
    assert.strictEqual(renew.data.success, true);
    assert.strictEqual(renew.data.data.membershipTier, 'Platinum');
    assert.strictEqual(renew.data.data.membershipStatus, 'active');
    console.log(`✅ Membership renewed for 6 months: Expiry is now ${renew.data.data.membershipExpiryDate}\n`);

    // 16. Logout
    console.log('Test 16: Logout Member 1 (POST /api/auth/logout)');
    const logoutRes = await request(
      { path: '/api/auth/logout', method: 'POST' },
      null,
      member1Cookie
    );
    assert.strictEqual(logoutRes.status, 200);
    console.log('✅ Logout successful\n');

    console.log('🎉 ALL 16 TESTS PASSED SUCCESSFULLY! 100% VERIFIED.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
}

runTests();
