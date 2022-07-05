import {
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Capacitor } from '@capacitor/core';
import { ModalController, Platform, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { User } from '../interfaces/user.class';
import { AuthService } from '../services/auth.service';
import { PhotoService } from '../services/photo.service';
import { ProfileService } from '../services/profile.service';
import { ChangePasswordModalComponent, UpdatePasswordDto } from './change-password-modal/change-password.component';
import {
  EditField,
  EditInputModalComponent,
} from './edit-input-modal/edit-input.component';

@Component({
  selector: 'app-account',
  templateUrl: 'account.page.html',
  styleUrls: ['account.page.scss'],
})
export class AccountPage implements OnInit, OnDestroy {
  user: any;
  imageForm: FormGroup;

  isModalOpen: boolean = false;
  isChangePass: boolean = false;
  isUsePicker: boolean = false;
  selectedField = null;
  selectedImage = null;
  updateInput: string;

  private _subscriptions: Subscription[] = [];

  @ViewChild('imagePicker') filePicker : ElementRef<HTMLInputElement>;

  constructor(
    private authService: AuthService,
    private platform: Platform,
    private modalCtrl: ModalController,
    private photoService: PhotoService,
    private profileService: ProfileService,
    private toastCtrl: ToastController,
  ) {}

  ngOnInit(): void {
    if (
      (this.platform.is('mobile') && !this.platform.is('hybrid')) ||
      this.platform.is('desktop')
    ) {
      this.isUsePicker = true;
    }
    this.imageForm = new FormGroup({
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

  ionViewWillEnter() {
    this._subscriptions['user'] = this.authService.user.subscribe(
      (user: User) => {
        this.user = { ...user };
        this.selectedImage = user?.profile.avatar;
      }
    );
  }

  async onSaveChange() {
    console.log('update');
    // const {fullname,phone,matricId,bio} = this.user._profile;
    const image = this.imageForm.get('image').value;
    if(image){
      const {url} = await this.photoService.uploadAvatar(image).toPromise();
      if(url){
        const avatar = `${environment.serviceURI}/${url}`;
        this.user._profile.avatar = avatar;
      }
    }

    this.profileService.update({
      ...this.user._profile,
    }).subscribe((response)=>{
      this.presentToast('Profile updated!');
    },error=>{
      const message = error.error.message ?? error.message ?? 'Failed to update profile'; 
      this.presentToast(message);
    })
  }

  async presentChangePasswordModal(){
    const eventHandler = new EventEmitter();
    eventHandler.subscribe((event)=>{
      this.changePasswordHandler(event);
      eventHandler.unsubscribe();
    });

    const modal = await this.modalCtrl.create({
      component: ChangePasswordModalComponent,
      componentProps: {
        changePasswordHandler: eventHandler,
      }
    });
    await modal.present();
  }

  changePasswordHandler(event:UpdatePasswordDto){
    //present loading ...
    this._subscriptions['updatePassword'] = this.authService.changePassword(event).subscribe(response=>{
      this.presentToast('Password Updated!');
    },error=>{
      const message = error?.error?.message ?? "Unable to update password, make sure your current password in correct";
      this.presentToast(message);
    })
  }

  async presentEditModal(name: string) {
    console.log('user:', this.user);
    let field: EditField;
    switch (name) {
      case 'name':
        field = {
          key: 'name',
          value: this.user._profile.fullname,
        };
        break;
      case 'phone':
        field = {
          key: 'phone',
          value: this.user._profile.phone,
        };
        break;
      case 'matric':
        field = {
          key: 'matric',
          value: this.user._profile.matricId,
        };
        break;
      case 'bio':
        field = {
          key: 'bio',
          value: this.user._profile.bio,
        };
        break;
    }

    const event = new EventEmitter();
    event.subscribe((field: EditField) => {
      this.updateValueHandler(field);
      event.unsubscribe();
    });
    //open modal
    const modal = await this.modalCtrl.create({
      component: EditInputModalComponent,
      componentProps: {
        field,
        updateValueHandler: event,
      },
    });
    await modal.present();
  }

  updateValueHandler(field: EditField) {
    // console.log('update_value:',field);
    switch (field.key) {
      case 'name':
        this.user._profile.fullname = field.value;
        break;
      case 'phone':
        this.user._profile.phone = field.value;
        break;
      case 'matric':
        this.user._profile.matricId = field.value;
        break;
      case 'bio':
        this.user._profile.bio = field.value;
        break;
    }
  }

  async pickImage() {
    if (!Capacitor.isPluginAvailable('Camera') || this.isUsePicker) {
      this.filePicker.nativeElement.click();
      return;
    }
    const imageDataURL = await this.photoService.snapPicture();
    this.selectedImage = imageDataURL;
    this.onImagePicked(this.selectedImage);
  }

  chooseFile(event) {
    const pickedFile = (event.target as HTMLInputElement).files[0];
    if (!pickedFile) return;
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const dataUrl = fileReader.result.toString();
      this.selectedImage = dataUrl;
      this.onImagePicked(pickedFile);
    };
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
    this.imageForm.patchValue({ image });
    //upload the data, get url and update profile
  }

  async presentToast(message:string){
    const toast = await this.toastCtrl.create({
      message,
      duration: 5000
    });
    await toast.present();
  }
}
