const request = require('supertest');
const app = require('../src/index');
const { clearDatabase, seedTestData, generateToken } = require('./testHelper');

beforeEach(async () => {
  await clearDatabase();
});

describe('Authentication & Security', () => {
  it('should not return password hash on registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'New User',
        email: 'new@test.com',
        password: 'securepassword',
        role: 'RECEPTIONIST'
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.id).toBeDefined();
    expect(res.body.user.password).toBeUndefined();
  });

  it('should return 401 Unauthorized for expired JWT', async () => {
    const seed = await seedTestData();
    // Mint an expired token
    const expiredToken = generateToken(seed.admin, '-1h');

    const res = await request(app)
      .get('/api/patients') // Protected route
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });
});
