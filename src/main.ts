import { NestFactory } from '@nestjs/core';
import morgan from 'morgan';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const morganLogger = new Logger('morgan');
  app.use(
    morgan('[:date[iso]] ":method :url HTTP/:http-version" :status :res[content-length]', {
      stream: {
        write: msg => morganLogger.debug(msg.trim()),
      },
    }),
  );
  await app.listen(80);
}

bootstrap().catch(err =>
  // eslint-disable-next-line no-console -- we're in main
  console.error(err),
);
