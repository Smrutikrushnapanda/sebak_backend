import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

import {
  Role,
  Permission,
  Menu,
  User,
  RefreshToken,
  OrgMemberDesignation,
  OrgMember,
  ConstituencySettings,
  AuditLog,
  UserStatus,
  RepresentativeType,
} from '../entities';

const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_ETz1vjtJYoH6@ep-green-firefly-b374t1k8-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
  synchronize: true,
  entities: [
    Role,
    Permission,
    Menu,
    User,
    RefreshToken,
    OrgMemberDesignation,
    OrgMember,
    ConstituencySettings,
    AuditLog,
  ],
});

async function runSeed() {
  console.log('🔄 Initializing database connection for seeding...');
  await AppDataSource.initialize();
  console.log('✅ Connected to Neon PostgreSQL.');

  const permissionRepo = AppDataSource.getRepository(Permission);
  const roleRepo = AppDataSource.getRepository(Role);
  const menuRepo = AppDataSource.getRepository(Menu);
  const userRepo = AppDataSource.getRepository(User);
  const designationRepo = AppDataSource.getRepository(OrgMemberDesignation);
  const settingsRepo = AppDataSource.getRepository(ConstituencySettings);

  // 1. Seed Permissions
  console.log('🔒 Seeding System Permissions...');
  const permissionsList = [
    { key: 'org_unit.create', description: 'Create blocks and municipalities' },
    { key: 'org_unit.edit', description: 'Edit blocks and municipalities' },
    { key: 'org_unit.delete', description: 'Delete blocks and municipalities' },
    { key: 'org_unit.view', description: 'View organization hierarchy' },
    { key: 'org_member.create', description: 'Create party workers & volunteers' },
    { key: 'org_member.edit', description: 'Edit party workers & volunteers' },
    { key: 'org_member.delete', description: 'Delete party workers & volunteers' },
    { key: 'org_member.view', description: 'View organization members' },
    { key: 'user.manage', description: 'Manage portal user accounts' },
    { key: 'role.manage', description: 'Manage portal roles and permissions' },
    { key: 'menu.manage', description: 'Manage sidebar navigation menus' },
  ];

  const savedPermissions: Permission[] = [];
  for (const p of permissionsList) {
    let perm = await permissionRepo.findOne({ where: { key: p.key } });
    if (!perm) {
      perm = permissionRepo.create(p);
      perm = await permissionRepo.save(perm);
    }
    savedPermissions.push(perm);
  }
  console.log(`✅ Seeded ${savedPermissions.length} permissions.`);

  // 2. Seed Menus
  console.log('🧭 Seeding System Menus...');
  const menuDefinitions = [
    {
      label: 'Dashboard',
      icon: 'LuLayoutDashboard',
      path: '/dashboard',
      orderIndex: 1,
      children: [],
    },
    {
      label: 'Organization',
      icon: 'LuNetwork',
      path: null,
      orderIndex: 2,
      children: [
        { label: 'Master Data', icon: 'LuLayers', path: '/organization/master-data', orderIndex: 1 },
        { label: 'Directory', icon: 'LuUsers', path: '/organization/directory', orderIndex: 2 },
        { label: 'Key Person', icon: 'LuStar', path: '/organization/key-person', orderIndex: 3 },
      ],
    },
    {
      label: 'Urban Demographics',
      icon: 'LuBuilding2',
      path: '/demographics/urban',
      orderIndex: 3,
      children: [],
    },
    {
      label: 'Rural Demographics',
      icon: 'LuLandmark',
      path: '/demographics/rural',
      orderIndex: 4,
      children: [],
    },
    {
      label: 'Administration',
      icon: 'LuShield',
      path: null,
      orderIndex: 5,
      children: [
        { label: 'Users', icon: 'LuUserCheck', path: '/users', orderIndex: 1 },
        { label: 'Roles & Permissions', icon: 'LuKey', path: '/roles', orderIndex: 2 },
        { label: 'Settings', icon: 'LuSettings', path: '/settings', orderIndex: 3 },
      ],
    },
  ];

  // Clean old menu assignments to avoid stale nested items
  await AppDataSource.query('DELETE FROM role_menus');
  await AppDataSource.query('DELETE FROM menus');

  const savedMenus: Menu[] = [];
  for (const mDef of menuDefinitions) {
    let parentMenu = menuRepo.create({
      label: mDef.label,
      icon: mDef.icon,
      path: mDef.path,
      orderIndex: mDef.orderIndex,
      isActive: true,
    });
    parentMenu = await menuRepo.save(parentMenu);
    savedMenus.push(parentMenu);

    for (const childDef of mDef.children) {
      let childMenu = menuRepo.create({
        label: childDef.label,
        icon: childDef.icon,
        path: childDef.path,
        parentId: parentMenu.id,
        orderIndex: childDef.orderIndex,
        isActive: true,
      });
      childMenu = await menuRepo.save(childMenu);
      savedMenus.push(childMenu);
    }
  }
  console.log(`✅ Seeded ${savedMenus.length} menus.`);

  // 3. Seed Roles
  console.log('👥 Seeding System Roles...');
  let adminRole = await roleRepo.findOne({
    where: { slug: 'admin' },
    relations: ['permissions', 'menus'],
  });

  if (!adminRole) {
    adminRole = roleRepo.create({
      name: 'Admin',
      slug: 'admin',
      description: 'System Administrator with full access',
      isSystem: true,
    });
  }
  adminRole.permissions = savedPermissions;
  adminRole.menus = savedMenus;
  adminRole = await roleRepo.save(adminRole);

  let coordinatorRole = await roleRepo.findOne({
    where: { slug: 'coordinator' },
    relations: ['permissions', 'menus'],
  });
  const coordPermissions = savedPermissions.filter((p) =>
    ['org_unit.view', 'org_member.view', 'org_member.create', 'org_member.edit'].includes(p.key),
  );
  const coordMenus = savedMenus.filter((m) =>
    ['Dashboard', 'Organization', 'Master Data', 'Directory', 'Key Person', 'Urban Demographics', 'Rural Demographics'].includes(m.label),
  );
  if (!coordinatorRole) {
    coordinatorRole = roleRepo.create({
      name: 'Coordinator',
      slug: 'coordinator',
      description: 'Constituency coordinator with field management access',
      isSystem: false,
      permissions: coordPermissions,
      menus: coordMenus,
    });
  } else {
    coordinatorRole.permissions = coordPermissions;
    coordinatorRole.menus = coordMenus;
  }
  await roleRepo.save(coordinatorRole);
  console.log('✅ Seeded Admin and Coordinator roles.');

  // 4. Seed Designations
  console.log('🎖️ Seeding Member Designations...');
  const designations = [
    'Block Coordinator',
    'Panchayat Coordinator',
    'Village Coordinator',
    'Ward Coordinator',
    'Booth President',
    'Party Worker',
    'Volunteer',
    'Urban Coordinator',
  ];

  for (let i = 0; i < designations.length; i++) {
    const name = designations[i];
    let desig = await designationRepo.findOne({ where: { name } });
    if (!desig) {
      desig = designationRepo.create({ name, orderIndex: i + 1 });
      await designationRepo.save(desig);
    }
  }
  console.log(`✅ Seeded ${designations.length} member designations.`);

  // 5. Seed Admin Users
  console.log('👤 Seeding Admin Users...');
  const passwordHash = await bcrypt.hash('password', 10);
  const adminUsersToSeed = [
    { mobile: '9876543210', fullName: 'Admin Administrator', email: 'admin@mla.gov.in' },
    { mobile: '7381142451', fullName: 'Smrutikrushna Panda', email: 'smruti@mla.gov.in' },
  ];

  for (const uData of adminUsersToSeed) {
    let u = await userRepo.findOne({ where: [{ mobile: uData.mobile }, { email: uData.email }] });
    if (!u) {
      u = userRepo.create({
        fullName: uData.fullName,
        mobile: uData.mobile,
        email: uData.email,
        passwordHash,
        roleId: adminRole.id,
        status: UserStatus.ACTIVE,
      });
      await userRepo.save(u);
      console.log(`🎉 Admin user created: ${uData.mobile} / admin123`);
    } else {
      u.mobile = uData.mobile;
      u.fullName = uData.fullName;
      u.email = uData.email;
      u.passwordHash = passwordHash;
      u.roleId = adminRole.id;
      u.status = UserStatus.ACTIVE;
      await userRepo.save(u);
      console.log(`✅ Admin user updated: ${uData.mobile} / admin123`);
    }
  }

  // 6. Seed Constituency Settings
  console.log('⚙️ Seeding Constituency Settings...');
  let settings = await settingsRepo.findOne({ where: { id: 1 } });
  if (!settings) {
    settings = settingsRepo.create({
      id: 1,
      representativeType: RepresentativeType.MLA,
      representativeName: 'Shri Akash Dasnayak',
      constituencyName: 'Korei Assembly',
      stateName: 'Odisha',
      districtName: 'Jajpur',
      assemblyName: 'Korei Assembly',
      ruralEnabled: true,
      urbanEnabled: true,
      representativeMobileDisplay: '+91 94370 12345',
      officeAddress: 'Main Constituency Office, Near Collectorate, Jajpur, Odisha - 755001',
    });
    await settingsRepo.save(settings);
  }
  console.log('✅ Constituency settings initialized.');

  console.log('🎉 All seed data completed successfully!');
  await AppDataSource.destroy();
  process.exit(0);
}

runSeed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
