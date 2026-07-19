import { getMetadataArgsStorage } from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';

describe('R2: ORM entity mapped onto the users table', () => {
  it("maps the entity to the 'users' table", () => {
    const table = getMetadataArgsStorage().tables.find(
      (t) => t.target === UserOrmEntity,
    );

    expect(table).toBeDefined();
    expect(table?.name).toBe('users');
  });

  it('declares the data model columns', () => {
    const columns = getMetadataArgsStorage().columns.filter(
      (c) => c.target === UserOrmEntity,
    );
    const propertyNames = columns.map((c) => c.propertyName);

    expect(propertyNames).toEqual(
      expect.arrayContaining([
        'id',
        'email',
        'passwordHash',
        'fullName',
        'role',
        'createdAt',
      ]),
    );
  });

  it('enforces a UNIQUE constraint on email', () => {
    const emailColumn = getMetadataArgsStorage().columns.find(
      (c) => c.target === UserOrmEntity && c.propertyName === 'email',
    );

    expect(emailColumn?.options.unique).toBe(true);
  });
});
