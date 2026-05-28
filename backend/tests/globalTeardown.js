const { PrismaClient } = require('@prisma/client');

module.exports = async () => {
  const prisma = new PrismaClient();
  await prisma.$disconnect();
  console.log('🛑 Global Teardown Complete');
};
