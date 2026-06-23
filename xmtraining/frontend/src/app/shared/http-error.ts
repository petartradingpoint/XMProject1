import { HttpErrorResponse } from '@angular/common/http';

/** Extracts a human-readable message from an API error response. */
export function extractErrorMessage(err: unknown, fallback = 'Something went wrong.'): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as { message?: string | string[]; error?: string } | null;
    if (body) {
      if (Array.isArray(body.message)) {
        return body.message.join(', ');
      }
      if (typeof body.message === 'string') {
        return body.message;
      }
      if (typeof body.error === 'string') {
        return body.error;
      }
    }
    if (err.status === 0) {
      return 'Cannot reach the API. Is the backend running on port 8080?';
    }
    return `${err.status} ${err.statusText}`.trim() || fallback;
  }
  return fallback;
}
