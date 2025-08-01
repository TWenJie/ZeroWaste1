import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { JwtInterceptor } from './interceptors/jwt.interceptor';
import { IonicStorageModule } from '@ionic/storage-angular';

import { Drivers } from '@ionic/storage';
import * as CordovaSQLiteDriver from 'localforage-cordovasqlitedriver';
import { SharedDirectivesModule } from './directives/shared-directives.module';
import { QuillModule, QuillModules } from 'ngx-quill';

import { environment } from '../environments/environment';

// ✅ MongoDB Service Provider
import { MongoDBService } from './services/mongodb.service';

// ✅ Consistent naming for Quill modules
const quillModules: QuillModules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ align: [] }],
    ['link'],
  ],
};

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    SharedDirectivesModule,
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    HttpClientModule,
    IonicStorageModule.forRoot({
      driverOrder: [CordovaSQLiteDriver._driver, Drivers.IndexedDB],
    }),
    QuillModule.forRoot({
      modules: quillModules,
    }),
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    MongoDBService, // ✅ MongoDB Service Provider
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}