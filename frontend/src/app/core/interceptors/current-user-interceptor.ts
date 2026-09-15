import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CurrentUser } from '../services/current-user';

/** Attaches the simulated-auth headers to every outgoing request, so feature services
 * (RequestsService) don't need to know anything about authentication. */
export const currentUserInterceptor: HttpInterceptorFn = (req, next) => {
  const currentUser = inject(CurrentUser);

  const authedReq = req.clone({
    setHeaders: {
      'X-User-Id': String(currentUser.userId()),
      'X-Is-Admin': String(currentUser.isAdministrator()),
    },
  });

  return next(authedReq);
};
