const { sequelize } = require('../models');
const bcrypt = require('bcryptjs');

async function clearDatabase() {
  try {
    console.log('🧹 Starting database cleanup...');

    // Get all table names from PostgreSQL
    const [tables] = await sequelize.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename != 'SequelizeMeta';
    `);

    console.log(`📋 Found ${tables.length} tables to clear...`);

    // Clear all tables (PostgreSQL approach)
    for (const table of tables) {
      const tableName = table.tablename;
      try {
        await sequelize.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`);
        console.log(`✅ Cleared table: ${tableName}`);
      } catch (error) {
        console.log(`⚠️  Warning: Could not clear ${tableName}:`, error.message);
      }
    }

    console.log('🎉 Database cleared successfully!');
    return true;

  } catch (error) {
    console.error('❌ Error clearing database:', error);
    return false;
  }
}

async function createAdminUser() {
  try {
    console.log('👨‍💼 Creating admin user...');

    const { User } = require('../models');

    // Hash password
    const password = 'admin123456'; // Strong default password
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin user
    const adminUser = await User.create({
      email: 'nr_bendifallah@esi.dz',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+213123456789',
      role: 'admin',
      isActive: true,
      emailVerified: true,
      provider: 'local',
      isOAuthUser: false
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: nr_bendifallah@esi.dz');
    console.log('🔑 Password: admin123456');
    console.log('👑 Role: admin');
    console.log('🆔 User ID:', adminUser.id);

    return adminUser;

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    return null;
  }
}

async function resetDatabaseAndCreateAdmin() {
  try {
    console.log('🚀 Starting database reset process...\n');

    // Step 1: Clear database
    const cleared = await clearDatabase();
    if (!cleared) {
      console.log('❌ Failed to clear database. Exiting...');
      process.exit(1);
    }

    console.log('\n');

    // Step 2: Create admin user
    const admin = await createAdminUser();
    if (!admin) {
      console.log('❌ Failed to create admin user. Exiting...');
      process.exit(1);
    }

    console.log('\n🎉 Database reset completed successfully!');
    console.log('🔥 You can now login with the admin credentials above.');

  } catch (error) {
    console.error('💥 Fatal error during reset:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Run the reset
resetDatabaseAndCreateAdmin();
