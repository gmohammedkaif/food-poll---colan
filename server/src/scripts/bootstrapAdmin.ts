import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { env } from '../config/env.js';

async function bootstrapAdmin() {
  console.log('==========================================');
  console.log('POLLHUB - ADMIN BOOTSTRAP INITIALIZER');
  console.log('==========================================');

  await connectDB();

  try {
    const existingAdmin = await User.findOne({ role: 'ADMIN' });
    if (existingAdmin) {
      console.log(`[Bootstrap] An Administrator account already exists:`);
      console.log(`  - Employee ID: ${existingAdmin.employeeId}`);
      console.log(`  - Name: ${existingAdmin.name}`);
      console.log(`  - Status: ${existingAdmin.status}`);
      console.log('[Bootstrap] No new admin created. If you need to reset the password, use admin console or update the database.');
      return;
    }

    const adminId = (env.ADMIN_BOOTSTRAP_ID || 'ADMIN001').trim().toUpperCase();
    const adminName = env.ADMIN_BOOTSTRAP_NAME || 'System Administrator';
    const adminPassword = env.ADMIN_BOOTSTRAP_PASSWORD || 'Admin@PollHub2026!';

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    const admin = new User({
      employeeId: adminId,
      name: adminName,
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      department: 'IT Administration'
    });

    await admin.save();

    await AuditLog.create({
      actorUserId: admin._id,
      actorEmployeeId: admin.employeeId,
      actorRole: 'ADMIN',
      action: 'ACCOUNT_ACTIVATED',
      timestamp: new Date(),
      reason: 'Initial primary administrator created via server bootstrap script.',
      metadata: { employeeId: admin.employeeId }
    });

    console.log('\n>>> SUCCESS: Primary Administrator Created! <<<');
    console.log(`  - Employee ID : ${admin.employeeId}`);
    console.log(`  - Name        : ${admin.name}`);
    console.log(`  - Role        : ADMIN`);
    console.log(`  - Password    : (Configured via ADMIN_BOOTSTRAP_PASSWORD in .env)`);
    console.log('\nYou can now log in at http://localhost:5173/login\n');
  } catch (error) {
    console.error('[Bootstrap Error] Failed to bootstrap admin:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

bootstrapAdmin();
