import { Component } from '@angular/core';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  public appPages = [
    { title: 'Profile', url: '/folder/Inbox', icon: 'person' },
    { title: 'Account', url: '/folder/Outbox', icon: 'settings' },
    { title: 'Themes', url: '/folder/Favorites', icon: 'color-fill' },
    { title: 'Logout', url: '/folder/Archived', icon: 'log-out' },
    { title: 'Trash', url: '/folder/Trash', icon: 'trash' },
    { title: 'Spam', url: '/folder/Spam', icon: 'warning' },
  ];
  public labels = ['Family', 'Friends', 'Notes', 'Work', 'Travel', 'Reminders'];
  constructor() {}
}
