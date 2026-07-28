import 'reflect-metadata';
import { validate } from 'class-validator';
import { GetExecutiveDashboardQueryDto } from './get-executive-dashboard.query.dto';

describe('R1,R5: executive dashboard month query', () => {
  it('accepts a valid YYYY-MM month and rejects malformed or impossible months', async () => {
    const valid = Object.assign(new GetExecutiveDashboardQueryDto(), {
      month: '2026-07',
    });
    const malformed = Object.assign(new GetExecutiveDashboardQueryDto(), {
      month: '2026-7',
    });
    const impossible = Object.assign(new GetExecutiveDashboardQueryDto(), {
      month: '2026-13',
    });

    await expect(validate(valid)).resolves.toHaveLength(0);
    await expect(validate(malformed)).resolves.not.toHaveLength(0);
    await expect(validate(impossible)).resolves.not.toHaveLength(0);
  });
});
