import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DebugInterceptor } from './debug.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // Activer CORS pour autoriser les requêtes depuis le frontend
  const whitelist = ['http://localhost:3000', 'https://codex-client-six.vercel.app'];
  app.enableCors({
    origin: function (origin, callback) {
      if (!origin || whitelist.indexOf(origin) !== -1) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Appliquer l'intercepteur de débogage globalement
  app.useGlobalInterceptors(new DebugInterceptor());

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
