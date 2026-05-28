const { execSync } = require('child_process');
const path = require('path');

module.exports = async () => {
  // Set environment to test
  process.env.NODE_ENV = 'test';
  
  // Load .env.test variables
  require('dotenv').config({ path: path.resolve(__dirname, '../.env.test') });
  
  console.log('🔄 Setting up test database...');
  
  // Reset the database, applying all migrations (including raw SQL migrations)
  // --force avoids the interactive prompt
  // --skip-seed prevents default dev seed data
  execSync('npx prisma migrate reset --force --skip-seed', { stdio: 'inherit' });
  
  console.log('✅ Test database ready');
};
