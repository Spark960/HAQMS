const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

const generateToken = (user, expiresIn = '1h') => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

const clearDatabase = async () => {
  const tableNames = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;
  
  for (const { tablename } of tableNames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
      } catch (error) {
        console.error({ error });
      }
    }
  }
};

const seedTestData = async () => {
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const admin = await prisma.user.create({
    data: {
      name: 'Test Admin',
      email: 'admin@test.com',
      password: passwordHash,
      role: 'ADMIN',
    }
  });

  const receptionist = await prisma.user.create({
    data: {
      name: 'Test Receptionist',
      email: 'receptionist@test.com',
      password: passwordHash,
      role: 'RECEPTIONIST',
    }
  });

  const doctorUser = await prisma.user.create({
    data: {
      name: 'Dr. John Doe',
      email: 'doctor@test.com',
      password: passwordHash,
      role: 'DOCTOR',
    }
  });

  const doctor = await prisma.doctor.create({
    data: {
      userId: doctorUser.id,
      name: doctorUser.name,
      specialization: 'Cardiology',
      department: 'Heart Center',
      consultationFee: 150.00,
      experience: 10
    }
  });

  const patient = await prisma.patient.create({
    data: {
      name: 'Test Patient',
      email: 'patient@test.com',
      phoneNumber: '1234567890',
      age: 30,
      gender: 'Male',
      medicalHistory: 'None'
    }
  });

  return { admin, receptionist, doctorUser, doctor, patient };
};

module.exports = {
  prisma,
  generateToken,
  clearDatabase,
  seedTestData,
};
