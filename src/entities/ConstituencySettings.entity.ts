import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

export enum RepresentativeType {
  MLA = 'MLA',
  MP = 'MP',
}

export interface AssemblyConstituencyConfig {
  id: string;
  name: string;
  ruralEnabled: boolean;
  urbanEnabled: boolean;
  districtName?: string;
}

@Entity('constituency_settings')
export class ConstituencySettings {
  @PrimaryColumn({ type: 'int', default: 1 })
  id: number;

  @Column({
    type: 'enum',
    enum: RepresentativeType,
    default: RepresentativeType.MLA,
  })
  representativeType: RepresentativeType;

  @Column({ type: 'varchar', length: 150, default: 'Jajpur Constituency Portal' })
  portalName: string;

  @Column({ type: 'varchar', length: 150, default: 'Shri Akash Dasnayak' })
  representativeName: string;

  @Column({ type: 'varchar', length: 150, default: 'Jajpur Assembly' })
  constituencyName: string;

  @Column({ type: 'varchar', length: 100, default: 'Odisha' })
  stateName: string;

  @Column({ type: 'varchar', length: 100, default: 'Jajpur' })
  districtName: string;

  @Column({ type: 'varchar', length: 150, default: 'Jajpur (SC) Lok Sabha' })
  lokSabhaName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  lokSabhaId: string;

  @Column({ type: 'varchar', length: 150, default: 'Korei Assembly' })
  assemblyName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  assemblyId: string;

  @Column({ type: 'boolean', default: true })
  ruralEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  urbanEnabled: boolean;

  @Column({ type: 'jsonb', nullable: true })
  assemblyConstituencies: AssemblyConstituencyConfig[];

  @Column({ type: 'varchar', length: 50, nullable: true })
  representativeMobileDisplay: string;

  @Column({ type: 'text', nullable: true })
  officeAddress: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
