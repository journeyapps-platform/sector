import * as React from 'react';
import { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import styled from '@emotion/styled';
import {
  BorderLayoutWidget,
  Btn,
  ioc,
  LoadingPanelWidget,
  PANEL_CONTENT_PADDING,
  PanelButtonWidget,
  PanelToolbarWidget,
  ScrollableDivCss,
  theme,
  ThemeStore
} from '@journeyapps/reactor-mod';
import { SchemaModelForm } from '../../forms/SchemaModelForm';
import { ModelPanelModel } from './ModelPanelFactory';
import { DeleteSchemaModelAction } from '../../actions/schema-model/DeleteSchemaModelAction';

export interface QueryPanelWidgetProps {
  model: ModelPanelModel;
}

namespace S {
  export const Container = styled.div`
    overflow: auto;
    padding: ${PANEL_CONTENT_PADDING}px;
    ${ScrollableDivCss};
  `;

  export const Buttons = styled.div`
    display: flex;
    align-items: center;
    column-gap: 5px;
    padding: 5px;
  `;
}

export const ModelPanelWidget: React.FC<QueryPanelWidgetProps> = observer((props) => {
  const [form, setForm] = useState<SchemaModelForm>(null);
  const _theme = ioc.get(ThemeStore).getCurrentTheme(theme);

  useEffect(() => {
    if (!props.model.definition || !props.model.model) {
      return;
    }
    let _form = new SchemaModelForm({
      object: props.model.model,
      definition: props.model.definition
    });
    setForm(_form);
    return () => {
      _form.dispose();
    };
  }, [props.model.model, props.model.definition]);

  let top = null;
  if (props.model.model) {
    const toolbarButtons: Btn[] = props.model.model.model?.persisted
      ? [
          DeleteSchemaModelAction.get().representAsButton({
            targetEntity: props.model.model,
            sourcePanel: props.model
          })
        ].filter((button): button is Btn => !!button)
      : [];

    top = (
      <PanelToolbarWidget
        btns={toolbarButtons}
        meta={[
          {
            label: 'ID',
            value: props.model?.id
          }
        ]}
      />
    );
  }

  return (
    <LoadingPanelWidget loading={!form}>
      {() => {
        return (
          <BorderLayoutWidget
            top={top}
            bottom={
              <S.Buttons>
                <PanelButtonWidget
                  disabled={props.model.model.patch.size === 0}
                  label="Save"
                  icon="save"
                  iconColor={_theme.status.success}
                  action={async () => {
                    await props.model.model.save();
                  }}
                />
                <PanelButtonWidget
                  disabled={props.model.model.patch.size === 0}
                  label="Discard edits"
                  icon="arrow-rotate-back"
                  action={() => {
                    props.model.model.clearEdits();
                  }}
                />
              </S.Buttons>
            }
          >
            <S.Container>{form.render()}</S.Container>
          </BorderLayoutWidget>
        );
      }}
    </LoadingPanelWidget>
  );
});
