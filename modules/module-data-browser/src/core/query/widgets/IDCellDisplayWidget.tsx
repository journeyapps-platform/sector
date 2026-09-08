import * as React from 'react';
import { observer } from 'mobx-react';
import {
  BooleanSetting,
  NotificationStore,
  NotificationType,
  PrefsStore,
  TableButtonWidget,
  ioc,
  styled
} from '@journeyapps/reactor-mod';
import { copyTextToClipboard } from '@journeyapps/reactor-lib-utils';
import { QueryControlPreferences } from '../../../preferences/QueryControlPreferences';

export interface IDCellDisplayWidgetProps {
  id: string;
}

export const IDCellDisplayWidget: React.FC<IDCellDisplayWidgetProps> = observer((props) => {
  const notifications = ioc.get(NotificationStore);
  const showIdValue = ioc
    .get(PrefsStore)
    .getPreference<BooleanSetting>(QueryControlPreferences.SHOW_ID_VALUE_IN_ID_COLUMN).checked;

  return (
    <S.Container>
      {showIdValue ? <S.Value>{props.id}</S.Value> : null}
      <TableButtonWidget
        icon="copy"
        tooltip="Copy ID"
        action={() => {
          copyTextToClipboard(props.id);
          notifications.showNotification({
            title: 'Copied',
            description: 'ID copied to clipboard',
            type: NotificationType.SUCCESS
          });
        }}
      />
    </S.Container>
  );
});

namespace S {
  export const Container = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    column-gap: 5px;
    width: 100%;
  `;

  export const Value = styled.div`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `;
}
