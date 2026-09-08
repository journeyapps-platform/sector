import * as React from 'react';
import {
  ComboBoxItem,
  ComboBoxStore2,
  InputContainerWidget,
  PanelButtonMode,
  PanelButtonWidget,
  SimpleComboBoxDirective,
  ioc,
  styled
} from '@journeyapps/reactor-mod';
import { SimpleQuery } from '../../../core/query/query-simple/SimpleQuery';
import { SmartFilterMetadataWidget } from '../../../core/query/widgets/SmartFilterWidget';

export interface FilterControlsWidgetProps {
  simpleQuery: SimpleQuery;
  goToPage?: (index: number) => any;
}

export const FilterControlsWidget: React.FC<FilterControlsWidgetProps> = (props) => {
  const showAddFilterMenu = async (event: React.MouseEvent<any>) => {
    const fields = props.simpleQuery.filterState.getFilterableFields();
    if (fields.length === 0) {
      return;
    }
    const directive = await ioc.get(ComboBoxStore2).show(
      new SimpleComboBoxDirective({
        title: 'Add filter',
        event: event as any,
        items: fields.map((field) => {
          return {
            key: field.key,
            title: field.label,
            group: field.group,
            action: async () => {
              await props.simpleQuery.filterState.setupFilterForField(field.key, event.nativeEvent as any);
              props.goToPage?.(0);
            }
          } as ComboBoxItem;
        })
      })
    );
    directive.getSelectedItem();
  };

  const filters = props.simpleQuery.filterState.getActiveFilters();

  return (
    <InputContainerWidget label="Filters">
      <S.Group>
        <PanelButtonWidget
          icon="plus"
          tooltip="Add filter"
          action={async (event) => {
            await showAddFilterMenu(event as any);
          }}
        />
        {filters.map((entry) => {
          const key = entry.variable.name;
          const label = entry.variable.label || entry.variable.name;
          return (
            <S.FilterItem
              key={key}
              onContextMenu={async (event) => {
                event.preventDefault();
                event.stopPropagation();
                const directive = await ioc.get(ComboBoxStore2).show(
                  new SimpleComboBoxDirective({
                    title: label,
                    event: event as any,
                    items: [
                      {
                        key: 'edit',
                        title: 'Edit filter',
                        icon: 'pencil',
                        action: async () => {
                          await props.simpleQuery.filterState.setupFilterForField(key, event.nativeEvent as any);
                          props.goToPage?.(0);
                        }
                      },
                      {
                        key: 'clear',
                        title: 'Clear filter',
                        icon: 'trash',
                        action: async () => {
                          entry.filter.delete();
                          props.goToPage?.(0);
                        }
                      }
                    ]
                  })
                );
                directive.getSelectedItem();
              }}
            >
              <S.FilterLabel>{label}</S.FilterLabel>
              <SmartFilterMetadataWidget filter={entry.filter} variable={entry.filter.variable} />
              <S.CloseButton
                mode={PanelButtonMode.LINK}
                icon="close"
                tooltip={`Clear ${label} filter`}
                action={async () => {
                  entry.filter.delete();
                  props.goToPage?.(0);
                }}
              />
            </S.FilterItem>
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

  export const FilterItem = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    border-radius: 4px;
    padding: 1px 3px;

    &:hover {
      background: ${(p) => p.theme.forms.groupBorder};
    }
  `;

  export const CloseButton = styled(PanelButtonWidget)`
    padding: 2px;
  `;

  export const FilterLabel = styled.div`
    font-size: 12px;
    color: ${(p) => p.theme.text.secondary};
    padding-right: 4px;
  `;
}
