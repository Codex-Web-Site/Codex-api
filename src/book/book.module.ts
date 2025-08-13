
import { Module } from '@nestjs/common';
import { BookService } from './book.service';
import { HttpModule } from '@nestjs/axios';
import { GoogleBooksModule } from '../google-books/google-books.module';
import { LibraryController } from './library.controller';

@Module({
  imports: [HttpModule, GoogleBooksModule],
  controllers: [LibraryController],
  providers: [BookService],
})
export class BookModule {}
