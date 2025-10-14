import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const configService = app.get(ConfigService);
  const globalPrefix = configService.get<string>('GLOBAL_PREFIX', 'api');

  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true }
    })
  );

  app.use(json({ limit: '20mb' }));
  app.use(urlencoded({ extended: true }));

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);
  console.log(`🚀 Backend listo en http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
