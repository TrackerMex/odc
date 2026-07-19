import { Module } from '@nestjs/common';
import {
  ConfigModule,
  ConfigModuleOptions,
  ConfigService,
} from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmModuleOptionsFactory } from './config/typeorm.config';
import { HealthController } from './health.controller';

export const configModuleOptions: ConfigModuleOptions = {
  isGlobal: true,
  envFilePath: '../.env',
};

@Module({
  imports: [
    ConfigModule.forRoot(configModuleOptions),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: typeOrmModuleOptionsFactory,
    }),
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
