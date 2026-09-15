import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrgMember, OrgMemberDesignation } from '@/entities';
import { OrgMembersService } from './org-members.service';
import { OrgMembersController } from './org-members.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OrgMember, OrgMemberDesignation])],
  controllers: [OrgMembersController],
  providers: [OrgMembersService],
  exports: [OrgMembersService],
})
export class OrgMembersModule {}
