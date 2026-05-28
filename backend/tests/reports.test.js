const request = require('supertest');
const app = require('../src/index');
const { clearDatabase, seedTestData, generateToken, prisma } = require('./testHelper');

beforeEach(async () => {
  await clearDatabase();
});

describe('Reports Concurrency & Correctness', () => {
  it('should process bounded requests correctly and match expected revenue', async () => {
    const seed = await seedTestData();
    const token = generateToken(seed.admin); // Reports is Admin only

    // Create 10 more doctors and seed 1 appointment for each
    const passwordHash = seed.admin.password; // reuse hash

    for (let i = 0; i < 10; i++) {
      const u = await prisma.user.create({
        data: {
          name: `Dr. Rep ${i}`,
          email: `rep${i}@test.com`,
          password: passwordHash,
          role: 'DOCTOR'
        }
      });
      const d = await prisma.doctor.create({
        data: {
          userId: u.id,
          name: u.name,
          specialization: 'General',
          department: 'General',
          consultationFee: 100,
          experience: 5
        }
      });
      await prisma.appointment.create({
        data: {
          doctorId: d.id,
          patientId: seed.patient.id,
          appointmentDate: new Date().toISOString(),
          status: 'COMPLETED',
          consultationFee: 100
        }
      });
    }

    // Now seed an appointment for the original doctor (Fee 150)
    await prisma.appointment.create({
      data: {
        doctorId: seed.doctor.id,
        patientId: seed.patient.id,
        appointmentDate: new Date().toISOString(),
        status: 'COMPLETED',
        consultationFee: 150
      }
    });

    const res = await request(app)
      .get('/api/reports/doctor-stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    
    // There should be exactly 11 doctors in the report (1 seed + 10 loop)
    expect(res.body.data.length).toBe(11);

    // Total revenue should be 10*100 + 1*150 = 1150
    const totalRev = res.body.data.reduce((sum, doc) => sum + doc.revenue, 0);
    expect(totalRev).toBe(1150);
  });
});
