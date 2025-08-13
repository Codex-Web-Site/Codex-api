import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BookService {
  private supabase;

  constructor(
    private readonly configService: ConfigService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL')!;
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY')!;

    this.supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
    );
  }

  async findOrCreateBook(bookData: any, userId: string, accessToken: string) {
    const { googleBooksId, isbn, title, author, description, coverUrl, pageCount, genre, publishedDate, publisher } = bookData;

    const supabase = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      }
    );

    let book: any = null;
    try {
      // Tenter de trouver le livre par googleBooksId ou ISBN
      let { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('google_books_id', googleBooksId)
        .single();

      if (error && error.code === 'PGRST116') { // PGRST116: no rows found
        // Si non trouvé par googleBooksId, essayer par ISBN
        if (isbn) {
          let { data: bookByIsbn, error: isbnError } = await supabase
            .from('books')
            .select('*')
            .eq('isbn', isbn)
            .single();
          
          if (!isbnError && bookByIsbn) {
            book = bookByIsbn;
          }
        }
      } else if (data) {
        book = data;
      }

      if (!book) {
        // Le livre n'existe pas, l'insérer
        const { data: newBook, error: insertError } = await supabase
          .from('books')
          .insert({
            google_books_id: googleBooksId,
            isbn: isbn,
            title: title,
            author: author,
            description: description,
            cover_url: coverUrl,
            page_count: pageCount,
            genre: genre,
            published_date: publishedDate,
            publisher: publisher,
            created_by: userId,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting new book:', insertError);
          throw new HttpException('Failed to save book information.', HttpStatus.INTERNAL_SERVER_ERROR);
        }
        book = newBook;
      }
    } catch (e) {
      throw e; // Re-lancer l'exception pour qu'elle soit gérée plus haut
    }

    return book;
  }

  async addUserBook(userId: string, bookId: string, accessToken: string) {
    const supabase = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      }
    );

    try {
      // Vérifier si l'utilisateur a déjà ce livre
      const { data: existingUserBook, error: userBookError } = await supabase
        .from('user_books')
        .select('id')
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .single();

      if (existingUserBook) {
        throw new HttpException('Ce livre est déjà dans votre bibliothèque.', HttpStatus.CONFLICT);
      }

      // Ajouter le livre à la bibliothèque de l'utilisateur
      const { data: userBook, error: insertError } = await supabase
        .from('user_books')
        .insert({
          user_id: userId,
          book_id: bookId,
          status_id: 1, // Par défaut: 'to_read' (ID 1)
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error adding book to user library:', insertError);
        throw new HttpException('Failed to add book to your library.', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return userBook;
    } catch (e) {
      throw e; // Re-lancer l'exception
    }
  }

  async getReadingStatusId(statusName: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('reading_statuses')
      .select('id')
      .eq('status_name', statusName)
      .single();

    if (error || !data) {
      throw new HttpException(`Status '${statusName}' not found.`, HttpStatus.NOT_FOUND);
    }
    return data.id;
  }

  async updateUserBookStatus(userBookId: string, statusName: string, userId: string) {
    const statusId = await this.getReadingStatusId(statusName);
    const updateData: any = { status_id: statusId, updated_at: new Date() };

    if (statusName === 'finished') {
      updateData.finished_at = new Date();
    } else if (statusName === 'reading') {
      updateData.started_at = new Date();
    }

    const { data, error } = await this.supabase
      .from('user_books')
      .update(updateData)
      .eq('id', userBookId)
      .eq('user_id', userId) // S'assurer que l'utilisateur est bien le propriétaire
      .select()
      .single();

    if (error) {
      console.error('Error updating user book status:', error);
      throw new HttpException('Failed to update book status.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return data;
  }

  async getUserBooks(userId: string, statusName?: string, accessToken?: string) {
    const supabase = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      }
    );

    let query = supabase
      .from('user_books')
      .select(`
        id,
        status_id,
        rating,
        started_at,
        finished_at,
        book:books(*)
      `)
      .eq('user_id', userId);

    if (statusName) {
      const statusId = await this.getReadingStatusId(statusName);
      query = query.eq('status_id', statusId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user books:', error);
      throw new HttpException('Failed to fetch user books.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return data;
  }

  async getUserBookById(userBookId: string, userId: string) {
    const { data, error } = await this.supabase
      .from('user_books')
      .select(`
        id,
        status_id,
        rating,
        started_at,
        finished_at,
        book:books(*)
      `)
      .eq('id', userBookId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user book:', error);
      throw new HttpException('Failed to fetch user book.', HttpStatus.NOT_FOUND);
    }
    return data;
  }

  async deleteUserBook(userBookId: string, userId: string) {
    const { error } = await this.supabase
      .from('user_books')
      .delete()
      .eq('id', userBookId)
      .eq('user_id', userId); // S'assurer que l'utilisateur est bien le propriétaire

    if (error) {
      console.error('Error deleting user book:', error);
      throw new HttpException('Failed to delete user book.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return { message: 'Livre supprimé de votre bibliothèque.' };
  }
}