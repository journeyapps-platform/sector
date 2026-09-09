import { ioc, PrefsStore, SetSetting } from '@journeyapps/reactor-mod';

export enum SchemaModelOrderValue {
  ALPHABETICAL = 'alphabetical',
  AS_DEFINED_IN_SCHEMA = 'as_defined_in_schema'
}

export class SchemaModelOrderingPreference extends SetSetting {
  static KEY = 'databrowser/schema/model-order';

  constructor() {
    super({
      key: SchemaModelOrderingPreference.KEY,
      name: 'Schema model order',
      category: 'Schema',
      value: SchemaModelOrderValue.AS_DEFINED_IN_SCHEMA,
      options: [
        {
          key: SchemaModelOrderValue.AS_DEFINED_IN_SCHEMA,
          label: 'As defined in schema'
        },
        {
          key: SchemaModelOrderValue.ALPHABETICAL,
          label: 'Alphabetical'
        }
      ]
    });
  }

  static getValue(): SchemaModelOrderValue {
    return ioc.get(PrefsStore).getPreference<SchemaModelOrderingPreference>(SchemaModelOrderingPreference.KEY)
      .value as SchemaModelOrderValue;
  }
}

export enum SchemaFieldOrderValue {
  ALPHABETICAL = 'alphabetical',
  BELONGS_TO_FIRST = 'belongs_to_first',
  BELONGS_TO_LAST = 'belongs_to_last',
  AS_DEFINED_IN_SCHEMA = 'as_defined_in_schema'
}

export class SchemaFieldOrderingPreference extends SetSetting {
  static KEY = 'databrowser/schema/field-order';

  constructor() {
    super({
      key: SchemaFieldOrderingPreference.KEY,
      name: 'Schema field order',
      category: 'Schema',
      value: SchemaFieldOrderValue.AS_DEFINED_IN_SCHEMA,
      options: [
        {
          key: SchemaFieldOrderValue.AS_DEFINED_IN_SCHEMA,
          label: 'As defined in schema'
        },
        {
          key: SchemaFieldOrderValue.ALPHABETICAL,
          label: 'Alphabetical'
        },
        {
          key: SchemaFieldOrderValue.BELONGS_TO_FIRST,
          label: 'Belongs-to first'
        },
        {
          key: SchemaFieldOrderValue.BELONGS_TO_LAST,
          label: 'Belongs-to last'
        }
      ]
    });
  }

  static getValue(): SchemaFieldOrderValue {
    return ioc.get(PrefsStore).getPreference<SchemaFieldOrderingPreference>(SchemaFieldOrderingPreference.KEY)
      .value as SchemaFieldOrderValue;
  }
}

export const registerSchemaOrderingPreferences = (prefsStore: PrefsStore) => {
  prefsStore.registerPreference(new SchemaModelOrderingPreference());
  prefsStore.registerPreference(new SchemaFieldOrderingPreference());
};
