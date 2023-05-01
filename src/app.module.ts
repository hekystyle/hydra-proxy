import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { z } from 'zod';
import { HydraController } from './hydra.controller.js';

const envSchema = z.object({
  TARGET_HOST: z.string(),
  USER_FIELD: z.string().optional(),
});

export type EnvironmentVariables = z.infer<typeof envSchema>;

export type AppConfigService = ConfigService<EnvironmentVariables>;

@Module({
  controllers: [HydraController],
  exports: [],
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      validate: config => envSchema.parse(config),
    }),
  ],
  providers: [],
})
export class AppModule {}
