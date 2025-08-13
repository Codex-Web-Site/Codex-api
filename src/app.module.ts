import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BookModule } from './book/book.module';
import { MailModule } from './mail/mail.module';
import { GroupModule } from './group/group.module';
import { GoogleBooksModule } from './google-books/google-books.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    BookModule,
    MailModule,
    GroupModule,
    GoogleBooksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

