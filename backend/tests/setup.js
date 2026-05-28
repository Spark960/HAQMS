const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.test') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});
