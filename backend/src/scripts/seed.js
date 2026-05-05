import sequelize from '../config/database.js';
import { User, Task, TaskAssignment } from '../models/index.js';
import bcrypt from 'bcrypt';

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Sync database (drop and recreate tables)
    await sequelize.sync({ force: true });
    console.log('✅ Database synced');

    // Create users
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Admin@123',
      role: 'admin',
      email_verified: true,
      is_active: true
    });

    const manager = await User.create({
      name: 'Michael Rodriguez',
      email: 'manager@example.com',
      password: 'Manager@123',
      role: 'manager',
      email_verified: true,
      is_active: true
    });

    const teamLead = await User.create({
      name: 'Jennifer Park',
      email: 'teamlead@example.com',
      password: 'TeamLead@123',
      role: 'team_lead',
      email_verified: true,
      is_active: true
    });

    const employee1 = await User.create({
      name: 'David Thompson',
      email: 'employee1@example.com',
      password: 'Employee@123',
      role: 'employee',
      email_verified: true,
      is_active: true
    });

    const employee2 = await User.create({
      name: 'Sarah Chen',
      email: 'employee2@example.com',
      password: 'Employee@123',
      role: 'employee',
      email_verified: true,
      is_active: true
    });

    console.log('✅ Users created');

    // Create sample tasks
    const task1 = await Task.create({
      title: 'Implement user authentication',
      description: 'Create JWT-based authentication system with login, register, and password reset functionality.',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'in_progress',
      created_by: manager.id
    });

    await TaskAssignment.create({
      task_id: task1.id,
      user_id: employee1.id
    });

    const task2 = await Task.create({
      title: 'Design dashboard UI',
      description: 'Create responsive dashboard design with charts and statistics.',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      status: 'pending',
      created_by: manager.id
    });

    await TaskAssignment.create({
      task_id: task2.id,
      user_id: employee2.id
    });

    const task3 = await Task.create({
      title: 'Write API documentation',
      description: 'Document all API endpoints with request/response examples.',
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      status: 'pending',
      created_by: teamLead.id
    });

    await TaskAssignment.create({
      task_id: task3.id,
      user_id: employee1.id
    });

    const task4 = await Task.create({
      title: 'Setup CI/CD pipeline',
      description: 'Configure automated testing and deployment pipeline.',
      deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago (overdue)
      status: 'pending',
      created_by: manager.id
    });

    await TaskAssignment.create({
      task_id: task4.id,
      user_id: employee2.id
    });

    const task5 = await Task.create({
      title: 'Implement task filtering',
      description: 'Add advanced filtering options for task list.',
      deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      status: 'completed',
      created_by: manager.id,
      completed_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // Completed 6 days ago (on time)
    });

    await TaskAssignment.create({
      task_id: task5.id,
      user_id: employee1.id
    });

    console.log('✅ Sample tasks created');

    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('📝 Default credentials:');
    console.log('   Admin:     admin@example.com / Admin@123');
    console.log('   Manager:   manager@example.com / Manager@123');
    console.log('   Team Lead: teamlead@example.com / TeamLead@123');
    console.log('   Employee1: employee1@example.com / Employee@123');
    console.log('   Employee2: employee2@example.com / Employee@123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
