import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrgMemberDesignation } from './OrgMemberDesignation.entity';

export enum OrgMemberStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
}

export enum InfluenceLevel {
  NORMAL = 'NORMAL',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

@Entity('org_members')
export class OrgMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  fullName: string;

  @Column({ type: 'varchar', length: 20 })
  mobile: string;

  @Column({ type: 'uuid' })
  designationId: string;

  @ManyToOne(() => OrgMemberDesignation, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'designationId' })
  designation: OrgMemberDesignation;

  @Column({
    type: 'enum',
    enum: OrgMemberStatus,
    default: OrgMemberStatus.PENDING,
  })
  status: OrgMemberStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  profilePhotoUrl: string;

  @Column({
    type: 'enum',
    enum: InfluenceLevel,
    default: InfluenceLevel.NORMAL,
  })
  influenceLevel: InfluenceLevel;

  @Column({ type: 'boolean', default: false })
  isKeyPerson: boolean;

  // JSON Hierarchy Location fields
  @Column({ type: 'varchar', length: 100, nullable: true })
  stateName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  districtName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  assemblyName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  assemblyId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  orgUnitId: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  orgUnitName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  panchayatId: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  panchayatName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  villageId: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  villageName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  wardId: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  wardName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  boothId: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  boothName: string;

  @Column({ type: 'uuid', nullable: true })
  createdById: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
