import * as React from 'react';
import {
  InputContainerWidget,
  ioc,
  PanelButtonMode,
  PanelButtonWidget,
  theme,
  ThemeStore
} from '@journeyapps/reactor-mod';

export interface SelectionControlsWidgetProps {
  selectedCount: number;
  onDeleteSelected: () => Promise<void>;
}

export const SelectionControlsWidget: React.FC<SelectionControlsWidgetProps> = (props) => {
  const _theme = ioc.get(ThemeStore).getCurrentTheme(theme);

  if (props.selectedCount === 0) {
    return null;
  }

  return (
    <InputContainerWidget label="Selection">
      <PanelButtonWidget
        mode={PanelButtonMode.PRIMARY}
        label={`Delete selected [${props.selectedCount}]`}
        icon="trash"
        iconColor={_theme.status.failed}
        action={props.onDeleteSelected}
      />
    </InputContainerWidget>
  );
};
