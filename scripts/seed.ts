import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Customer } from '../src/models/Customer';
import { Job } from '../src/models/Job';
import { Activity } from '../src/models/Activity';
import { Technician } from '../src/models/Technician';
import { ensureActiveJobHasFollowUp } from '../src/lib/services';
import { addDays, startOfDay, subDays } from 'date-fns';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;

const technicians = [
  { name: 'Alex' },
  { name: 'Marcus' },
  { name: 'Jordan' },
  { name: 'Sam' }
];

const customersData = [
  { name: 'Mike Johnson', companyName: "Tony's Pizza", phone: '555-0101', email: 'mike@tonyspizza.com' },
  { name: 'Sarah Connor', companyName: 'FreshMart', phone: '555-0102', email: 'sarah@freshmart.com' },
  { name: 'David Smith', companyName: 'ABC Warehouse', phone: '555-0103', email: 'david@abcwarehouse.com' },
  { name: 'Joe Anderson', companyName: "Joe's Grocery", phone: '555-0104', email: 'joe@joesgrocery.com' },
  { name: 'Linda White', companyName: 'Metro Foods', phone: '555-0105', email: 'linda@metrofoods.com' },
  { name: 'Robert King', companyName: 'City Market', phone: '555-0106', email: 'robert@citymarket.com' },
  { name: 'Tom Jones', companyName: 'Old Restaurant', phone: '555-0107', email: 'tom@oldrestaurant.com' },
  { name: 'Nancy Davis', companyName: 'Downtown Diner', phone: '555-0108', email: 'nancy@downtowndiner.com' },
  { name: 'Paul Walker', companyName: 'Cold Storage Inc', phone: '555-0109', email: 'paul@coldstorage.com' },
  { name: 'Emily Clark', companyName: 'Seafood Express', phone: '555-0110', email: 'emily@seafoodexpress.com' },
  { name: 'Kevin Brown', companyName: 'Burger Joint', phone: '555-0111', email: 'kevin@burgerjoint.com' },
  { name: 'Lisa Taylor', companyName: 'Quick Stop', phone: '555-0112', email: 'lisa@quickstop.com' },
  { name: 'James Wilson', companyName: 'Super Deli', phone: '555-0113', email: 'james@superdeli.com' },
  { name: 'Anna Lee', companyName: 'Ice Cream Parlor', phone: '555-0114', email: 'anna@icecream.com' },
  { name: 'Chris Martin', companyName: 'Local Bakery', phone: '555-0115', email: 'chris@localbakery.com' }
];

async function seed() {
  try {
    if (!MONGODB_URI) {
      throw new Error('Missing MONGODB_URI. Add your MongoDB Atlas connection string to .env.local.');
    }

    await mongoose.connect(MONGODB_URI as string);
    console.log('Connected to MongoDB');

    await Customer.deleteMany({});
    await Job.deleteMany({});
    await Activity.deleteMany({});
    await Technician.deleteMany({});
    console.log('Cleared existing data');

    await Technician.insertMany(technicians);
    const createdCustomers = await Customer.insertMany(customersData);
    console.log(`Inserted ${createdCustomers.length} customers`);

    const getCustomer = (company: string) => createdCustomers.find(c => c.companyName === company);

    const now = new Date();
    const today = startOfDay(now);
    const yesterday = subDays(today, 1);
    const twoDaysAgo = subDays(today, 2);
    const threeDaysAgo = subDays(today, 3);
    const tomorrow = addDays(today, 1);
    const nextWeek = addDays(today, 7);

    // Initial basic jobs definitions matching exact prompt requirements
    const rawJobs = [
      {
        customerId: getCustomer("Tony's Pizza")?._id,
        companyName: "Tony's Pizza",
        customerName: "Mike Johnson",
        phone: '555-0101',
        serviceType: 'Walk-in freezer',
        issueDescription: 'Freezer not cooling, food inventory at risk',
        source: 'PHONE',
        status: 'QUOTE_SENT',
        urgency: 'EMERGENCY',
        estimatedValue: 2000,
        suggestedFollowUp: 'today', // Should calculate to today
        createdAt: twoDaysAgo
      },
      {
        customerId: getCustomer('FreshMart')?._id,
        companyName: 'FreshMart',
        customerName: 'Sarah Connor',
        phone: '555-0102',
        serviceType: 'Walk-in cooler',
        issueDescription: 'Not maintaining temperature',
        source: 'WEBSITE',
        status: 'WAITING_ON_CUSTOMER',
        urgency: 'HIGH',
        estimatedValue: 1250,
        nextFollowUpAt: yesterday, // Explicitly overdue
        createdAt: threeDaysAgo
      },
      {
        customerId: getCustomer("Joe's Grocery")?._id,
        companyName: "Joe's Grocery",
        customerName: "Joe Anderson",
        phone: '555-0104',
        serviceType: 'Display Case',
        issueDescription: 'Glass sweating, temps rising',
        source: 'TEXT',
        status: 'NEEDS_QUOTE',
        urgency: 'HIGH',
        estimatedValue: 1500,
        suggestedFollowUp: 'today',
        createdAt: yesterday
      },
      {
        customerId: getCustomer('ABC Warehouse')?._id,
        companyName: 'ABC Warehouse',
        customerName: 'David Smith',
        phone: '555-0103',
        serviceType: 'Industrial Freezer',
        issueDescription: 'Preventative maintenance needed',
        source: 'PHONE',
        status: 'APPROVED',
        urgency: 'MEDIUM',
        estimatedValue: 900,
        suggestedFollowUp: 'today', // Needs scheduling
        createdAt: twoDaysAgo
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
        scheduledAt: tomorrow,
        createdAt: threeDaysAgo
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
        completedAt: yesterday,
        createdAt: subDays(today, 10)
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
        lostReason: 'Customer chose competitor',
        createdAt: subDays(today, 15)
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
        suggestedFollowUp: 'today',
        createdAt: yesterday
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
        suggestedFollowUp: 'tomorrow', // Upcoming
        createdAt: yesterday
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
        nextFollowUpAt: tomorrow,
        createdAt: threeDaysAgo
      },
      {
        customerId: getCustomer('Burger Joint')?._id,
        companyName: 'Burger Joint',
        customerName: 'Kevin Brown',
        phone: '555-0111',
        serviceType: 'Fryer Hood',
        issueDescription: 'Ventilation issue',
        source: 'PHONE',
        status: 'COMPLETED',
        urgency: 'MEDIUM',
        estimatedValue: 1500,
        createdAt: subDays(today, 20)
      },
      {
        customerId: getCustomer('Quick Stop')?._id,
        companyName: 'Quick Stop',
        customerName: 'Lisa Taylor',
        phone: '555-0112',
        serviceType: 'Beverage Cooler',
        issueDescription: 'Leaking water',
        source: 'TEXT',
        status: 'NEW',
        urgency: 'MEDIUM',
        estimatedValue: 350,
        nextFollowUpAt: today,
        createdAt: today
      },
      {
        customerId: getCustomer('Super Deli')?._id,
        companyName: 'Super Deli',
        customerName: 'James Wilson',
        phone: '555-0113',
        serviceType: 'Meat Case',
        issueDescription: 'Lighting broken, running warm',
        source: 'PHONE',
        status: 'NEEDS_QUOTE',
        urgency: 'HIGH',
        estimatedValue: 1200,
        nextFollowUpAt: today,
        createdAt: yesterday
      },
      {
        customerId: getCustomer('Ice Cream Parlor')?._id,
        companyName: 'Ice Cream Parlor',
        customerName: 'Anna Lee',
        phone: '555-0114',
        serviceType: 'Dipping Cabinet',
        issueDescription: 'Ice cream melting',
        source: 'PHONE',
        status: 'QUOTE_SENT',
        urgency: 'EMERGENCY',
        estimatedValue: 2800,
        nextFollowUpAt: yesterday, // OVERDUE
        createdAt: threeDaysAgo
      },
      {
        customerId: getCustomer('Local Bakery')?._id,
        companyName: 'Local Bakery',
        customerName: 'Chris Martin',
        phone: '555-0115',
        serviceType: 'Dough Retarder',
        issueDescription: 'Not cooling properly',
        source: 'WEBSITE',
        status: 'WAITING_ON_CUSTOMER',
        urgency: 'MEDIUM',
        estimatedValue: 950,
        nextFollowUpAt: nextWeek,
        createdAt: today
      },
      {
        customerId: getCustomer('ABC Warehouse')?._id,
        companyName: 'ABC Warehouse',
        customerName: 'David Smith',
        phone: '555-0103',
        serviceType: 'Dock Doors',
        issueDescription: 'Seals broken',
        source: 'PHONE',
        status: 'LOST',
        urgency: 'LOW',
        estimatedValue: 500,
        createdAt: subDays(today, 40)
      },
      {
        customerId: getCustomer('FreshMart')?._id,
        companyName: 'FreshMart',
        customerName: 'Sarah Connor',
        phone: '555-0102',
        serviceType: 'Produce Misting System',
        issueDescription: 'Clogged nozzles',
        source: 'PHONE',
        status: 'COMPLETED',
        urgency: 'LOW',
        estimatedValue: 400,
        createdAt: subDays(today, 60)
      },
      {
        customerId: getCustomer("Tony's Pizza")?._id,
        companyName: "Tony's Pizza",
        customerName: "Mike Johnson",
        phone: '555-0101',
        serviceType: 'Prep Table',
        issueDescription: 'Compressor replacement',
        source: 'PHONE',
        status: 'COMPLETED',
        urgency: 'HIGH',
        estimatedValue: 1800,
        createdAt: subDays(today, 80)
      }
    ];

    const processedJobs = rawJobs.map(jobData => {
      const job = new Job(jobData);
      ensureActiveJobHasFollowUp(job, now, jobData.suggestedFollowUp);
      
      // Seed historical dates based on status
      if (job.status === 'QUOTE_SENT') job.quoteSentAt = jobData.createdAt;
      if (job.status === 'APPROVED') {
        job.quoteSentAt = subDays(jobData.createdAt, 1);
        job.approvedAt = jobData.createdAt;
      }
      if (job.status === 'SCHEDULED') {
        job.approvedAt = subDays(jobData.createdAt, 1);
        job.scheduledAt = jobData.createdAt;
      }
      if (job.status === 'COMPLETED') {
        job.completedAt = jobData.createdAt;
      }
      
      if (!['NEW', 'LOST'].includes(job.status)) {
        job.lastContactedAt = subDays(jobData.createdAt, 1);
      }
      
      return job;
    });

    const createdJobs = await Job.insertMany(processedJobs);
    console.log(`Inserted ${createdJobs.length} jobs`);

    const activities = [];
    for (const job of createdJobs) {
      activities.push({
        jobId: job._id,
        type: 'JOB_CREATED',
        description: 'Lead created in system',
        createdAt: job.createdAt
      });
      
      if (job.quoteSentAt) {
        activities.push({
          jobId: job._id,
          type: 'QUOTE_SENT',
          description: `Quote sent for $${job.estimatedValue}`,
          createdAt: job.quoteSentAt
        });
      }

      if (job.lastContactedAt) {
        activities.push({
          jobId: job._id,
          type: 'CALL',
          description: `Spoke with customer about issue`,
          createdAt: job.lastContactedAt
        });
      }
      
      if (job.status === 'COMPLETED') {
        activities.push({
          jobId: job._id,
          type: 'STATUS_CHANGED',
          description: `Job completed`,
          createdAt: job.completedAt
        });
      }
    }
    await Activity.insertMany(activities);
    console.log(`Inserted ${activities.length} activities`);

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
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
