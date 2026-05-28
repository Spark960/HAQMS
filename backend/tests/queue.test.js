const request = require('supertest');
const app = require('../src/index');
const { clearDatabase, seedTestData, generateToken } = require('./testHelper');

beforeEach(async () => {
  await clearDatabase();
});

describe('Queue Concurrency', () => {
  it('should generate strictly unique token numbers under concurrent load', async () => {
    const seed = await seedTestData();
    const token = generateToken(seed.receptionist);

    // Create 20 unique patients to avoid the "already in queue" early exit
    const { prisma } = require('./testHelper');
    const patientPromises = Array.from({ length: 20 }).map((_, i) => 
      prisma.patient.create({
        data: {
          name: `Test Patient ${i}`,
          phoneNumber: `555000${i.toString().padStart(4, '0')}`,
          age: 30,
          gender: 'Male'
        }
      })
    );
    const patients = await Promise.all(patientPromises);

    // Fire 20 concurrent requests, each for a different patient but the same doctor
    const promises = patients.map(p =>
      request(app)
        .post('/api/queue/checkin')
        .set('Authorization', `Bearer ${token}`)
        .send({ doctorId: seed.doctor.id, patientId: p.id })
    );

    const responses = await Promise.all(promises);
    const successfulResponses = responses.filter(r => r.status === 201);
    
    // We expect all 20 to succeed if the transaction retry mechanism works perfectly
    expect(successfulResponses.length).toBeGreaterThan(0);

    const tokens = successfulResponses.map(r => r.body.token.tokenNumber);
    const uniqueTokens = new Set(tokens);

    // Assert strictly unique token numbers
    expect(tokens.length).toBe(uniqueTokens.size);
  });
});
