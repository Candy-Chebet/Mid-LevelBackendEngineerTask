const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const config = require('../config/env');
const User = require('../models/User');
const Product = require('../models/Product');
const logger = require('../utils/logger');

const seedDatabase = async () => {
  try {
    await mongoose.connect(config.mongodb.uri);
    logger.info('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    logger.info('Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', config.bcrypt.rounds);
    const admin = await User.create({
      email: 'admin@example.com',
      passwordHash: adminPassword,
      role: 'admin',
    });
    logger.info('Admin user created: admin@example.com / admin123');

    // Create customer user
    const customerPassword = await bcrypt.hash('customer123', config.bcrypt.rounds);
    const customer = await User.create({
      email: 'customer@example.com',
      passwordHash: customerPassword,
      role: 'customer',
    });
    logger.info('Customer user created: customer@example.com / customer123');

    // Create sample products
    const products = await Product.insertMany([
      { name: 'Laptop', price: 99999, stock: 10 },
      { name: 'Mouse', price: 2999, stock: 50 },
      { name: 'Keyboard', price: 4999, stock: 30 },
      { name: 'Monitor', price: 29999, stock: 15 },
      { name: 'Headphones', price: 7999, stock: 25 },
    ]);
    logger.info(`Created ${products.length} sample products`);

    logger.info('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();