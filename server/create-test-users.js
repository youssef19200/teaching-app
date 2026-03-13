require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const testUsers = [
  { 
    username: 'testgmail', 
    email: 'youssefmakboul823@gmail.com',
    password: 'password123', 
    role: 'student' 
  },
  { 
    username: 'testyahoo', 
    email: 'test@yahoo.com', 
    password: 'password123', 
    role: 'student' 
  },
  { 
    username: 'testoutlook', 
    email: 'test@outlook.com', 
    password: 'password123', 
    role: 'student' 
  },
  { 
    username: 'testteacher', 
    email: 'teacher@test.com', 
    password: 'password123', 
    role: 'teacher' 
  },
  { 
    username: 'demo', 
    email: 'demo@example.com', 
    password: 'password123', 
    role: 'student' 
  }
];

const createTestUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database\n');
    
    for (const userData of testUsers) {
      // Check if user exists
      const existing = await User.findOne({ email: userData.email });
      
      if (existing) {
        console.log(`⚠️  User already exists: ${userData.email}`);
        continue;
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Create user
      const user = new User({
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        role: userData.role
      });
      
      await user.save();
      console.log(`✅ Created: ${userData.email} (${userData.role})`);
    }
    
    console.log('\n🎉 Test users created successfully!\n');
    console.log('📋 You can now test password reset with these accounts:\n');
    testUsers.forEach(u => {
      console.log(`   📧 ${u.email}`);
      console.log(`   🔑 Password: ${u.password}`);
      console.log(`   👤 Role: ${u.role}\n`);
    });
    
    console.log('💡 Go to http://localhost:5173/forgot-password to test!\n');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

createTestUsers();