import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActionSheetController, ModalController } from "@ionic/angular";
import { CreateEventComponent } from "../content-crud/create-event/create-event.component";
import { CreateFeedComponent } from "../content-crud/create-feed/create-feed.component";
import { AuthService } from "src/app/services/auth.service";
import { User } from "../interfaces/user.class";
import { Subscription } from "rxjs";
import { Role } from "../interfaces/user.interface";
import { CreateEZWCComponent } from "../content-crud/create-ezwc/create-ezwc.component";
import { AnalyticsService } from "../services/analytics.service";

@Component({
    selector: 'app-tabs',
    templateUrl: 'tabs.page.html',
    styleUrls: ['tabs.page.scss']
})
export class TabsPage implements OnInit, OnDestroy {

    public user: User;
    private _subscriptions: Subscription [] = [];

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
        { title: 'Profile', url: '/tabs/profile', icon: 'person' },
        { title: 'Account', url: '/tabs/account', icon: 'settings' },
        { title: 'Themes', onClick: this.onToggleTheme.bind(this), icon: 'color-fill' },
        { title: 'Logout', onClick:  this.onLogout.bind(this) , icon: 'log-out' },
        // { title: 'Trash', url: '/folder/Trash', icon: 'trash' },
        // { title: 'Spam', url: '/folder/Spam', icon: 'warning' },
      ];
    // public labels = ['approved', 'reported', 'pending'];

    constructor(
        private actionSheetCtrl: ActionSheetController,
        private modalCtrl: ModalController,
        private authService: AuthService,
        private analyticsService: AnalyticsService,
    ){
        // console.log( 'suth_service:', authService) ;
    }

    ngOnInit(): void {
        this.analyticsService.createSession().then(response=>{
            if(response.hasOwnProperty('id')){
              console.log('Sessions: created');
              return;
            }
          }
        ).catch(async(error)=>{
            console.error(error);
            console.log("Can't create session");
        })
    }

    ngOnDestroy(): void {
        this._subscriptions.forEach(sub=>{
            if(sub){
                console.log('unsubscribe',sub);
                sub.unsubscribe();
            }
        })
    }

    ionViewWillEnter(){

        this._subscriptions['authUser'] = this.authService.user.subscribe((user:User)=>{
            this.user = user;
        });

    }


    onLogout(){
        // console.log('Logging out...');
        this.authService.logout();
    }

    onToggleTheme(){
        if(this.toggleTheme == 'dark'){
            document.body.classList.add('dark');
            this.toggleTheme = 'light';
        }else{
            document.body.classList.remove('dark');
            this.toggleTheme = 'dark';
        }
    }

    async presentActionSheet(){

        const buttons = [
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

        if(this.user.role == Role.Moderator || this.user.role == Role.WebAdmin){
            buttons.push({
                text: 'Educational feeds',
                icon: 'book',
                cssClass: 'ezwc-action-button',
                handler:()=>{
                    this.presentModal(CreateEZWCComponent);
                }
            })
        }
        const actionSheet = await this.actionSheetCtrl.create({
            header: 'Create',
            cssClass: 'creation-actionsheet',
            buttons
        });

        await actionSheet.present();
    }

    async presentModal(modalComponent:any){
        const modal = await this.modalCtrl.create({
            component: modalComponent,
            componentProps: {
                user: this.user,
            }
        })
        await modal.present();
    }
}