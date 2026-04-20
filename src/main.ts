import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Verbalise API')
    .setDescription('API documentation for Verbalise browser extension and web app')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
    app.enableCors({
    origin: [
      'http://localhost:3000', // Next.js dev server
      'http://localhost:3005', // If you access API directly from browser
    ],
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3005);
}
bootstrap();
