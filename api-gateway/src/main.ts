import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true // Transform is recomended configuration for avoind issues with arrays of files transformations
    })
  );
  const PORT = process.env.PORT || 3000;
  await app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
    console.log(`${process.env.NATS_URL}`);
  });
}
bootstrap();
