import * as React from 'react';
import {
  ComboBoxItem,
  ComboBoxStore2,
  InputContainerWidget,
  ioc,
  PanelButtonWidget,
  SimpleComboBoxDirective,
  styled
} from '@journeyapps/reactor-mod';
import { SimpleQuery, SimpleQuerySort } from '../../../core/query/query-simple/SimpleQuery';
import { SortChipWidget } from './SortChipWidget';

export interface SortControlsWidgetProps {
  simpleQuery: SimpleQuery;
  goToPage?: (index: number) => any;
}

export const SortControlsWidget: React.FC<SortControlsWidgetProps> = (props) => {
  const showAddSortMenu = async (event: React.MouseEvent<any>) => {
    const used = new Set(props.simpleQuery.sortState.sorts.map((sort) => sort.field));
    const fields = props.simpleQuery.sortState.getSortableFields().filter((field) => !used.has(field.key));
    if (fields.length === 0) {
      return;
    }
    const directive = await ioc.get(ComboBoxStore2).show(
      new SimpleComboBoxDirective({
        title: 'Add sort',
        event: event as any,
        items: fields.map((field) => {
          return {
            key: field.key,
            title: field.label,
            action: async () => {
              props.simpleQuery.sortState.addSort(SimpleQuerySort.create(field.key));
              props.goToPage?.(0);
            }
          } as ComboBoxItem;
        })
      })
    );
    directive.getSelectedItem();
  };

  const getSortLabel = (field: string) => {
    const resolved = props.simpleQuery.sortState.getSortableFields().find((entry) => entry.key === field);
    return resolved?.label || field;
  };

  return (
    <InputContainerWidget label="Sort">
      <S.Group>
        <PanelButtonWidget
          icon="plus"
          tooltip="Add sort"
          action={async (event) => {
            await showAddSortMenu(event as any);
          }}
        />
        {props.simpleQuery.sortState.sorts.map((sort) => {
          return (
            <SortChipWidget
              key={sort.field}
              sort={sort}
              label={getSortLabel(sort.field)}
              onToggle={async () => {
                sort.toggle();
                props.goToPage?.(0);
              }}
              onRemove={async () => {
                sort.remove();
                props.goToPage?.(0);
              }}
              onDropBefore={async (sourceField) => {
                props.simpleQuery.sortState.moveSortBefore(sourceField, sort.field);
                props.goToPage?.(0);
              }}
            />
          );
        })}
      </S.Group>
    </InputContainerWidget>
  );
};

namespace S {
  export const Group = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    column-gap: 5px;
    row-gap: 5px;
    flex-wrap: wrap;
  `;
}
