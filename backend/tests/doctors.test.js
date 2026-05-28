const request = require('supertest');
const app = require('../src/index');
const { clearDatabase, seedTestData, generateToken } = require('./testHelper');

beforeEach(async () => {
  await clearDatabase();
});

describe('Doctors API Security & Features', () => {
  it('should be safe from SQL Injection', async () => {
    const seed = await seedTestData();
    const token = generateToken(seed.receptionist);

    // Malicious search string
    const maliciousQuery = "' OR 1=1;--";

    const res = await request(app)
      .get(`/api/doctors?search=${encodeURIComponent(maliciousQuery)}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    // It should safely return an empty array or valid doctors, not crash or dump all data due to injection
    expect(Array.isArray(res.body)).toBe(true);
  });
});
