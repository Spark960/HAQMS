const request = require('supertest');
const app = require('../src/index');
const { clearDatabase, seedTestData, generateToken, prisma } = require('./testHelper');

beforeEach(async () => {
  await clearDatabase();
});

describe('Patients History Records API', () => {
  it('should return paginated history records sorted chronologically', async () => {
    const seed = await seedTestData();
    const token = generateToken(seed.receptionist);

    // Create 3 appointments for the patient with explicit dates
    const dates = [
      '2024-01-01T10:00:00.000Z',
      '2024-03-01T10:00:00.000Z',
      '2024-02-01T10:00:00.000Z' // Out of order
    ];

    for (const d of dates) {
      await prisma.appointment.create({
        data: {
          doctorId: seed.doctor.id,
          patientId: seed.patient.id,
          appointmentDate: new Date(d).toISOString(),
          status: 'COMPLETED',
          consultationFee: 150
        }
      });
    }

    // Call history endpoint with limit=2 to test pagination
    const res = await request(app)
      .get(`/api/patients/${seed.patient.id}/history-records?page=1&limit=2`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Pagination bounds
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(2);
    expect(res.body.pagination.totalAppointments).toBe(3);
    expect(res.body.pagination.totalPages).toBe(2);

    // Assert sorting: the most recent (March) should be first, then Feb
    const appointments = res.body.patient.appointments;
    expect(appointments.length).toBe(2);
    expect(new Date(appointments[0].appointmentDate).toISOString()).toBe('2024-03-01T10:00:00.000Z');
    expect(new Date(appointments[1].appointmentDate).toISOString()).toBe('2024-02-01T10:00:00.000Z');
  });
});
