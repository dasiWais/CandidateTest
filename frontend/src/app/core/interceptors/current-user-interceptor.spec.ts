import { HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CurrentUser } from '../services/current-user';
import { currentUserInterceptor } from './current-user-interceptor';

describe('currentUserInterceptor', () => {
  let currentUser: CurrentUser;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CurrentUser] });
    currentUser = TestBed.inject(CurrentUser);
  });

  it('attaches X-User-Id and X-Is-Admin from the CurrentUser service', () => {
    currentUser.userId.set(42);
    currentUser.isAdministrator.set(true);

    const request = new HttpRequest('GET', '/api/requests');
    let outgoing: HttpRequest<unknown> | undefined;

    TestBed.runInInjectionContext(() =>
      currentUserInterceptor(request, (req) => {
        outgoing = req;
        return of();
      }),
    );

    expect(outgoing?.headers.get('X-User-Id')).toBe('42');
    expect(outgoing?.headers.get('X-Is-Admin')).toBe('true');
  });

  it('reflects a regular (non-admin) user correctly', () => {
    currentUser.userId.set(7);
    currentUser.isAdministrator.set(false);

    const request = new HttpRequest('GET', '/api/requests');
    let outgoing: HttpRequest<unknown> | undefined;

    TestBed.runInInjectionContext(() =>
      currentUserInterceptor(request, (req) => {
        outgoing = req;
        return of();
      }),
    );

    expect(outgoing?.headers.get('X-User-Id')).toBe('7');
    expect(outgoing?.headers.get('X-Is-Admin')).toBe('false');
  });
});
