import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Capacitor } from "@capacitor/core";
import { ModalController, ToastController } from "@ionic/angular";
import { Subscription } from "rxjs";
import { switchMap } from "rxjs/operators";
import { FeedsEZWCService } from "src/app/services/feeds-ezwc.service";
import { PhotoService } from "src/app/services/photo.service";

@Component({
    selector: 'app-create-ezwc',
    templateUrl: 'create-ezwc.component.html',
    styleUrls: ['create-ezwc.component.scss']
})
export class CreateEZWCComponent implements OnInit,OnDestroy{
    private _subscriptions: Subscription[] = [];

    form: FormGroup;
    usePicker: boolean = false;
    selectedImages: string[];

    @ViewChild('imagePicker') filePicker: ElementRef<HTMLInputElement>;
    constructor(
        private modalCtrl: ModalController,
        private photoService: PhotoService,
        private ezwcService: FeedsEZWCService,
        private toastCtrl: ToastController,
    ){}
    ngOnInit(): void {
        this.form = new FormGroup({
            textContent: new FormControl(null,{
                validators: [Validators.required],
            }),
            dataformURL: new FormControl(null,{
                validators: [Validators.pattern(/(https?:\/\/datastudio.google.com\/[^ ]*)/)]
            }),
            images: new FormControl(null),
        })
    }
    ngOnDestroy(): void {
        this._subscriptions.forEach((sub) => {
          if (sub) {
            console.log('unsubscribe', sub);
            sub.unsubscribe();
          }
        });
    }


    create(){
      if(!this.form.valid) return;
      const images = this.form.get('images').value;
      if(images){
        this._subscriptions['imageUpload'] = this.photoService.uploadImages(images)
        .pipe(
          switchMap((response)=>{
            if(response.savedResources.length > 0){
              return this.ezwcService.create({
                textContent: this.form.get('textContent').value,
                resources: response.savedResources,
                dataStudioURL: this.form.get('dataformURL').value
              })
            }
          })
        ).subscribe({
          next: this.createSuccessHandler.bind(this),
          error: this.createFailedHandler.bind(this),
        })
      }else{
        this._subscriptions['createFeed'] = this.ezwcService.create({
            textContent: this.form.get('textContent').value,
            dataStudioURL: this.form.get('dataformURL').value
        }).subscribe({
            next: this.createSuccessHandler.bind(this),
            error: this.createFailedHandler.bind(this),
        })
      }
    }

    createSuccessHandler(response){
      this.form.reset();
      this.presentToast("Feed created");
      this.closeModal();
    }

    createFailedHandler(error){
        const message = error?.error?.message ?? 'Unable to create feed!';
        this.presentToast(message);
        return;
    }

    async pickImage(){
        this.selectedImages = [];
        if (!Capacitor.isPluginAvailable('Camera') || this.usePicker) {
            console.log('using picker');
            this.filePicker.nativeElement.click();
            return;
        }
        console.log('using Capacitor plugin');
        const imageDataURL = await this.photoService.pickImages();
        // console.log('imageData:',imageDataURL);
        this.selectedImages = imageDataURL; //use for displaying back in view.

        /**
         * iterate over the webpath url, and convert it into blob images
         * so that we can patch it in form to upload via http. 
         */
        if(imageDataURL.length > 0){
          let blobImages : Blob [] = [];
          for(let i = 0; i < imageDataURL.length; i++){
             const blob = await this.photoService.webPathToBlob(imageDataURL[i]).toPromise() as Blob;
             if(blob){
              blobImages.push(blob);
             }  
          }
          // console.log('BlobsImages:',blobImages);
          if(blobImages.length > 0){
            this.form.patchValue({
              images:blobImages
            })
          }
        }
    }

    /**
     * we use this as fallback if,there is no capacitor plugin,
     * we will use webform picker to pick up images,
     * then we convert the base64 images to blob and patch the form.
     * @param imageData 
     * @returns 
     */
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

    /**
     * Incase filepicked is being used instead of capacitor plugin, this will be triggered
     * on file changes.
     * we read files as dataUrl, then assign the url to selectedImages to display back in view.
     * then we convert it to blob and patch our form. 
     * (seems like there is something redundant, but I am not sure what it is)
     * 
     * @param event 
     */
    chooseFile(event){
      const pickedFiles = (event.target as HTMLInputElement).files;
      if(!pickedFiles) return;

      const blobsImages : Blob [] = [];
      for(let i = 0; i < pickedFiles.length; i++){
        if(!pickedFiles[i].type.match("image")) continue;
        const fileReader = new FileReader();
        fileReader.onload = (event) =>{
          const dataUrl = fileReader.result.toString();
          this.selectedImages.push(dataUrl);
          const blob = this.convertToBlob(dataUrl);
          if(blob){
            blobsImages.push(blob);
          }
        }
        fileReader.readAsDataURL(pickedFiles[i]);
      }

      this.form.patchValue({
        images: blobsImages,
      })
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