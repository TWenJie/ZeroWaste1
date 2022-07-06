import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Capacitor } from '@capacitor/core';
import { ModalController, Platform, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ImageUploadResponse } from 'src/app/interfaces/feeds.interface';
import { FeedsService } from 'src/app/services/feeds.service';
import { PhotoService } from 'src/app/services/photo.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-create-feed',
  templateUrl: 'create-feed.component.html',
  styleUrls: ['create-feed.component.scss'],
})
export class CreateFeedComponent implements OnInit, OnDestroy {
  private _API_URL = environment.serviceURI;

  usePicker: boolean = false;
  selectedImage: string;
  createForm: FormGroup;

  private _subscriptions: Subscription[] = [];
  @ViewChild('imagePicker') filePicker: ElementRef<HTMLInputElement>;
  constructor(
    private modalCtrl: ModalController,
    private platform: Platform,
    private photoService: PhotoService,
    private feedsService: FeedsService,
    private toastCtrl: ToastController,
  ) {}
  ngOnInit(): void {
    if (
      (this.platform.is('mobile') && !this.platform.is('hybrid')) ||
      this.platform.is('desktop')
    ) {
      this.usePicker = true;
    }
    this.createForm = new FormGroup({
      textContent: new FormControl(null, {
        validators: [Validators.required],
      }),
      image: new FormControl(null),
    });
  }
  ngOnDestroy(): void {
    this._subscriptions.forEach((sub) => {
      if (sub) {
        console.log('unsubscribe', sub);
        sub.unsubscribe();
      }
    });
  }

  createPost() {
    if(!this.createForm.valid) return;
    let imageURL:string;
    const image = this.createForm.get('image').value;
    if(image){
       this._subscriptions['imageUpload'] = this.photoService.uploadImage(image)
       .pipe(switchMap((response)=>{
        if(response?.url){
            imageURL = `${this._API_URL}/${response.url}`;
            return this.feedsService.create({
              textContent: this.createForm.get('textContent').value,
              resourceURL: [imageURL],
            });
        }
       })).subscribe((response)=>{
        this.createForm.reset();
        this.presentToast("Post created!");
        this.closeModal();
       },error=>{
        const message = error?.error?.message ?? 'Unable to create post';
        this.presentToast(message);
        return;
       })
    }else {
        this._subscriptions ['createFeeds'] = this.feedsService.create({
            textContent: this.createForm.get('textContent').value
        }).subscribe((response)=>{
            this.createForm.reset();
            this.presentToast("Post created!");
            this.closeModal();
        },error=>{
            const message = error?.error?.message ?? 'Unable to create post'
            this.presentToast(message);
            return;
        })
    }
  }

  

  async pickImage() {
    if (!Capacitor.isPluginAvailable('Camera') || this.usePicker) {
      this.filePicker.nativeElement.click();
      return;
    }
    const imageDataURL = await this.photoService.snapPicture();
    this.selectedImage = imageDataURL;
    this.onImagePicked(this.selectedImage);
  }

  chooseFile(event){
    const pickedFile = (event.target as HTMLInputElement).files[0];
    if(!pickedFile) return;
    const fileReader = new FileReader();
    fileReader.onload = () =>{
      const dataUrl = fileReader.result.toString();
      this.selectedImage = dataUrl;
      this.onImagePicked(pickedFile);
    }
    fileReader.readAsDataURL(pickedFile);
  }

  onImagePicked(imageData: string | File) {
    let image;
    if (typeof imageData === 'string') {
      try {
        image = this.photoService.base64ToBlob(
          imageData.replace('data:image/jpeg;base64,', ''),
          'image/jpeg'
        );
      } catch (error) {
        console.error(error);
        return;
      }
    } else {
      image = imageData;
    }
    this.createForm.patchValue({ image });
  }

  async presentToast(message:string){
    const toast = await this.toastCtrl.create({
        message,
        duration: 5000
    });
    await toast.present();
  }

  async closeModal() {
    const modal = await this.modalCtrl.getTop();

    if (modal) {
      modal.dismiss();
    }
  }
}
