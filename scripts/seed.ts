import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Customer } from '../src/models/Customer';
import { Job } from '../src/models/Job';
import { Activity } from '../src/models/Activity';
import { Technician } from '../src/models/Technician';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

let MONGODB_URI = process.env.MONGODB_URI;

// We will use MongoMemoryServer if no URI is provided so the demo works out of the box
import { MongoMemoryServer } from 'mongodb-memory-server';
let mongod: MongoMemoryServer | null = null;

const technicians = [
  { name: 'Alex' },
  { name: 'Marcus' },
  { name: 'Jordan' },
  { name: 'Sam' }
];

const customersData = [
  { name: 'Mike Johnson', companyName: "Tony's Pizza", phone: '555-0101', customerType: 'RESTAURANT' },
  { name: 'Sarah Connor', companyName: 'FreshMart', phone: '555-0102', customerType: 'GROCERY_STORE' },
  { name: 'David Smith', companyName: 'ABC Warehouse', phone: '555-0103', customerType: 'WAREHOUSE' },
  { name: 'Joe Anderson', companyName: "Joe's Grocery", phone: '555-0104', customerType: 'GROCERY_STORE' },
  { name: 'Linda White', companyName: 'Metro Foods', phone: '555-0105', customerType: 'GROCERY_STORE' },
  { name: 'Robert King', companyName: 'City Market', phone: '555-0106', customerType: 'GROCERY_STORE' },
  { name: 'Tom Jones', companyName: 'Old Restaurant', phone: '555-0107', customerType: 'RESTAURANT' },
  { name: 'Nancy Davis', companyName: 'Downtown Diner', phone: '555-0108', customerType: 'RESTAURANT' },
  { name: 'Paul Walker', companyName: 'Cold Storage Inc', phone: '555-0109', customerType: 'WAREHOUSE' },
  { name: 'Emily Clark', companyName: 'Seafood Express', phone: '555-0110', customerType: 'RESTAURANT' },
  { name: 'Kevin Brown', companyName: 'Burger Joint', phone: '555-0111', customerType: 'RESTAURANT' },
  { name: 'Lisa Taylor', companyName: 'Quick Stop', phone: '555-0112', customerType: 'GROCERY_STORE' },
  { name: 'James Wilson', companyName: 'Super Deli', phone: '555-0113', customerType: 'RESTAURANT' },
];

async function seed() {
  try {
    if (!MONGODB_URI) {
      console.log('No MONGODB_URI found in environment. Starting in-memory database for demo...');
      mongod = await MongoMemoryServer.create();
      MONGODB_URI = mongod.getUri();
      
      // Update .env.local with the new URI so the Next.js app can connect to it!
      // Actually, since Next.js runs in a separate process, an in-memory DB started here 
      // won't be accessible by Next.js unless we save the URI. 
      // The Next.js app will start its own memory server if MONGODB_URI is empty.
      // So they would be two different databases.
      // To fix this, let's just warn the user.
      console.warn('\\n⚠️ WARNING: You are seeding an in-memory database that will die when this script ends.');
      console.warn('To persist data for the Next.js app, provide a real MONGODB_URI in .env.local!\\n');
    }

    await mongoose.connect(MONGODB_URI as string);
    console.log('Connected to MongoDB');

    // Clear collections
    await Customer.deleteMany({});
    await Job.deleteMany({});
    await Activity.deleteMany({});
    await Technician.deleteMany({});
    console.log('Cleared existing data');

    // Insert technicians
    await Technician.insertMany(technicians);

    // Insert customers
    const createdCustomers = await Customer.insertMany(customersData);
    console.log(`Inserted ${createdCustomers.length} customers`);

    // Helper to find customer by company name
    const getCustomer = (company: string) => createdCustomers.find(c => c.companyName === company);

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const jobsData = [
      {
        customerId: getCustomer("Tony's Pizza")?._id,
        companyName: "Tony's Pizza",
        customerName: "Mike Johnson",
        phone: '555-0101',
        serviceType: 'Walk-in Freezer',
        issueDescription: 'Freezer not cooling, food inventory at risk',
        source: 'PHONE',
        status: 'QUOTE_SENT',
        urgency: 'EMERGENCY',
        estimatedValue: 2000,
        nextFollowUpAt: now,
        lastContactedAt: twoDaysAgo,
        quoteSentAt: twoDaysAgo
      },
      {
        customerId: getCustomer('FreshMart')?._id,
        companyName: 'FreshMart',
        customerName: 'Sarah Connor',
        phone: '555-0102',
        serviceType: 'Walk-in Cooler',
        issueDescription: 'Not maintaining temperature',
        source: 'WEBSITE',
        status: 'WAITING_ON_CUSTOMER',
        urgency: 'HIGH',
        estimatedValue: 1250,
        nextFollowUpAt: yesterday, // Overdue by 1 day
        lastContactedAt: threeDaysAgo
      },
      {
        customerId: getCustomer('ABC Warehouse')?._id,
        companyName: 'ABC Warehouse',
        customerName: 'David Smith',
        phone: '555-0103',
        serviceType: 'Ice Machine',
        issueDescription: 'Leaking water',
        source: 'PHONE',
        status: 'APPROVED',
        urgency: 'MEDIUM',
        estimatedValue: 900,
        assignedTechnician: 'Alex',
        approvedAt: yesterday,
        nextFollowUpAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
      },
      {
        customerId: getCustomer("Joe's Grocery")?._id,
        companyName: "Joe's Grocery",
        customerName: "Joe Anderson",
        phone: '555-0104',
        serviceType: 'Walk-in Freezer',
        issueDescription: 'Making loud noise',
        source: 'TEXT',
        status: 'NEEDS_QUOTE',
        urgency: 'HIGH',
        estimatedValue: 1500,
        nextFollowUpAt: now,
        lastContactedAt: yesterday
      },
      {
        customerId: getCustomer('Metro Foods')?._id,
        companyName: 'Metro Foods',
        customerName: 'Linda White',
        phone: '555-0105',
        serviceType: 'Cooler Repair',
        issueDescription: 'Door seal broken',
        source: 'PHONE',
        status: 'SCHEDULED',
        urgency: 'MEDIUM',
        estimatedValue: 1800,
        assignedTechnician: 'Marcus',
        scheduledAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
      },
      {
        customerId: getCustomer('City Market')?._id,
        companyName: 'City Market',
        customerName: 'Robert King',
        phone: '555-0106',
        serviceType: 'Ice Machine',
        issueDescription: 'Not making ice',
        source: 'WEBSITE',
        status: 'COMPLETED',
        urgency: 'LOW',
        estimatedValue: 700,
        assignedTechnician: 'Jordan',
        completedAt: twoDaysAgo
      },
      {
        customerId: getCustomer('Old Restaurant')?._id,
        companyName: 'Old Restaurant',
        customerName: 'Tom Jones',
        phone: '555-0107',
        serviceType: 'Freezer Repair',
        issueDescription: 'Compressor failed',
        source: 'PHONE',
        status: 'LOST',
        urgency: 'HIGH',
        estimatedValue: 1100,
        lostReason: 'Customer chose competitor'
      },
      {
        customerId: getCustomer('Downtown Diner')?._id,
        companyName: 'Downtown Diner',
        customerName: 'Nancy Davis',
        phone: '555-0108',
        serviceType: 'Walk-in Cooler',
        issueDescription: 'Fan motor broken',
        source: 'PHONE',
        status: 'NEW',
        urgency: 'MEDIUM',
        estimatedValue: 800,
        nextFollowUpAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) // Overdue by 2 days
      },
      {
        customerId: getCustomer('Cold Storage Inc')?._id,
        companyName: 'Cold Storage Inc',
        customerName: 'Paul Walker',
        phone: '555-0109',
        serviceType: 'Commercial Refrigeration',
        issueDescription: 'System wide maintenance',
        source: 'REFERRAL',
        status: 'QUOTE_SENT',
        urgency: 'LOW',
        estimatedValue: 4500,
        nextFollowUpAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // Upcoming
        quoteSentAt: yesterday,
        lastContactedAt: yesterday
      },
      {
        customerId: getCustomer('Seafood Express')?._id,
        companyName: 'Seafood Express',
        customerName: 'Emily Clark',
        phone: '555-0110',
        serviceType: 'Display Cooler',
        issueDescription: 'Temperature fluctuating',
        source: 'WEBSITE',
        status: 'WAITING_ON_CUSTOMER',
        urgency: 'HIGH',
        estimatedValue: 2200,
        nextFollowUpAt: now,
        lastContactedAt: threeDaysAgo
      },
      // ... Add more if necessary, but this provides a good mix
    ];

    const createdJobs = await Job.insertMany(jobsData);
    console.log(`Inserted ${createdJobs.length} jobs`);

    // Create activities
    const activities = [];
    for (const job of createdJobs) {
      activities.push({
        jobId: job._id,
        type: 'NOTE',
        description: 'Lead created in system',
        createdAt: new Date(job.createdAt.getTime() - 24 * 60 * 60 * 1000)
      });
      
      if (job.status === 'QUOTE_SENT') {
        activities.push({
          jobId: job._id,
          type: 'QUOTE_SENT',
          description: `Quote sent for $${job.estimatedValue}`,
          createdAt: job.quoteSentAt || new Date()
        });
      }
    }
    await Activity.insertMany(activities);
    console.log(`Inserted ${activities.length} activities`);

    // Update customer stats
    for (const customer of createdCustomers) {
      const customerJobs = createdJobs.filter(j => j.customerId && j.customerId.toString() === customer._id.toString());
      const totalRevenue = customerJobs
        .filter(j => j.status === 'COMPLETED')
        .reduce((sum, j) => sum + (j.estimatedValue || 0), 0);
      
      await Customer.updateOne(
        { _id: customer._id },
        { 
          $set: { 
            totalJobs: customerJobs.length,
            totalRevenue: totalRevenue
          } 
        }
      );
    }
    
    console.log('Database seeded successfully.');
    if (mongod) await mongod.stop();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    if (mongod) await mongod.stop();
    process.exit(1);
  }
}

seed();
