import { EntityDefinition, inject, InlineEntityEncoderComponent } from '@journeyapps/reactor-mod';
import { DataBrowserEntities } from '../entities';
import { ConnectionStore } from '../stores/ConnectionStore';
import { SimpleQuery } from '../core/query/query-simple/SimpleQuery';
import { AbstractQueryEncoded, AbstractSerializableQuery } from '../core/query/AbstractSerializableQuery';

export class QueryEntityDefinition extends EntityDefinition<AbstractSerializableQuery> {
  @inject(ConnectionStore)
  accessor connectionStore: ConnectionStore;

  constructor() {
    super({
      type: DataBrowserEntities.QUERY,
      category: 'DataBrowser',
      label: 'Query',
      icon: 'search',
      iconColor: 'red'
    });

    this.registerComponent(
      new InlineEntityEncoderComponent<AbstractSerializableQuery, AbstractQueryEncoded>({
        version: 1,
        encode: (e) => {
          return e.serialize();
        },
        decode: async (entity) => {
          if (entity.type === 'simple') {
            let query = new SimpleQuery();
            await query.deserialize(this.connectionStore, entity as any);
            return query;
          }
        }
      })
    );
  }

  matchEntity(t: any): boolean {
    if (t instanceof AbstractSerializableQuery) {
      return true;
    }
  }

  getEntityUID(t: AbstractSerializableQuery) {
    return t.id;
  }
}
