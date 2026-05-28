const request = require('supertest');
const app = require('../src/index');
const { clearDatabase, seedTestData, generateToken } = require('./testHelper');

beforeEach(async () => {
  await clearDatabase();
});

describe('Appointments API Constraints', () => {
  it('should prevent double-booking the same doctor at the exact same time', async () => {
    const seed = await seedTestData();
    const token = generateToken(seed.receptionist);

    const appointmentPayload = {
      patientId: seed.patient.id,
      doctorId: seed.doctor.id,
      appointmentDate: new Date('2030-01-01T10:00:00.000Z').toISOString(),
      reason: 'Checkup'
    };

    // First booking should succeed
    const res1 = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(appointmentPayload);

    expect(res1.status).toBe(201);
    expect(res1.body.appointment).toBeDefined();

    // Second booking at the exact same time for the same doctor should fail (raw SQL partial index)
    const res2 = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(appointmentPayload);

    // Depending on error handling, Prisma throws P2002 for unique constraint violations,
    // which the backend should return as 400 or 500. We assert it fails, not 201.
    expect(res2.status).not.toBe(201);
    expect(res2.body.error).toBeDefined();
  });
});
