import { FormGroup } from "@angular/forms";

export function ConfirmedValidator(
    controlName: string,
    confirmControlName:string,
){
    return (formGroup:FormGroup) => {
        const control = formGroup.controls[controlName];
        const confirmControl = formGroup.controls[confirmControlName];

        if(confirmControl.errors && !confirmControl.errors.confirmedValidator){
            return;
        }
        if(control.value !== confirmControl.value){
            confirmControl.setErrors({confirmedValidator:true});
        }else{
            // confirmControl.setErrors({confirmedValidator:false});
            confirmControl.setErrors(null);

        }

        return null;
    }
}