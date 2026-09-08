import { Btn, FormDialogDirective, FormDialogDirectiveOptions, FormModel } from '@journeyapps/reactor-mod';
import { AbstractFilter } from '../../../core/query/filters';

export interface ClearableFilterFormDialogDirectiveOptions<
  T extends FormModel = FormModel
> extends FormDialogDirectiveOptions<T> {
  filter?: AbstractFilter;
}

export class ClearableFilterFormDialogDirective<T extends FormModel = FormModel> extends FormDialogDirective<T> {
  constructor(private options3: ClearableFilterFormDialogDirectiveOptions<T>) {
    super(options3);
  }

  getButtons(): Btn[] {
    const baseButtons = super.getButtons();
    if (!this.options3.filter) {
      return baseButtons;
    }
    return [
      {
        label: 'Clear filter',
        icon: 'trash',
        action: () => {
          this.options3.filter.delete();
          this.dispose(true);
        }
      },
      ...baseButtons
    ];
  }
}
