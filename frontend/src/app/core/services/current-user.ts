import { Service, signal } from '@angular/core';

/**
 * Stands in for a real login/session. The backend has no authentication of its own for
 * this exercise - it trusts X-User-Id / X-Is-Admin headers (see RequestsController).
 * This service holds "who we currently are" so the rest of the app can react to it, and
 * the interceptor can attach it to every request.
 */
@Service()
export class CurrentUser {
  readonly userId = signal(1);
  readonly isAdministrator = signal(false);
}
