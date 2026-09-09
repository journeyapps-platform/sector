import { BooleanSetting, PrefsStore, SetSetting, ioc } from '@journeyapps/reactor-mod';

export enum QueryControlPreferences {
  SHOW_SORT_CONTROLS = 'databrowser/query-controls/show-sort-controls',
  SHOW_FILTER_CONTROLS = 'databrowser/query-controls/show-filter-controls',
  FILTER_NULL_FIELDS_IN_RELATIONSHIP_PEEK = 'databrowser/query-controls/filter-null-fields-in-relationship-peek',
  SHOW_ID_VALUE_IN_ID_COLUMN = 'databrowser/query-controls/show-id-value-in-id-column',
  TABLE_CONTROLS_POSITION = 'databrowser/query-controls/table-controls-position'
}

export enum TableControlsPositionValue {
  TOP = 'top',
  BOTTOM = 'bottom',
  BOTH = 'both'
}

export class TableControlsPositionPreference extends SetSetting {
  static KEY = QueryControlPreferences.TABLE_CONTROLS_POSITION;

  constructor() {
    super({
      key: TableControlsPositionPreference.KEY,
      name: 'Table controls position',
      category: 'Query Controls',
      value: TableControlsPositionValue.BOTH,
      options: [
        {
          key: TableControlsPositionValue.TOP,
          label: 'Top'
        },
        {
          key: TableControlsPositionValue.BOTTOM,
          label: 'Bottom'
        },
        {
          key: TableControlsPositionValue.BOTH,
          label: 'Both'
        }
      ]
    });
  }

  static getValue(): TableControlsPositionValue {
    return ioc.get(PrefsStore).getPreference<TableControlsPositionPreference>(TableControlsPositionPreference.KEY)
      .value as TableControlsPositionValue;
  }
}

export const registerQueryControlPreferences = (prefsStore: PrefsStore) => {
  prefsStore.registerPreference(
    new BooleanSetting({
      key: QueryControlPreferences.SHOW_SORT_CONTROLS,
      checked: true,
      name: 'Show sort controls',
      category: 'Query Controls'
    })
  );
  prefsStore.registerPreference(
    new BooleanSetting({
      key: QueryControlPreferences.SHOW_FILTER_CONTROLS,
      checked: true,
      name: 'Show filter controls',
      category: 'Query Controls'
    })
  );
  prefsStore.registerPreference(
    new BooleanSetting({
      key: QueryControlPreferences.FILTER_NULL_FIELDS_IN_RELATIONSHIP_PEEK,
      checked: true,
      name: 'Hide null fields in relationship peek',
      category: 'Query Controls'
    })
  );
  prefsStore.registerPreference(
    new BooleanSetting({
      key: QueryControlPreferences.SHOW_ID_VALUE_IN_ID_COLUMN,
      checked: true,
      name: 'Show ID value in ID column',
      category: 'Query Controls'
    })
  );
  prefsStore.registerPreference(new TableControlsPositionPreference());
};
