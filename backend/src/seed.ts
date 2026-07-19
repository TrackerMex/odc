import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeedUsersUseCase } from './modules/users/application/use-cases/seed-users.usecase';

async function runSeed(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const { created, skipped } = await app.get(SeedUsersUseCase).execute();
    console.log(`Seed finished. Created: [${created.join(', ')}]`);
    if (skipped.length > 0) {
      console.log(`Already existed (skipped): [${skipped.join(', ')}]`);
    }
  } finally {
    await app.close();
  }
}

void runSeed();
