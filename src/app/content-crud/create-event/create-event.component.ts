import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Capacitor } from "@capacitor/core";
import { ModalController, Platform, ToastController } from "@ionic/angular";
import { Subscription } from "rxjs";
import { switchMap } from "rxjs/operators";
import { ImageUploadResponse } from "src/app/interfaces/feeds.interface";
import { FeedsEventService } from "src/app/services/feeds-event.service";
import { PhotoService } from "src/app/services/photo.service";
import { environment } from "src/environments/environment";

@Component({
    selector: 'app-create-event',
    templateUrl: 'create-event.component.html',
    styleUrls: ['create-event.component.scss'],
})
export class CreateEventComponent implements OnInit, OnDestroy {
    private _API_URL = environment.serviceURI;

    form: FormGroup
    minDate;
    maxDate;
    usePicker: boolean = false;
    selectedImage: string;
    selectedImages: string[] = [];

    private _subscriptions: Subscription[] = [];
    @ViewChild('imagePicker') filePicker: ElementRef<HTMLInputElement>;
    constructor(
        private modalCtrl: ModalController,
        private feedsService: FeedsEventService,
        private photoService: PhotoService,
        private platform: Platform,
        private toastCtrl: ToastController,
    ){}
    
    ngOnInit(): void {
        if (
            (this.platform.is('mobile') && !this.platform.is('hybrid')) ||
            this.platform.is('desktop')
          ) {
            this.usePicker = true;
        }

        this.minDate = new Date().toISOString();
        this.maxDate = new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toISOString(); // 3 years ahead
        this.form = new FormGroup({
            title: new FormControl(null,{
              validators: [Validators.required, Validators.maxLength(120)]
            }),
            textContent: new FormControl(null,{
              validators: [Validators.required, Validators.maxLength(230)]
            }),
            eventType: new FormControl('UserEvent'),
            startTime: new FormControl(this.minDate,{validators:[Validators.required]}),
            endTime: new FormControl(this.minDate,{validators:[Validators.required]}),
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


    /**
     * 6 July 2022
     * using latest subscribe method, using observable instead of complete and error callback
     * //latest only take 1 argument.
     * .subscribe({
     *      next: () => {},
     *      error: () => {},
     *      complete: () => {},
     * })
     * 
     * //deprecated
     * .subscribe((response)=>{},(error)=>{})
     * 
     * we first check if form valid, then if contain iamge, we upload the image to get the public url.
     * then we append it to the resourceURL, the rest is to create new feed (this might change depend on backend changes to support multi image)
     * @returns 
     */
    create(){
        if(!this.form.valid) return;
        // let resources:ImageUploadResponse[];
        const image = this.form.get('image').value;
        if(image){
            this._subscriptions['imageUpload'] = this.photoService.uploadImages(image)
            .pipe(switchMap((response)=>{
                if(response.savedResources.length > 0){
                    console.log('img_URL:',response.savedResources);
                    return this.feedsService.create({
                        title: this.form.get('title').value,
                        textContent: this.form.get('textContent').value,
                        eventType: this.form.get('eventType').value,
                        startTime: this.form.get('startTime').value,
                        endTime: this.form.get('endTime').value,
                        resources: response.savedResources
                    })
                }
            })).subscribe({next:this.createSuccessHandler.bind(this),error:this.createFailedHandler.bind(this)})
        }else {
            this._subscriptions['createEvent'] = this.feedsService.create({
                title: this.form.get('title').value,
                textContent: this.form.get('textContent').value,
                eventType: this.form.get('eventType').value,
                startTime: this.form.get('startTime').value,
                endTime: this.form.get('endTime').value,
            }).subscribe({ next: this.createSuccessHandler.bind(this), error: this.createFailedHandler.bind(this)})
        }
    }

    createSuccessHandler(response){
        this.form.reset();
        this.presentToast("Event created");
        this.closeModal();
    }

    createFailedHandler(error){
        const message = error?.error?.message ?? 'Unable to create event!';
        this.presentToast(message);
        return;
    }

    async pickImage(){
        this.selectedImages = [];
        if (!Capacitor.isPluginAvailable('Camera') || this.usePicker) {
            this.filePicker.nativeElement.click();
            return;
        }
        const imageDataURL = await this.photoService.snapPicture();
        this.selectedImage = imageDataURL;
        const image = this.convertToBlob(this.selectedImage);
        //then we take image, and patch forms.
        this.form.patchValue({
          image,
        })
    }

    chooseFile(event){
        const pickedFiles = (event.target as HTMLInputElement).files;
        // console.log('PickedFiles:',pickedFiles);
        if(!pickedFiles) return;

        /**
         * Loop thru files we selected, and read using Filereader
         */
        const imagesBlobs = [];
        for(let i = 0; i < pickedFiles.length; i++){
          // console.log('each_file:',pickedFiles[i]);
          if(!pickedFiles[i].type.match("image")) continue;
          const fileReader = new FileReader();
          fileReader.onload = (event) => {
            const dataUrl = fileReader.result.toString();
            this.selectedImages.push(dataUrl);
            //then convert base64 image to blob
            const imageBlob = this.convertToBlob(dataUrl);
            imagesBlobs.push(imageBlob);
          }
          fileReader.readAsDataURL(pickedFiles[i]);
        }

        this.form.patchValue({
          image: imagesBlobs
        })
        // fileReader.readAsDataURL(pickedFile);
    }
    
    convertToBlob(imageData: string | File) {
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
        // this.form.patchValue({ image });
        return image;
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