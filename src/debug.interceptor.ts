
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class DebugInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    console.log('--- [DebugInterceptor] Incoming Request ---');
    console.log(`[${request.method}] ${request.url}`);
    console.log('Headers:', JSON.stringify(request.headers, null, 2));
    console.log('Body:', JSON.stringify(request.body, null, 2)); // Log the request body
    console.log('------------------------------------------');

    return next
      .handle()
      .pipe(
        tap(() => console.log(`--- [DebugInterceptor] Response Sent ---`)),
        catchError(err => {
          console.error('--- [DebugInterceptor] Error Caught ---');
          console.error(err);
          console.error('------------------------------------------');

          // Si c'est une HttpException, la renvoyer telle quelle
          if (err instanceof HttpException) {
            return throwError(() => err);
          }

          // Pour les autres erreurs, renvoyer une HttpException générique
          return throwError(() => new HttpException(
            err.message || 'Internal server error',
            HttpStatus.INTERNAL_SERVER_ERROR
          ));
        })
      );
  }
}
