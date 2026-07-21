import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeedSuppliersUseCase } from './modules/suppliers/application/use-cases/seed-suppliers.usecase';
import { SeedUsersUseCase } from './modules/users/application/use-cases/seed-users.usecase';

async function runSeed(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const { created, skipped } = await app.get(SeedUsersUseCase).execute();
    console.log(`Seed finished. Created: [${created.join(', ')}]`);
    if (skipped.length > 0) {
      console.log(`Already existed (skipped): [${skipped.join(', ')}]`);
    }

    const suppliersResult = await app.get(SeedSuppliersUseCase).execute();
    console.log(
      `Suppliers seed finished. Created: [${suppliersResult.created.join(', ')}]`,
    );
    if (suppliersResult.skipped.length > 0) {
      console.log(
        `Already existed (skipped): [${suppliersResult.skipped.join(', ')}]`,
      );
    }
  } finally {
    await app.close();
  }
}

void runSeed();
