import { Directive, Input, OnDestroy, TemplateRef, ViewContainerRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { User } from 'src/app/interfaces/user.class';
import { AuthService } from 'src/app/services/auth.service';


@Directive({
  selector: '[appHasRole]'
})
export class HasRoleDirective implements OnDestroy {

  @Input('appHasRole') roles:string[]
  private _authSub: Subscription;
  constructor(
    private authService: AuthService,
    private readonly templateRef: TemplateRef<any>,
    private readonly viewContainer: ViewContainerRef,
  ) { }

  ngOnInit(){
    
    this._authSub = this.authService.user.subscribe((user:User)=>{
      if(user){
        if(this.roles.indexOf(user.role) !== -1){
          return this.viewContainer.createEmbeddedView(this.templateRef)
        }
      }
      return this.viewContainer.clear();  
    })
    

  }

  ngOnDestroy(): void {
      if(!this._authSub){
        this._authSub.unsubscribe();
      }
  }

}