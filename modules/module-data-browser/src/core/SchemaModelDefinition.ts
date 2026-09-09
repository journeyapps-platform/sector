import { AbstractConnection } from './AbstractConnection';
import { ObjectType } from '@journeyapps/parser-schema';
import { Collection, JourneyAPIAdapter, Query, Variable } from '@journeyapps/db';
import * as _ from 'lodash';
import { SchemaModelObject } from './SchemaModelObject';
import { LifecycleModel } from '@journeyapps/reactor-lib-data-layer';
import { BaseObserver } from '@journeyapps/common-utils';
import { queue, QueueObject } from 'async';
import { observable } from 'mobx';
import { IndexModel } from './IndexModel';
import { TypeEngine } from '../forms/TypeEngine';
import { idVariable, STANDARD_MODEL_FIELD_LABELS, StandardModelFields } from './query/StandardModelFields';
import { SchemaFieldOrderingPreference, SchemaFieldOrderValue } from '../preferences/SchemaOrderingPreferences';

export interface SchemaModelDefinitionListener {
  resolved: (event: { object: SchemaModelObject }) => any;
  failed: (event: { object_id: string }) => any;
}

export interface SchemaModelDefinitionOptions {
  connection: AbstractConnection;
  definition: ObjectType;
}

export interface FilterableField {
  key: string;
  label: string;
  group: 'Fields' | 'Belongs to';
}

export enum OrderedSchemaFieldType {
  FIELD = 'FIELD',
  BELONGS_TO = 'BELONGS_TO'
}

export type OrderedSchemaFieldOrRelationship =
  | {
      type: OrderedSchemaFieldType.FIELD;
      object: Variable;
      key: string;
      label: string;
    }
  | {
      type: OrderedSchemaFieldType.BELONGS_TO;
      object: ObjectType['belongsTo'][string];
      key: string;
      label: string;
      variable: Variable;
    };

export class SchemaModelDefinition
  extends BaseObserver<SchemaModelDefinitionListener>
  implements LifecycleModel<ObjectType>
{
  cache: Map<string, SchemaModelObject>;
  queue: QueueObject<string>;
  enqueued: Set<string>;

  @observable
  accessor indexes: IndexModel[];

  constructor(protected options: SchemaModelDefinitionOptions) {
    super();
    this.cache = new Map<string, SchemaModelObject>();
    this.enqueued = new Set<string>();
    this.indexes = [];
    this.queue = queue(async (id) => {
      let collection = await this.getCollection();
      try {
        let models = await this.executeQuery(collection.where(`id = ?`, id).limit(1));
        if (models[0]) {
          this.cache.set(id, models[0]);
          this.enqueued.delete(id);
          this.iterateListeners((cb) => cb.resolved?.({ object: models[0] }));
        } else {
          this.enqueued.delete(id);
          this.iterateListeners((cb) => cb.failed?.({ object_id: id }));
        }
      } catch (ex) {
        this.enqueued.delete(id);
        this.iterateListeners((cb) => cb.failed?.({ object_id: id }));
        throw ex;
      }
    }, 6);
  }

  async loadIndexes() {
    let indexes = await this.connection.getIndexes();
    this.indexes = (indexes[this.definition.name]?.indexes || []).map(
      (i) => new IndexModel({ definition: this, index: i })
    );
  }

  async init() {
    await this.loadIndexes();
  }

  async search(text: string): Promise<SchemaModelObject[]> {
    let collection = await this.getCollection();
    let adapter = collection.adapter as JourneyAPIAdapter;
    // @ts-ignore
    let res = await adapter.apiPost(`${adapter.credentials.api4Url()}objects/${this.definition.name}/search.json`, {
      query: text
    });
    return res.objects
      .map((o) => {
        return JourneyAPIAdapter.apiToInternalFormat(this.definition, o);
      })
      .map((o) => {
        return new SchemaModelObject({
          definition: this,
          model: o,
          adapter: collection.adapter
        });
      });
  }

  async load(id: string) {
    if (!this.enqueued.has(id)) {
      this.enqueued.add(id);
      this.queue.push(id);
    }

    return await new Promise<SchemaModelObject>((resolve) => {
      let l1 = this.registerListener({
        resolved: ({ object }) => {
          if (object.model.id === id) {
            l1();
            resolve(object);
          }
        },
        failed: ({ object_id }) => {
          if (object_id === id) {
            l1();
            resolve(null);
          }
        }
      });
    });
  }

  async resolve(id: string): Promise<SchemaModelObject | null> {
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }
    return this.load(id);
  }

  get key() {
    return this.definition.name;
  }

  dispose() {
    this.queue.kill();
  }

  patch(data: ObjectType) {
    this.options.definition = data;
  }

  get connection() {
    return this.options.connection;
  }

  get definition() {
    return this.options.definition;
  }

  async executeQuery(query: Query) {
    let collection = await this.getCollection();
    let results = await collection.adapter.executeQuery(query);
    return results.map((m) => {
      if (!this.cache.has(m.id)) {
        const model = new SchemaModelObject({
          definition: this,
          model: m,
          adapter: collection.adapter
        });
        this.cache.set(m.id, model);
        return model;
      }

      let model = this.cache.get(m.id);
      model.setData(m);
      return model;
    });
  }

  async getCollection() {
    const conn = await this.connection.getConnection();
    return conn[this.definition.name] as Collection;
  }

  async generateNewModelObject(): Promise<SchemaModelObject> {
    const collection = await this.getCollection();
    return new SchemaModelObject({
      definition: this,
      adapter: collection.adapter
    });
  }

  getBelongsToIdVariableForRelationship(relationshipName: string): Variable | undefined {
    const variable = _.find(_.values(this.definition.belongsToIdVars), (entry) => {
      return entry.relationship === relationshipName;
    });

    if (!variable) {
      return undefined;
    }

    const relationship = this.definition.belongsTo[relationshipName];
    if (relationship) {
      variable.label = relationship.name;
    }

    return variable;
  }

  getBelongsToRelationshipForField(field: string):
    | {
        variable: Variable;
        relationship: ObjectType['belongsTo'][string];
      }
    | undefined {
    const variable = _.find(_.values(this.definition.belongsToIdVars), (entry) => {
      return entry.name === field;
    });
    if (!variable?.relationship) {
      return undefined;
    }

    const relationship = this.definition.belongsTo[variable.relationship];
    if (!relationship) {
      return undefined;
    }

    variable.label = relationship.name;
    return {
      variable,
      relationship
    };
  }

  private getSchemaOrderedFields(): Variable[] {
    return Object.keys(this.definition.attributes).map((key) => this.definition.attributes[key]);
  }

  private getSchemaOrderedBelongsToFields(): OrderedSchemaFieldOrRelationship[] {
    return Object.keys(this.definition.belongsTo)
      .map((relationshipName) => {
        const relationship = this.definition.belongsTo[relationshipName];
        const variable = this.getBelongsToIdVariableForRelationship(relationshipName);
        if (!relationship || !variable) {
          return null;
        }
        return {
          type: OrderedSchemaFieldType.BELONGS_TO,
          object: relationship,
          key: variable.name,
          label: relationship.name || variable.label || variable.name,
          variable
        } as OrderedSchemaFieldOrRelationship;
      })
      .filter((value): value is OrderedSchemaFieldOrRelationship => !!value);
  }

  private getAlphabeticalOrderedFields(): OrderedSchemaFieldOrRelationship[] {
    return _.sortBy(
      this.getSchemaOrderedFields().map((attribute) => {
        return {
          type: OrderedSchemaFieldType.FIELD,
          object: attribute,
          key: attribute.name,
          label: attribute.label || attribute.name
        } as OrderedSchemaFieldOrRelationship;
      }),
      (item) => item.label.toLowerCase()
    );
  }

  getOrderedFieldsAndRelationships(): OrderedSchemaFieldOrRelationship[] {
    const orderedFields = this.getAlphabeticalOrderedFields();
    const orderedBelongsTo = _.sortBy(this.getSchemaOrderedBelongsToFields(), (item) => item.label.toLowerCase());

    switch (SchemaFieldOrderingPreference.getValue()) {
      case SchemaFieldOrderValue.ALPHABETICAL:
        return _.sortBy([...orderedFields, ...orderedBelongsTo], (item) => item.label.toLowerCase());
      case SchemaFieldOrderValue.BELONGS_TO_FIRST:
        return [...orderedBelongsTo, ...orderedFields];
      case SchemaFieldOrderValue.BELONGS_TO_LAST:
        return [...orderedFields, ...orderedBelongsTo];
      case SchemaFieldOrderValue.AS_DEFINED_IN_SCHEMA:
      default:
        return [
          ...this.getSchemaOrderedFields().map((attribute) => {
            return {
              type: OrderedSchemaFieldType.FIELD,
              object: attribute,
              key: attribute.name,
              label: attribute.label || attribute.name
            } as OrderedSchemaFieldOrRelationship;
          }),
          ...this.getSchemaOrderedBelongsToFields()
        ];
    }
  }

  getFilterableFields(typeEngine: TypeEngine): FilterableField[] {
    return [
      ...(typeEngine.getHandler(idVariable.type)?.setupFilter
        ? [
            {
              key: StandardModelFields.ID,
              label: STANDARD_MODEL_FIELD_LABELS[StandardModelFields.ID],
              group: 'Fields' as const
            }
          ]
        : []),
      ...this.getOrderedFieldsAndRelationships()
        .map((entry) => {
          if (entry.type === OrderedSchemaFieldType.BELONGS_TO) {
            return {
              key: entry.key,
              label: entry.label,
              group: 'Belongs to' as const
            };
          }

          const handler = typeEngine.getHandler(entry.object.type);
          if (!handler?.setupFilter) {
            return null;
          }
          return {
            key: entry.key,
            label: entry.label,
            group: 'Fields' as const
          };
        })
        .filter((value) => !!value)
    ];
  }
}
