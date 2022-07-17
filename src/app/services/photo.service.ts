import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Camera,
  CameraResultType,
  CameraSource,
  GalleryPhotos,
  Photo,
} from '@capacitor/camera';
import { ToastController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ImagesUploadResponse, ImageUploadResponse } from '../interfaces/feeds.interface';

export interface CapturedPhoto {
  filepath: string;
  webviewPath: string;
}

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  private _MEDIA_URI = `${environment.serviceURI}/media`;
  private _API_URL = environment.serviceURI;

  constructor(private http: HttpClient, private toastCtrl: ToastController) {}

  public async snapPicture(): Promise<string> {
    //take a photo
    return Camera.getPhoto({
      resultType: CameraResultType.DataUrl, //try change to Uri if problem occure
      source: CameraSource.Prompt,
      correctOrientation: true,
      quality: 80,
    })
      .then((image: Photo) => {
        return image.dataUrl;
      })
      .catch((error) => {
        const message = error.message ?? 'Unable to snap picture';
        this.presentToast(message);
        return null;
      });
  }

  public async pickImages() : Promise<string[]>{
    const gelleryPhotos = await Camera.pickImages({
      correctOrientation: true,
      quality: 80,
      limit: 4,
      width: 800,
      height: 418,
    }) as GalleryPhotos;

    const limit = 4;
    return gelleryPhotos.photos.slice(0,limit).map(photo=>{
      return photo.webPath;
    })
  }

  /**
   * Send formData to backend.
   * @param formData
   * @param foldername
   * @returns
   */
  private upload(formData: FormData, foldername: string) {
    // const headers = this._headers;
    return this.http.post<ImageUploadResponse>(
      this._MEDIA_URI + foldername,
      formData
    );
  }

  private uploads(formData:FormData,foldername:string){
    console.log('FormData_before_upload::',formData);
    return this.http.post<ImagesUploadResponse>(
      this._MEDIA_URI + foldername,
      formData
    )
  }

  uploadAvatar(image: File) {
    const formData = new FormData();
    formData.append('avatar', image);
    return this.upload(formData, '/avatar/images');
  }

  uploadImage(image: File) {
    const formData = new FormData();
    formData.append('images[]', image);
    return this.uploads(formData, '/feeds/images/');
  }

  uploadImages(images: File[]) : Observable<ImagesUploadResponse> {
    const formData = new FormData();
    //limit image upload to 4
    for (let i = 0; i < 4; i++) {
      formData.append(`images[]`, images[i]);
    }
    // formData.append("image",images);

    return this.uploads(formData, '/feeds/images/');
  }

  async presentToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 5000,
    });
    toast.present();
  }

  base64ToBlob(base64String: string, contentType: string) {
    contentType = contentType || '';
    const sliceSize = 1024;
    const byteCharacters = window.atob(base64String);
    const bytesLength = byteCharacters.length;
    const slicesCount = Math.ceil(bytesLength / sliceSize);
    const byteArrays = new Array(slicesCount);

    for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
      const begin = sliceIndex * sliceSize;
      const end = Math.min(begin + sliceSize, bytesLength);

      const bytes = new Array(end - begin);
      for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
        bytes[i] = byteCharacters[offset].charCodeAt(0);
      }
      byteArrays[sliceIndex] = new Uint8Array(bytes);
    }
    return new Blob(byteArrays, { type: contentType });
  }

  blobToBase64(blob: Blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });
  }

  //webpath is blob:http://address.something
  webPathToBlob(path:string){
    //fetch, then convert the response into base64 or blob;
    return this.http.get(path,{
      responseType: 'blob'
    }).pipe(tap((response:Blob)=>{
      console.log('responseWebPath:',response);
    }))
  }
}
