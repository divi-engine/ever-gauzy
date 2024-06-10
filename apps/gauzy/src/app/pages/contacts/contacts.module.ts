import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
	NbButtonModule,
	NbCardModule,
	NbDialogModule,
	NbIconModule,
	NbInputModule,
	NbTooltipModule,
	NbSelectModule,
	NbToggleModule,
	NbSpinnerModule,
	NbStepperModule
} from '@nebular/theme';
import { NgSelectModule } from '@ng-select/ng-select';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { NgxPermissionsModule } from 'ngx-permissions';
import { I18nTranslateModule } from '@gauzy/ui-sdk/i18n';
import { InviteService, OrganizationContactService, OrganizationProjectsService } from '@gauzy/ui-sdk/core';
import {
	GauzyButtonActionModule,
	LeafletMapModule,
	LocationFormModule,
	PaginationV2Module
} from '@gauzy/ui-sdk/shared';
import { CardGridModule } from '../../@shared/card-grid/card-grid.module';
import { EmployeeMultiSelectModule } from '../../@shared/employee/employee-multi-select/employee-multi-select.module';
import { FileUploaderModule } from '../../@shared/file-uploader-input/file-uploader-input.module';
import { ImageUploaderModule } from '../../@shared/image-uploader/image-uploader.module';
import { SharedModule } from '../../@shared/shared.module';
import { TagsColorInputModule } from '../../@shared/tags/tags-color-input/tags-color-input.module';
import { ContactMutationComponent } from './contact-mutation/contact-mutation.component';
import { ContactsRoutingModule } from './contacts-routing.module';
import { ContactsComponent } from './contacts.component';
import { InviteContactComponent } from './invite-contact/invite-contact.component';
import { ContactActionComponent } from './table-components';

const COMPONENTS = [ContactsComponent, InviteContactComponent, ContactMutationComponent, ContactActionComponent];

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		NbButtonModule,
		NbCardModule,
		NbDialogModule.forChild(),
		NbIconModule,
		NbInputModule,
		NbSelectModule,
		NbSpinnerModule,
		NbStepperModule,
		NbToggleModule,
		NbTooltipModule,
		Angular2SmartTableModule,
		NgSelectModule,
		CardGridModule,
		ContactsRoutingModule,
		EmployeeMultiSelectModule,
		FileUploaderModule,
		GauzyButtonActionModule,
		ImageUploaderModule,
		LeafletMapModule,
		LocationFormModule,
		PaginationV2Module,
		SharedModule,
		TagsColorInputModule,
		I18nTranslateModule.forChild(),
		NgxPermissionsModule.forChild()
	],

	declarations: [...COMPONENTS],
	providers: [OrganizationContactService, OrganizationProjectsService, InviteService]
})
export class ContactsModule {}
