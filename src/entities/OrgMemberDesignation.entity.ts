import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('org_member_designations')
export class OrgMemberDesignation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'int', default: 0 })
  orderIndex: number;
}
