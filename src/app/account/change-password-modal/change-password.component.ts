import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { ConfirmedValidator } from 'src/app/validators/confirm-password.validator';

@Component({
  selector: 'account-change-password-modal',
  templateUrl: 'change-password.component.html',
  styleUrls: ['change-password.component.scss'],
})
export class ChangePasswordModalComponent implements OnInit {
  updateform: FormGroup;
  @Output() changePasswordHandler: EventEmitter<UpdatePasswordDto> =
    new EventEmitter();
  constructor(private modalCtrl: ModalController) {}

  ngOnInit(): void {
    this.updateform = new FormGroup(
      {
        oldPassword: new FormControl(null, [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(30),
        ]),
        newPassword: new FormControl(null, [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(30),
        ]),
        confirmPassword: new FormControl(null, [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(30),
        ]),
      },
      {
        validators: ConfirmedValidator('newPassword', 'confirmPassword'),
      }
    );
  }

  onUpdatePassword(){
    if(!this.updateform.valid) return;
    this.changePasswordHandler.emit({
      oldPassword: this.updateform.value.oldPassword,
      newPassword: this.updateform.value.newPassword,
      confirmPassword: this.updateform.value.confirmPassword,
    });
    this.modalCtrl.dismiss();
  }
}

export interface UpdatePasswordDto {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}
