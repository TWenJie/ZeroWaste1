import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { User } from 'src/app/interfaces/user.class';

import { Chart, registerables } from 'chart.js';
import { AnalyticsService } from 'src/app/services/analytics.service';
Chart.register(...registerables);

@Component({
  selector: 'app-profile-about',
  templateUrl: 'about.component.html',
  styleUrls: ['about.component.scss'],
})
export class ProfileAboutComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() user: User;

  @ViewChild('feedChartCanvas') private feedActivityChartCanvas: ElementRef;
  @ViewChild('smartbinChartCanvas')
  private smartbinActivityChartCanvas: ElementRef;

  feedChart: any;
  smartbinChart: any;

  profileContent: any;
  private _subscriptions: Subscription[] = [];
  constructor(
    private analyticsService: AnalyticsService,
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this._subscriptions.forEach(sub=>{
        if(sub){
            console.log('unsubscribe',sub);
            sub.unsubscribe();
        }
    })
  }

  ngAfterViewInit(): void {
    if (this.user.hasOwnProperty('_profile')) {
      this._subscriptions['analytics'] = this.analyticsService
        .profileCountsSummary()
        .subscribe(
          (response) => {
            const {
              profileContent,
              feedActivityEvents,
              smartbinActivityEvents,
            } = response;
            this.profileContent = profileContent;

            this.feedActivityChartInit(feedActivityEvents);
            this.smartbinActivityChartInit(smartbinActivityEvents);
          },
          (error) => {
            console.error(error);
          }
        );
    }
    // this.barChartInit(this.activityData);
  }

  async getChartData(dataObject: any[]) {
    let labels = [];
    let data = [];
    let total = 0;
    await dataObject.forEach((item) => {
      labels.push(item['eventType'].replace('Event', ''));
      data.push(item['total']);
      total += parseInt(item['total']);
    });

    return {
      labels,
      data,
      total,
    };
  }

  async feedActivityChartInit(dataObject: any[]) {
    const { labels, data } = await this.getChartData(dataObject);
    this.feedChart = new Chart(this.feedActivityChartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        // labels: ['Liked Post', 'Clicked URL', 'Click Location', 'Clicked Post', 'Watch Video'],
        datasets: [
          {
            label: '# of Activities',
            data,
            // data: [200, 50, 30, 15, 20, 34],
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(255, 159, 64, 0.2)',
            ],
            borderColor: [
              'rgba(255,99,132,1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {},
      },
    });
  }

  async smartbinActivityChartInit(dataObject: any[]) {
    const { labels, data } = await this.getChartData(dataObject);
    this.smartbinChart = new Chart(
      this.smartbinActivityChartCanvas.nativeElement,
      {
        type: 'bar',
        data: {
          labels,
          // labels: ['Liked Post', 'Clicked URL', 'Click Location', 'Clicked Post', 'Watch Video'],
          datasets: [
            {
              label: '# of Activities',
              data,
              // data: [200, 50, 30, 15, 20, 34],
              backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)',
              ],
              borderColor: [
                'rgba(255,99,132,1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {},
        },
      }
    );
  }
}
