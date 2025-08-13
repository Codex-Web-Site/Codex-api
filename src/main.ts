import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DebugInterceptor } from './debug.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // Activer CORS pour autoriser les requêtes depuis le frontend
  app.enableCors({
    origin: 'http://localhost:3000', // L'URL de votre frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Appliquer l'intercepteur de débogage globalement
  app.useGlobalInterceptors(new DebugInterceptor());

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
