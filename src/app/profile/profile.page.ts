import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  ActionSheetController,
  LoadingController,
  ToastController,
} from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Complain } from '../interfaces/complain.interface';
import { Post } from '../interfaces/feeds.interface';
import {
  PaginationOptions,
  PaginationResponse,
} from '../interfaces/pagination.interface';
import { User } from '../interfaces/user.class';
import { AuthService } from '../services/auth.service';
import { ComplainsService } from '../services/complains.service';
import { ContentActionsService } from '../services/content-actions.service';
import { ProfileFeedsService } from '../services/feeds-profile.service';

@Component({
  selector: 'app-profile-page',
  templateUrl: 'profile.page.html',
  styleUrls: ['profile.page.scss'],
})
export class ProfilePage implements OnInit, OnDestroy {
  private _subscriptions: Subscription[] = [];

  user: User;
  profileSegment: string;
  loading: boolean = false;

  pagination: PaginationOptions;
  paginationResponse: PaginationResponse<Post>;



  complainsPagination: PaginationOptions;
  complainsResponse: PaginationResponse<Complain>;

  constructor(
    private authService: AuthService,
    private profileFeedsService: ProfileFeedsService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private complainsService: ComplainsService,
    private contentActionsService: ContentActionsService,
    private actionSheetsCtrl: ActionSheetController,
    private router: Router,
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this._subscriptions.forEach((sub) => {
      if (sub) {
        console.log('unsubscribe', sub);
        sub.unsubscribe();
      }
    });
  }

  ionViewWillEnter() {
    this.profileSegment = 'myfeeds';
    this.pagination = {
      limit: 100,
      page: 0,
    };

    this.complainsPagination = this.pagination;

    this._subscriptions['user'] = this.authService.user.subscribe(
      (user: User) => {
        this.user = user;
      },
      (error) => {
        this.fetchErrorHandler(error);
      }
    );

    this.fetchPosts();
    this.fetchComplains();
  }

  fetchPosts(event = null) {
    console.log('Pagination:', this.pagination);
    this._subscriptions['posts'] = this.profileFeedsService
      .paginate(this.pagination)
      .subscribe(
        (response: PaginationResponse<Post>) => {
          this.paginationResponse = response;
          console.log(this.paginationResponse);

          if (event) {
            event.target.complete();
          }
        },
        (error) => {
          this.fetchErrorHandler(error);
        }
      );
  }

  fetchComplains() {
    this._subscriptions['complains'] = this.complainsService
      .paginate(this.complainsPagination)
      .subscribe((response: PaginationResponse<Complain>) => {
        this.complainsResponse = response;
      });
  }

  

  fetchNext(event) {
    //switc case filter, then fetch;
    let { totalPages } = this.paginationResponse;
    if (this.pagination.page >= totalPages - 1) {
      if (event) event.target.complete();
      return;
    }
    this.pagination.page = this.pagination.page + 1;
    this.fetchPosts(event);
  }

  onRefreshList() {
    //Switch on filters, then fetchpost
    this.pagination.page = 0;
    this.fetchPosts();
  }

  fetchErrorHandler(error) {
    let message = error.error.message ?? 'Unable to fetch posts';
    this.presentToast(message);
  }

  async presentToast(message) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 5000,
    });
    await toast.present();
  }

  contentActionsHandler(item) {
    this.contentActionsService.showActions(item);
  }

  async openProfileActions(){
    const actions = await this.actionSheetsCtrl.create({
      animated: true,
      backdropDismiss: true,
      buttons: [{
        text: 'Account settings',
        icon: 'person',
        handler: ()=>{
          this.router.navigate(['tabs','account']);
        }
      }]
    })

    await actions.present();
  }
}
