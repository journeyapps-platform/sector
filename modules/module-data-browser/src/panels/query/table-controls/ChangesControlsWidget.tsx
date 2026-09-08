import * as React from 'react';
import {
  InputContainerWidget,
  ioc,
  PanelButtonWidget,
  styled,
  theme,
  ThemeStore,
  WorkspaceStore
} from '@journeyapps/reactor-mod';
import { AbstractQuery } from '../../../core/query/AbstractQuery';
import { Page } from '../../../core/query/Page';
import { ChangedModelQuery } from '../../../core/query/query-changed/ChangedModelQuery';
import { SimpleQuery } from '../../../core/query/query-simple/SimpleQuery';
import { QueryPanelModel } from '../QueryPanelFactory';
import { observer } from 'mobx-react';

export interface ChangesControlsWidgetProps {
  query: AbstractQuery;
  currentPage: Page;
}

export const ChangesControlsWidget: React.FC<ChangesControlsWidgetProps> = observer((props) => {
  const _theme = ioc.get(ThemeStore).getCurrentTheme(theme);
  const dirtyObjects = props.query.getDirtyObjects();

  if (dirtyObjects.length === 0) {
    return null;
  }

  return (
    <InputContainerWidget label="Changes">
      <S.Group>
        <PanelButtonWidget
          label={`Save all [${dirtyObjects.length}]`}
          icon="save"
          iconColor={_theme.status.success}
          action={async () => {
            await props.query.batchSave();
          }}
        />
        <PanelButtonWidget
          tooltip="Discard all edits"
          icon="arrow-rotate-back"
          action={() => {
            props.currentPage.reset();
          }}
        />
        {props.query instanceof SimpleQuery ? (
          <PanelButtonWidget
            tooltip="View changed models"
            icon="eye"
            action={() => {
              ioc.get(WorkspaceStore).addModel(new QueryPanelModel(new ChangedModelQuery(props.query as SimpleQuery)));
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
