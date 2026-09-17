import * as React from 'react';
import { useEffect, useRef } from 'react';
import { Page, PageRow } from '../../core/query/Page';
import {
  ComboBoxItem,
  ioc,
  LoadingPanelWidget,
  MultiSelectChangeEvent,
  MultiSelectTableWidget,
  ScrollableDivCss,
  System,
  themed
} from '@journeyapps/reactor-mod';
import { AbstractQuery } from '../../core/query/AbstractQuery';
import { observer } from 'mobx-react';
import { DataBrowserEntities } from '../../entities';
import { SchemaModelObject } from '../../core/SchemaModelObject';
import { deleteSchemaModels } from '../../core/delete-schema-models';

export interface PageResultsWidgetProps {
  page: Page;
  query: AbstractQuery;
  selectedModels: SchemaModelObject[];
  onSelectionChange: (event: MultiSelectChangeEvent<PageRow>) => void;
  scrollTop: number;
  scrollLeft: number;
  className?: any;
  onScroll: (offsets: { top: number; left: number }) => void;
}

export const PageResultsWidget: React.FC<PageResultsWidgetProps> = observer((props) => {
  const system = ioc.get(System);
  const rows = props.page.loading ? [] : props.page.asRows();
  const selectedRowKeys = props.selectedModels.map((model) => model.id);
  const ref = useRef<HTMLDivElement>(null);

  const showContextMenu = (event: React.MouseEvent, row: PageRow) => {
    const definition = system.getDefinition<SchemaModelObject>(DataBrowserEntities.SCHEMA_MODEL_OBJECT);
    const isSelectedRow = props.selectedModels.some((model) => model.id === row.model.id);

    const selectedItems: ComboBoxItem[] =
      isSelectedRow && props.selectedModels.length > 1
        ? [
            {
              key: 'delete-selected',
              title: `Delete selected [${props.selectedModels.length}]`,
              group: 'Selected',
              icon: 'trash',
              action: async () => {
                await deleteSchemaModels({
                  models: props.selectedModels
                });
              }
            }
          ]
        : [];

    definition.showContextMenuForEntity(row.model, event, {
      additionalItems: selectedItems
    } as any);
  };

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    if (ref.current.scrollTop !== props.scrollTop) {
      ref.current.scrollTop = props.scrollTop;
    }
    if (ref.current.scrollLeft !== props.scrollLeft) {
      ref.current.scrollLeft = props.scrollLeft;
    }
  }, [props.scrollLeft, props.scrollTop]);

  return (
    <LoadingPanelWidget loading={props.page.loading}>
      {() => (
        <S.Container
          className={props.className}
          ref={ref}
          onScroll={(event) => {
            const target = event.currentTarget;
            props.onScroll({
              top: target.scrollTop,
              left: target.scrollLeft
            });
          }}
        >
          <MultiSelectTableWidget
            onContextMenu={showContextMenu}
            selectedRowKeys={selectedRowKeys}
            onSelectionChange={props.onSelectionChange}
            rows={rows}
            columns={props.query.getColumns()}
          />
        </S.Container>
      )}
    </LoadingPanelWidget>
  );
});

namespace S {
  export const Container = themed.div`
    position: relative;
    overflow: auto;
    height: 100%;
    ${ScrollableDivCss};
  `;

  export const RowsLoading = themed.div`
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 180px;
  `;
}
