export const USER_ROLES = [
  'DIRECTOR_OPS',
  'ADMINISTRACION',
  'DIRECTOR_GENERAL',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export class User {
  constructor(
    public readonly id: string | null,
    public email: string,
    public passwordHash: string,
    public fullName: string,
    public role: UserRole,
    public createdAt: Date | null,
  ) {}
}
