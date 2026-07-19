import { Module } from '@nestjs/common';
import { ConfigModule, ConfigModuleOptions } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

export const configModuleOptions: ConfigModuleOptions = {
  isGlobal: true,
  envFilePath: '../.env',
};

@Module({
  imports: [ConfigModule.forRoot(configModuleOptions)],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
