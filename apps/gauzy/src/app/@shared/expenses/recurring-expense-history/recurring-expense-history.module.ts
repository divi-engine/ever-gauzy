import { NgModule } from '@angular/core';
import { NbIconModule } from '@nebular/theme';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { I18nTranslateModule } from '@gauzy/ui-sdk/i18n';
import { TableComponentsModule } from '@gauzy/ui-sdk/shared';
import { SharedModule } from '../../shared.module';
import { RecurringExpenseHistoryComponent } from './recurring-expense-history.component';

@NgModule({
	imports: [
		Angular2SmartTableModule,
		TableComponentsModule,
		NbIconModule,
		I18nTranslateModule.forChild(),
		SharedModule
	],
	exports: [RecurringExpenseHistoryComponent],
	declarations: [RecurringExpenseHistoryComponent]
})
export class RecurringExpenseHistoryModule {}
