const { User } = require('../models');
const bcrypt = require('bcryptjs');

async function createCustomer() {
  try {
    console.log('👤 Creating customer user...');

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email: 'bendifallahrachid@gmail.com' }
    });

    if (existingUser) {
      console.log('⚠️  User already exists with this email!');
      console.log('📧 Email:', existingUser.email);
      console.log('👑 Role:', existingUser.role);
      console.log('🆔 User ID:', existingUser.id);
      return existingUser;
    }

    // Hash password
    const password = 'customer123'; // Simple password for testing
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create customer user
    const customerUser = await User.create({
      email: 'bendifallahrachid@gmail.com',
      password: hashedPassword,
      firstName: 'Rachid',
      lastName: 'Bendifallah',
      phone: '+213123456780',
      role: 'customer',
      isActive: true,
      emailVerified: true,
      provider: 'local',
      isOAuthUser: false
    });

    console.log('✅ Customer user created successfully!');
    console.log('📧 Email: bendifallahrachid@gmail.com');
    console.log('🔑 Password: customer123');
    console.log('👤 Role: customer');
    console.log('👋 Name: Rachid Bendifallah');
    console.log('🆔 User ID:', customerUser.id);

    return customerUser;

  } catch (error) {
    console.error('❌ Error creating customer user:', error);
    return null;
  }
}

async function main() {
  try {
    console.log('🚀 Adding customer user...\n');

    const customer = await createCustomer();
    
    if (customer) {
      console.log('\n🎉 Customer user ready for testing!');
      console.log('🔥 You can now login with the customer credentials above.');
    } else {
      console.log('\n❌ Failed to create customer user.');
    }

  } catch (error) {
    console.error('💥 Fatal error:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
main();
