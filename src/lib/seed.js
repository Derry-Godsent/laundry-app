// Run with: node src/seed.js
const mongoose = require('mongoose');
const Client = require('./models/Client');
const Service = require('./models/Service');

mongoose.connect('mongodb://localhost:27017/chapman');

const clients = [ /* your 26 clients from workbook */ ];
const services = [ /* your 36 services from workbook */ ];

async function seed() {
  await Client.deleteMany({});
  await Service.deleteMany({});
  
  await Client.insertMany(clients);
  await Service.insertMany(services);
  
  console.log('✅ Database seeded!');
  process.exit();
}

seed();