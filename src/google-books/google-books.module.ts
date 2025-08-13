import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GoogleBooksService } from './google-books.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [GoogleBooksService],
  exports: [GoogleBooksService],
})
export class GoogleBooksModule {}
