import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('auth_login_attempts')
export class AuthLoginAttemptOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 66 }) key: string;
  @Column({ type: 'int' }) attempts: number;
  @Index('auth_login_attempts_expiry')
  @Column({ type: 'timestamptz' })
  expiresAt: Date;
}
