import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ApiResponse,
  isPaginatedPayload,
} from '../api/api-response.interface';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T> | ApiResponse<T[]>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T> | ApiResponse<T[]>> {
    return next.handle().pipe(
      map((data): ApiResponse<T> | ApiResponse<T[]> => {
        if (isPaginatedPayload<T>(data)) {
          return {
            success: true,
            data: data.data,
            meta: data.meta,
          };
        }

        return {
          success: true,
          data: data as T,
          meta: null,
        };
      }),
    );
  }
}
