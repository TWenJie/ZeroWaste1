import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { CalendarComponent } from "ionic2-calendar";
import { Subscription } from "rxjs";
import { PaginationOptions, PaginationResponse } from "../interfaces/pagination.interface";
import { AnalyticsService, FeedEventTypes } from "../services/analytics.service";
import { FeedsEventService } from "../services/feeds-event.service";
import { EventFeed } from "../interfaces/feeds.interface";

@Component({
    selector: 'app-calendar',
    templateUrl: 'calendar.page.html',
    styleUrls: ['calendar.page.scss'],
})
export class CalendarPage implements OnInit, OnDestroy{
    viewTitle:string;
    calendar = {
        mode: 'month',
        currentDate: new Date(),
    }
    selectedDate: Date = new Date();
    selectedEvent: any = null;
    isModalOpen : boolean = false;
    events: any[];
    currentModal = null;

    pagination: PaginationOptions;
    paginationResponse : PaginationResponse<EventFeed>;

    @ViewChild(CalendarComponent) myCal: CalendarComponent;
    private _subscriptions: Subscription[] = [];
    constructor(
        private feedsService: FeedsEventService,
        private analyticsService: AnalyticsService,

    ){}
    ngOnInit(): void {
       this.pagination = {
        limit: 100,
        page: 0,
       }
    }

    ionViewWillEnter(){
       this.fetchEvents();
    }

    fetchEvents(){
        this._subscriptions['events'] = this.feedsService.paginate(this.pagination)
        .subscribe({
            next: (response)=>{
                this.paginationResponse =response;
                console.log('Events:',this.paginationResponse.results);
                this.parsedFeedsToCalendar(response.results);
            },
            error: (error)=>{

            }
        })
    }

    async parsedFeedsToCalendar(feedEvents: EventFeed[]){
        this.events = feedEvents.map(e=>{
            return {
                id: e.id,
                title: e.title,
                createdAt: new Date(e.createdAt),
                startTime: new Date(e.startTime),
                endTime: (e.endTime) ? new Date(e.endTime) : new Date(e.startTime),
                allDay: false,
                descriptions: e.textContent,
                resources: e.resources,
                author: e.author,
                eventType: e.eventType,
            }
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

    next(){
        this.myCal.slideNext();
    }
    
    back(){
        this.myCal.slidePrev();
    }
    
    onViewTitleChanged(title){
        this.viewTitle = title;
    }

    onTimeSelected(event){
    }

    onCurrentDateChanged(event){

    }
    reloadSource(startTime,endTime){
  
    }


    onEventSelected(selectedEvent){
        this.isModalOpen = true;
        this.selectedEvent = selectedEvent;

        //log event
        this.analyticsService.logEvent({
          eventType: FeedEventTypes.ViewEvent,
          sourceId: selectedEvent?.id
        }).toPromise().then(response=>{
          console.log('View Calendar event logged:',response)
        }).catch(error=>{
          console.error(error);
        })
      }
    
    async dismissModal(){
        this.isModalOpen = false;
    }
}