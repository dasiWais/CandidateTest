import { Component, inject } from '@angular/core';
import { CurrentUser } from './core/services/current-user';
import { RequestsSearchPage } from './features/requests/requests-search-page/requests-search-page';

@Component({
  selector: 'app-root',
  imports: [RequestsSearchPage],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly currentUser = inject(CurrentUser);

  protected onUserIdChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.currentUser.userId.set(Number.isFinite(value) && value > 0 ? value : 1);
  }

  protected onAdminToggle(event: Event): void {
    this.currentUser.isAdministrator.set((event.target as HTMLInputElement).checked);
  }
}
