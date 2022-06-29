import { Injectable } from '@angular/core';
import { _initStorage } from 'localforage-cordovasqlitedriver';
import * as CordovaSQLiteDriver from 'localforage-cordovasqlitedriver';
import { Storage } from '@ionic/storage-angular';

const TTL = 10; //time to live for our cache
const CACHE_KEY = '_api_req_cache_';

@Injectable({
  providedIn: 'root',
})
export class CachingService {
  constructor(private storage: Storage) {}

  async initStorage() {
    await this.storage.defineDriver(CordovaSQLiteDriver);
    await this.storage.create();
  }

  cacheRequests(url: string, data: any) {
    const validUntil = new Date().getTime() + TTL * 1000;
    url = `${CACHE_KEY}${url}`;

    return this.storage.set(url, {
      validUntil,
      data,
    });
  }

  async getCachedRequest(url:string) {
    const currentTime = new Date().getTime();
    url = `${CACHE_KEY}${url}`;
    const storedValue = await this.storage.get(url);
    if (!storedValue) {
      return null;
    } else if (storedValue.validUntil < currentTime) {
      await this.storage.remove(url);
      return null;
    } else {
      return storedValue.data;
    }
  }

  async clearCachedData() {
    // this.storage.clear();
    const keys = await this.storage.keys();

    keys.map(async (key) => {
      if (key.startsWith(CACHE_KEY)) {
        await this.storage.remove(key);
      }
    });
  }

  async invalidateCacheEntry(url:string) {
    url = `${CACHE_KEY}${url}`;
    await this.storage.remove(url);
  }
}
