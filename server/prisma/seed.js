import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEPARTMENTS = ['Engineering', 'Marketing', 'Sales', 'HR', 'Design', 'Operations', 'Finance', 'Product'];

const TASK_TITLES = [
  'API Integration Review', 'Sprint Planning Meeting', 'Code Review Session', 'Database Optimization',
  'Client Presentation Prep', 'Team Standup', 'Feature Development', 'Bug Fix & Testing',
  'Documentation Update', 'Performance Analysis', 'Design Review', 'Architecture Discussion',
  'Customer Feedback Review', 'Deployment Pipeline Setup', 'Security Audit',
  'Market Research Report', 'Sales Pipeline Review', 'Content Strategy Meeting',
  'Budget Review', 'Vendor Evaluation', 'Process Improvement Workshop',
  'Training Session', 'Cross-team Sync', 'Product Roadmap Review',
  'Data Migration Planning', 'UI/UX Wireframing', 'A/B Test Analysis',
  'Email Campaign Setup', 'Quarterly OKR Review', 'Innovation Sprint',
  'Technical Debt Cleanup', 'Onboarding Documentation', 'Risk Assessment',
  'Stakeholder Presentation', 'Analytics Dashboard Setup', 'Release Planning'
];

const REASON_CATEGORIES = [
  'Blocked by dependency', 'Insufficient resources', 'Scope change',
  'Personal emergency', 'Technical issue', 'Other'
];

const REASONS = [
  'Waiting for upstream API changes to be deployed',
  'Build pipeline was broken for most of the day',
  'Had to attend an emergency client call',
  'Dependency library had a breaking update',
  'Scope was expanded during mid-day review meeting',
  'Server outage impacted development environment',
  'Was pulled into a critical production incident',
  'Required access permissions were not yet granted',
  'Design specifications were updated late in the day',
  'Network connectivity issues in the office'
];

async function main() {
  console.log('🌱 Seeding TaskFlow Enterprise database...\n');

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // Create Admin
  const adminPassword = await bcrypt.hash('TF@Admin2025#Secure', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@taskflow.io',
      name: 'Alex Morgan',
      password: adminPassword,
      role: 'ADMIN',
      department: 'Executive',
      isActive: true,
    },
  });
  console.log(`✅ Created admin: ${admin.email}`);

  // Create Employees
  const employees = [
    { email: 'john.smith@taskflow.io', name: 'John Smith', password: 'TF@John2025', department: 'Engineering' },
    { email: 'priya.kapoor@taskflow.io', name: 'Priya Kapoor', password: 'TF@Priya2025', department: 'Engineering' },
    { email: 'carlos.mendez@taskflow.io', name: 'Carlos Mendez', password: 'TF@Carlos2025', department: 'Marketing' },
    { email: 'sarah.johnson@taskflow.io', name: 'Sarah Johnson', password: 'TF@Sarah2025', department: 'Sales' },
    { email: 'wei.zhang@taskflow.io', name: 'Wei Zhang', password: 'TF@Wei2025', department: 'Design' },
    { email: 'aisha.okafor@taskflow.io', name: 'Aisha Okafor', password: 'TF@Aisha2025', department: 'HR' },
    { email: 'liam.patel@taskflow.io', name: 'Liam Patel', password: 'TF@Liam2025', department: 'Operations' },
    { email: 'nina.brown@taskflow.io', name: 'Nina Brown', password: 'TF@Nina2025', department: 'Finance' },
    { email: 'ravi.sharma@taskflow.io', name: 'Ravi Sharma', password: 'TF@Ravi2025', department: 'Product' },
    { email: 'emma.wilson@taskflow.io', name: 'Emma Wilson', password: 'TF@Emma2025', department: 'Engineering' },
  ];

  const createdEmployees = [];
  for (const emp of employees) {
    const hashed = await bcrypt.hash(emp.password, 12);
    const user = await prisma.user.create({
      data: {
        email: emp.email,
        name: emp.name,
        password: hashed,
        role: 'EMPLOYEE',
        department: emp.department,
        isActive: true,
      },
    });
    createdEmployees.push(user);
    console.log(`✅ Created employee: ${user.email} (${user.department})`);
  }

  // Generate sample tasks for the past 30 days
  console.log('\n📋 Generating sample tasks...');
  const now = new Date();
  let taskCount = 0;

  for (const employee of createdEmployees) {
    // Generate tasks for past 30 days
    for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
      const taskDate = new Date(now);
      taskDate.setDate(taskDate.getDate() - daysAgo);
      taskDate.setHours(0, 0, 0, 0);

      // Skip weekends sometimes
      const dayOfWeek = taskDate.getDay();
      if ((dayOfWeek === 0 || dayOfWeek === 6) && Math.random() > 0.3) continue;

      // Generate 3-8 tasks per day
      const numTasks = Math.floor(Math.random() * 6) + 3;
      const usedHours = new Set();

      for (let t = 0; t < numTasks; t++) {
        // Pick a random hour between 8-18
        let hour;
        do {
          hour = Math.floor(Math.random() * 11) + 8;
        } while (usedHours.has(hour) && usedHours.size < 11);
        
        if (usedHours.has(hour)) continue;
        usedHours.add(hour);

        const title = TASK_TITLES[Math.floor(Math.random() * TASK_TITLES.length)];
        const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];

        // Determine status based on how old the task is
        let status = 'PENDING';
        let completedAt = null;
        let notCompletedAt = null;
        let notCompletedReason = null;
        let reasonCategory = null;

        if (daysAgo > 0) {
          // Past tasks should be completed or not completed
          const completionChance = 0.75 + (Math.random() * 0.1); // 75-85% completion
          if (Math.random() < completionChance) {
            status = 'COMPLETED';
            completedAt = new Date(taskDate);
            completedAt.setHours(hour + 1, Math.floor(Math.random() * 60));
          } else {
            status = 'NOT_COMPLETED';
            notCompletedAt = new Date(taskDate);
            notCompletedAt.setHours(18, 0);
            reasonCategory = REASON_CATEGORIES[Math.floor(Math.random() * REASON_CATEGORIES.length)];
            notCompletedReason = REASONS[Math.floor(Math.random() * REASONS.length)];
          }
        } else {
          // Today's tasks: mix of pending, completed, not completed
          const rand = Math.random();
          if (rand < 0.4) {
            status = 'COMPLETED';
            completedAt = new Date();
            completedAt.setHours(hour + 1, Math.floor(Math.random() * 60));
          } else if (rand < 0.55) {
            status = 'NOT_COMPLETED';
            notCompletedAt = new Date();
            reasonCategory = REASON_CATEGORIES[Math.floor(Math.random() * REASON_CATEGORIES.length)];
            notCompletedReason = REASONS[Math.floor(Math.random() * REASONS.length)];
          }
        }

        await prisma.task.create({
          data: {
            userId: employee.id,
            title,
            description: `${title} - Detailed task for ${employee.name} in ${employee.department}`,
            date: taskDate,
            timeSlot: `${String(hour).padStart(2, '0')}:00-${String(hour + 1).padStart(2, '0')}:00`,
            slotHour: hour,
            priority,
            tags: JSON.stringify([employee.department.toLowerCase()]),
            status,
            completedAt,
            notCompletedAt,
            notCompletedReason,
            reasonCategory,
            estimatedHours: 1,
            actualHours: status === 'COMPLETED' ? 0.5 + Math.random() * 1.5 : null,
          },
        });
        taskCount++;
      }
    }
    console.log(`  📊 Generated tasks for ${employee.name}`);
  }

  console.log(`\n✨ Seeding complete!`);
  console.log(`   👤 1 admin + ${createdEmployees.length} employees`);
  console.log(`   📋 ${taskCount} sample tasks\n`);
  console.log('🔑 Admin Login: admin@taskflow.io / TF@Admin2025#Secure');
  console.log('🔑 Employee Login: john.smith@taskflow.io / TF@John2025');
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
