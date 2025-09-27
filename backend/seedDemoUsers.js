const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// User Schema (simplified version)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  role: { 
    type: String, 
    enum: ['resident', 'premium_resident', 'collector', 'admin'],
    default: 'resident'
  },
  isPremium: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

const demoUsers = [
  {
    name: 'Admin User',
    email: 'admin@demo.com',
    password: 'password123',
    phone: '+1234567890',
    role: 'admin',
    address: {
      street: '123 Admin St',
      city: 'Admin City',
      state: 'AC',
      zipCode: '12345'
    }
  },
  {
    name: 'John Resident',
    email: 'resident@demo.com',
    password: 'password123',
    phone: '+1234567891',
    role: 'resident',
    address: {
      street: '456 Resident Ave',
      city: 'Resident City',
      state: 'RC',
      zipCode: '67890'
    }
  },
  {
    name: 'Jane Premium',
    email: 'premium@demo.com',
    password: 'password123',
    phone: '+1234567892',
    role: 'premium_resident',
    isPremium: true,
    premiumExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    address: {
      street: '789 Premium Blvd',
      city: 'Premium City',
      state: 'PC',
      zipCode: '54321'
    }
  },
  {
    name: 'Mike Collector',
    email: 'collector@demo.com',
    password: 'password123',
    phone: '+1234567893',
    role: 'collector',
    address: {
      street: '321 Collector St',
      city: 'Collector City',
      state: 'CC',
      zipCode: '98765'
    }
  }
];

async function seedUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing users (optional - remove this if you want to keep existing users)
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create demo users
    for (const userData of demoUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`Created user: ${user.name} (${user.email})`);
    }

    console.log('✅ Demo users created successfully!');
    console.log('\nDemo Accounts:');
    console.log('Admin: admin@demo.com / password123');
    console.log('Resident: resident@demo.com / password123');
    console.log('Premium: premium@demo.com / password123');
    console.log('Collector: collector@demo.com / password123');

  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
}

// Run the seeder
seedUsers();
