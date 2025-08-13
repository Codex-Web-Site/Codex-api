import { Controller, Get, Query, UseGuards, HttpException, HttpStatus, Post, Body, Req, Param, Patch, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GoogleBooksService } from '../google-books/google-books.service';
import { BookService } from './book.service';

@Controller('library')
export class LibraryController {
  constructor(
    private readonly googleBooksService: GoogleBooksService,
    private readonly bookService: BookService,
  ) {}

  @Get('search')
  @UseGuards(AuthGuard('jwt'))
  async searchBooks(@Query('query') query: string) {
    if (!query) {
      throw new HttpException('Query parameter is required.', HttpStatus.BAD_REQUEST);
    }
    try {
      const data = await this.googleBooksService.searchBooks(query);
      return data;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('add')
  @UseGuards(AuthGuard('jwt'))
  async addBookToLibrary(@Body() bookData: any, @Req() req) {
    const userId = req.user.id;
    const accessToken = req.headers.authorization?.split(' ')[1];
    try {
      const book = await this.bookService.findOrCreateBook(bookData, userId, accessToken);
      const userBook = await this.bookService.addUserBook(userId, book.id, accessToken);
      return userBook;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('/')
  @UseGuards(AuthGuard('jwt'))
  async getUserBooks(@Req() req, @Query('status') status?: string) {
    const userId = req.user.id;
    const accessToken = req.headers.authorization?.split(' ')[1];
    try {
      const books = await this.bookService.getUserBooks(userId, status, accessToken);
      return books;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':userBookId')
  @UseGuards(AuthGuard('jwt'))
  async getUserBookById(@Param('userBookId') userBookId: string, @Req() req) {
    const userId = req.user.id;
    try {
      const book = await this.bookService.getUserBookById(userBookId, userId);
      return book;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Patch(':userBookId/status')
  @UseGuards(AuthGuard('jwt'))
  async updateUserBookStatus(@Param('userBookId') userBookId: string, @Body('status') status: string, @Req() req) {
    const userId = req.user.id;
    if (!status) {
      throw new HttpException('Status is required.', HttpStatus.BAD_REQUEST);
    }
    try {
      const updatedBook = await this.bookService.updateUserBookStatus(userBookId, status, userId);
      return updatedBook;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':userBookId')
  @UseGuards(AuthGuard('jwt'))
  async deleteUserBook(@Param('userBookId') userBookId: string, @Req() req) {
    const userId = req.user.id;
    try {
      const result = await this.bookService.deleteUserBook(userBookId, userId);
      return result;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
