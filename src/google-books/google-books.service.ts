import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleBooksService {
  private readonly GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async searchBooks(query: string): Promise<any> {
    const apiKey = this.configService.get<string>('GOOGLE_BOOKS_API_KEY');
    if (!apiKey) {
      throw new Error('Google Books API Key not configured.');
    }

    try {
      const response = await this.httpService.get(
        `${this.GOOGLE_BOOKS_API_URL}?q=${encodeURIComponent(query)}&key=${apiKey}`,
      ).toPromise();
      if (!response) {
        throw new Error('No response from Google Books API.');
      }
      return response.data;
    } catch (error) {
      console.error('Error searching Google Books:', error.message);
      throw new Error('Failed to search books from Google Books API.');
    }
  }
}
