import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
    {
        path: '',
        component: TabsPage,
        children: [
            {
                path:'feeds',
                loadChildren: () => import('../feeds/feeds.module').then(m=>m.FeedsPageModule)
            },
            {
                path:'ezwc',
                loadChildren: () => import('../ezwc/ezwc.module').then(m=>m.EZWCPageModule)
            },
            {
                path:'smartbins',
                loadChildren: () => import('../smartbin/smartbin.module').then(m=>m.SmartbinPageModule)
            },
            {
                path:'calendar',
                loadChildren: () => import('../calendar/calendar.module').then(m=>m.CalendarPageModule)
            },
            {
                path: 'profile',
                loadChildren: () => import('../profile/profile.module').then(m=> m.ProgilePageModule),
            },
            {
                path: 'account',
                loadChildren: () => import('../account/account.module').then(m=>m.AccountPageModule)
            },
            {
                path: '',
                redirectTo: '/tabs/feeds',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: '',
        redirectTo: '/tabs/feeds',
        pathMatch: 'full'
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule{}