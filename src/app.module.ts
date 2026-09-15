import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

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
} from './entities';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { MenusModule } from './modules/menus/menus.module';
import { OrgMembersModule } from './modules/org-members/org-members.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { ConstituencySettingsModule } from './modules/constituency-settings/constituency-settings.module';
import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'backend/.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url:
        process.env.DATABASE_URL ||
        'postgresql://neondb_owner:npg_ETz1vjtJYoH6@ep-green-firefly-b374t1k8-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
      ssl: {
        rejectUnauthorized: false,
      },
      synchronize: process.env.DB_SYNCHRONIZE === 'true' || true,
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
      logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    MenusModule,
    OrgMembersModule,
    UploadsModule,
    ConstituencySettingsModule,
  ],
})
export class AppModule {}
