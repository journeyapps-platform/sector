import * as React from 'react';
import {
  ComboBoxItem,
  ComboBoxStore2,
  DialogStore,
  InputContainerWidget,
  ioc,
  PanelButtonWidget,
  SimpleComboBoxDirective,
  styled
} from '@journeyapps/reactor-mod';
import { SavedQueryStore } from '../../../stores/SavedQueryStore';
import { SimpleQuery } from '../../../core/query/query-simple/SimpleQuery';
import { observer } from 'mobx-react';

export interface QueryControlsWidgetProps {
  query: { load: () => Promise<any> | any };
  simpleQuery: SimpleQuery | null;
  activeSavedQueryName?: string | null;
  onLoadSavedQuery?: (id: string) => Promise<any> | any;
}

export const QueryControlsWidget: React.FC<QueryControlsWidgetProps> = observer((props) => {
  const savedQueryStore = ioc.get(SavedQueryStore);
  const savedQueries = props.simpleQuery ? savedQueryStore.getSavedForQuery(props.simpleQuery) : [];

  const showSavedQueryMenu = async (event: React.MouseEvent<any>) => {
    if (!props.simpleQuery) {
      return;
    }

    const queryChildren: ComboBoxItem[] =
      savedQueries.length > 0
        ? savedQueries.map((saved) => {
            return {
              title: saved.name,
              key: `query-${saved.id}`,
              icon: 'search',
              action: async () => {
                await props.onLoadSavedQuery?.(saved.id);
              }
            } as ComboBoxItem;
          })
        : ([{ title: 'No saved queries', key: 'no-queries', disabled: true }] as ComboBoxItem[]);

    const deleteChildren: ComboBoxItem[] =
      savedQueries.length > 0
        ? savedQueries.map((saved) => {
            return {
              title: saved.name,
              key: `delete-${saved.id}`,
              icon: 'trash',
              action: async () => {
                await savedQueryStore.removeSavedQuery(saved.id);
              }
            } as ComboBoxItem;
          })
        : ([{ title: 'No saved queries', key: 'no-delete-queries', disabled: true }] as ComboBoxItem[]);

    const directive = await ioc.get(ComboBoxStore2).show(
      new SimpleComboBoxDirective({
        title: 'Saved queries',
        event: event as any,
        items: [
          {
            title: 'Save query',
            key: 'save-query',
            icon: 'bookmark',
            action: async () => {
              const suggestedName = `${props.simpleQuery.options.definition.definition.label} query`;
              const name = await ioc.get(DialogStore).showInputDialog({
                title: 'Save query',
                initialValue: suggestedName
              });
              if (!name) {
                return;
              }
              await savedQueryStore.saveQuery(name, props.simpleQuery);
            }
          },
          { title: 'Queries', key: 'queries', icon: 'list', children: queryChildren },
          { title: 'Delete query', key: 'delete-query', icon: 'trash', children: deleteChildren }
        ]
      })
    );
    directive.getSelectedItem();
  };

  return (
    <InputContainerWidget label="Query">
      <S.Group>
        <PanelButtonWidget
          tooltip="Reload query"
          icon="refresh"
          action={async () => {
            await props.query.load();
          }}
        />
        {props.simpleQuery ? (
          <PanelButtonWidget
            tooltip={
              props.activeSavedQueryName
                ? `Saved query active: ${props.activeSavedQueryName}`
                : 'Unsaved or modified query'
            }
            icon="bookmark"
            highlight={!!props.activeSavedQueryName}
            action={async (event) => {
              await showSavedQueryMenu(event as any);
            }}
          />
        ) : null}
      </S.Group>
    </InputContainerWidget>
  );
});

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
