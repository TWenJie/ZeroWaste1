import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActionSheetController, ModalController } from "@ionic/angular";
import { CreateEventComponent } from "../content-crud/create-event/create-event.component";
import { CreateFeedComponent } from "../content-crud/create-feed/create-feed.component";
import { AuthService } from "src/app/services/auth.service";

@Component({
    selector: 'app-tabs',
    templateUrl: 'tabs.page.html',
    styleUrls: ['tabs.page.scss']
})
export class TabsPage implements OnInit, OnDestroy {

    private _user: any;

    toggleTheme:string = 'dark';

    tabs = [
        {
            path: 'feeds',
            label: 'Home',
            icon: 'home'
        },
        {
            path: 'ezwc',
            label: 'e-zwc',
            icon: 'newspaper'
        },
        {
            path: null,
            label: 'create',
            icon: 'duplicate-outline',
            onClick: ()=> {
                // console.log('something')
                this.presentActionSheet();
            }  
        },
        {
            path: 'smartbins',
            label: 'finder',
            icon: 'map'
        },
        {
            path: 'calendar',
            label: 'events',
            icon: 'calendar'
        },

    ]

    public appPages = [
        { title: 'Profile', url: '/profile', icon: 'person' },
        { title: 'Account', url: '/account', icon: 'settings' },
        { title: 'Themes', onClick: this.onToggleTheme.bind(this), icon: 'color-fill' },
        { title: 'Logout', onClick:  this.onLogout.bind(this) , icon: 'log-out' },
        { title: 'Trash', url: '/folder/Trash', icon: 'trash' },
        { title: 'Spam', url: '/folder/Spam', icon: 'warning' },
      ];
    //   public labels = ['Family', 'Friends', 'Notes', 'Work', 'Travel', 'Reminders'];

    constructor(
        private actionSheetCtrl: ActionSheetController,
        private modalCtrl: ModalController,
        private authService: AuthService,
    ){
        // console.log( 'suth_service:', authService) ;
    }

    ngOnInit(): void {
        
    }

    ngOnDestroy(): void {
        
    }

    onLogout(){
        // console.log('Logging out...');
        this.authService.logout();
    }

    onToggleTheme(){
        console.log('Toggle Theme')
        if(this.toggleTheme == 'dark'){
            document.body.classList.add('dark');
            this.toggleTheme = 'light';
        }else{
            document.body.classList.remove('dark');
            this.toggleTheme = 'dark';
        }
    }

    async presentActionSheet(){
        const actionSheet = await this.actionSheetCtrl.create({
            header: 'Create',
            cssClass: 'creation-actionsheet',
            buttons: [
                {
                    text: 'Feeds',
                    icon: 'shapes',
                    cssClass: 'feeds-action-button',
                    handler: () => {
                      console.log('Feeds Create')
                      this.presentModal(CreateFeedComponent);
                    }
                  },
                  {
                    text: 'Events',
                    icon: 'calendar-number',
                    cssClass: 'events-action-button',
                    handler:()=>{
                        console.log('events Create')
                        this.presentModal(CreateEventComponent);

                    }
                  }
                  ,
                  {
                    text: 'cancel',
                    icon: 'close',
                    role: 'cancel',
                    handler:()=>{

                    }
                  }
            ]
        });

        await actionSheet.present();
    }

    async presentModal(modalComponent:any){
        const modal = await this.modalCtrl.create({
            component: modalComponent,
            componentProps: {
                user: this._user,
            }
        })
        await modal.present();
    }
}