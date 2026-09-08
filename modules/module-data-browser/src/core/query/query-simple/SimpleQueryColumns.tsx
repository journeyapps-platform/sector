import * as React from 'react';
import { ioc, TableColumn } from '@journeyapps/reactor-mod';
import * as _ from 'lodash';
import { PageRow } from '../Page';
import { CellDisplayWidget } from '../widgets/CellDisplayWidget';
import { SmartColumnWidget } from '../widgets/SmartColumnWidget';
import { SmartCellDisplayWidget } from '../widgets/SmartCellDisplayWidget';
import { SmartBelongsToDisplayWidget } from '../widgets/SmartBelongsToDisplayWidget';
import { ColumnDisplayWidget } from '../widgets/ColumnDisplayWidget';
import { IDCellDisplayWidget } from '../widgets/IDCellDisplayWidget';
import { SchemaModelDefinition } from '../../SchemaModelDefinition';
import { AbstractConnection } from '../../AbstractConnection';
import { SimpleQuerySort, SortDirection } from './SimpleQueryTypes';
import { SimpleQuerySortState } from './SimpleQuerySortState';
import { SimpleQueryFilterState } from './SimpleQueryFilterState';
import { STANDARD_MODEL_FIELD_LABELS, StandardModelFields, idVariable } from '../StandardModelFields';
import { TypeEngine } from '../../../forms/TypeEngine';
import { setupBelongsToFilter } from '../../../forms/types/belongs-to-filter';
import { Condition, SimpleFilter, Statement } from '../filters';
import { OrderedSchemaFieldType } from '../../SchemaModelDefinition';

export interface BuildSimpleQueryColumnsOptions {
  definition: SchemaModelDefinition;
  connection: AbstractConnection;
  sortState: SimpleQuerySortState;
  filterState: SimpleQueryFilterState;
}

export const buildSimpleQueryColumns = (options: BuildSimpleQueryColumnsOptions): TableColumn[] => {
  const getSortLabel = (field: string, label: string) => {
    const direction = options.sortState.getSort(field)?.direction;
    if (!direction) {
      return label;
    }
    return `${label} ${direction === SortDirection.ASC ? '↓' : '↑'}`;
  };

  return [
    {
      key: StandardModelFields.ID,
      display: (
        <SmartColumnWidget
          variable={idVariable}
          typeLabel={ioc.get(TypeEngine).getHandler(idVariable.type)?.getTypeLabel?.(idVariable.type)}
          filter={options.filterState.getFilter(StandardModelFields.ID)}
          filterChanged={async (filter) => {
            if (!filter) {
              options.filterState.getFilter(StandardModelFields.ID)?.delete();
              return;
            }
            options.filterState.setFilter(StandardModelFields.ID, filter);
          }}
        />
      ),
      noWrap: true,
      shrink: true,
      accessor: (cell, row: PageRow) => {
        return <IDCellDisplayWidget id={row.model.id} />;
      }
    },
    {
      key: StandardModelFields.UPDATED_AT,
      display: (
        <ColumnDisplayWidget
          label={getSortLabel(
            StandardModelFields.UPDATED_AT,
            STANDARD_MODEL_FIELD_LABELS[StandardModelFields.UPDATED_AT]
          )}
          onClick={async () => {
            const sort = options.sortState.getSort(StandardModelFields.UPDATED_AT);
            if (!sort) {
              options.sortState.addSort(SimpleQuerySort.create(StandardModelFields.UPDATED_AT));
              return;
            }
            sort.toggle();
          }}
        />
      ),
      noWrap: true,
      shrink: true,
      accessor: (cell, row: PageRow) => {
        return <CellDisplayWidget name={StandardModelFields.UPDATED_AT} cell={row.model.updated_at} row={row} />;
      }
    },
    ...options.definition.getOrderedFieldsAndRelationships().flatMap((entry) => {
      if (entry.type === OrderedSchemaFieldType.BELONGS_TO) {
        const variable = entry.variable;
        const relationship = entry.object;
        return [
          {
            key: variable.name,
            display: (
              <SmartColumnWidget
                variable={options.definition.definition.belongsToVars[variable.relationship]}
                typeLabel={`Belongs To: ${relationship.foreignType.label}`}
                filter={options.filterState.getFilter(variable.name)}
                setupFilter={async ({ filter }) => {
                  return await setupBelongsToFilter({
                    definition: options.definition,
                    relationship,
                    variable,
                    filter
                  });
                }}
                filterChanged={async (filter) => {
                  if (!filter) {
                    options.filterState.getFilter(variable.name)?.delete();
                    return;
                  }
                  options.filterState.setFilter(variable.name, filter);
                }}
              />
            ),
            noWrap: true,
            accessor: (cell, row: PageRow) => {
              return (
                <SmartBelongsToDisplayWidget
                  variable_id={variable}
                  row={row}
                  connection={options.connection}
                  filterBelongsTo={async (object) => {
                    options.filterState.setFilter(
                      variable.name,
                      new SimpleFilter(variable, [new Statement(Condition.EQUALS, object.id)])
                    );
                  }}
                />
              );
            }
          } as TableColumn
        ];
      }

      const attribute = entry.object;
      return [
        {
          key: attribute.name,
          display: (
            <SmartColumnWidget
              variable={attribute}
              typeLabel={ioc.get(TypeEngine).getHandler(attribute.type)?.getTypeLabel?.(attribute.type)}
              filter={options.filterState.getFilter(attribute.name)}
              sortDirection={options.sortState.getSort(attribute.name)?.direction}
              onToggleSort={async () => {
                const sort = options.sortState.getSort(attribute.name);
                if (!sort) {
                  options.sortState.addSort(SimpleQuerySort.create(attribute.name));
                  return;
                }
                sort.toggle();
              }}
              filterChanged={async (filter) => {
                if (!filter) {
                  options.filterState.getFilter(attribute.name)?.delete();
                  return;
                }
                options.filterState.setFilter(attribute.name, filter);
              }}
            />
          ),
          noWrap: true,
          accessor: (cell, row: PageRow) => {
            return <SmartCellDisplayWidget name={attribute.name} row={row} />;
          }
        } as TableColumn
      ];
    })
  ];
};
