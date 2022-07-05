import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { ModalController } from "@ionic/angular";

@Component({
    selector: 'account-edit-input-modal',
    templateUrl: 'edit-input.component.html',
    styleUrls: ['edit-input.component.scss']
})
export class EditInputModalComponent implements OnInit{
    @Input() field: EditField;
    @Output() updateValueHandler : EventEmitter<EditField> = new EventEmitter();

    phoneRegex = new RegExp(/^\+[0-9]{1,3}[0-9]{4,14}(?:x.+)?$/);


    constructor(
        private modalCtrl: ModalController,
    ){}

    ngOnInit(): void {
        
    }

    updateValue(){
        this.updateValueHandler.emit(this.field);
        this.modalCtrl.dismiss();
    }
}

export interface EditField{
    key: 'name' | 'phone' | 'matric' | 'bio';
    value: string;
}
