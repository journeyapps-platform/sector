import * as React from 'react';
import { JSX, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import styled from '@emotion/styled';
import { BorderLayoutWidget, LoadingPanelWidget, PanelToolbarWidget } from '@journeyapps/reactor-mod';
import { copyTextToClipboard, saveFile } from '@journeyapps/reactor-lib-utils';
import { ModelJsonPanelModel } from './ModelJsonPanelFactory';
import { SimpleEditorWidget } from '@journeyapps/reactor-mod-editor';

export interface QueryPanelWidgetProps {
  model: ModelJsonPanelModel;
}

namespace S {
  export const SimpleEditor = styled(SimpleEditorWidget)`
    height: 100%;
  `;

  export const Buttons = styled.div`
    display: flex;
    align-items: center;
    column-gap: 5px;
    padding: 5px;
  `;
}

export const ModelJsonPanelWidget: React.FC<QueryPanelWidgetProps> = observer((props) => {
  const [json, setJson] = useState<string | null>(null);

  useEffect(() => {
    if (!props.model?.model?.data) {
      return;
    }

    if (props.model.field) {
      setJson(JSON.stringify(JSON.parse(props.model.model.data.attributes[props.model.field]), null, 2));
    } else {
      setJson(JSON.stringify(props.model.model.data, null, 2));
    }
  }, [props.model.model?.data]);

  let top: JSX.Element;
  if (props.model.model && json) {
    top = (
      <PanelToolbarWidget
        btns={[
          {
            label: 'Download',
            icon: 'download',
            action: () => {
              saveFile(
                new Blob([json], { type: 'application/json' }),
                `${props.model.definition.definition.name}-${props.model.model.id}.json`
              );
            }
          },
          {
            label: 'Copy',
            icon: 'copy',
            action: () => {
              copyTextToClipboard(json);
            }
          }
        ]}
        meta={[
          {
            label: 'ID',
            value: props.model?.id
          },

          // @ts-ignore FIXME, this can take null
          props.model?.field
            ? {
                label: 'Field',
                value: props.model.field
              }
            : null
        ]}
      />
    );
  }

  return (
    <LoadingPanelWidget loading={!json}>
      {() => {
        return (
          <BorderLayoutWidget top={top}>
            <S.SimpleEditor lang="application/json" path={`${props.model.model.id}`} text={json!} />
          </BorderLayoutWidget>
        );
      }}
    </LoadingPanelWidget>
  );
});
