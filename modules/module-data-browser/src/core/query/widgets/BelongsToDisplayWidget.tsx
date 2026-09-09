import * as React from 'react';
import { useEffect, useState } from 'react';
import { SchemaModelObject } from '../../SchemaModelObject';
import { AbstractConnection } from '../../AbstractConnection';
import { IconWidget, styled, TableButtonWidget } from '@journeyapps/reactor-mod';
import { copyTextToClipboard } from '@journeyapps/reactor-lib-utils';
import { Relationship } from '@journeyapps/parser-schema';
import { observer } from 'mobx-react';
import { PeekRelationshipButton } from './PeekRelationshipButton';
import { EmptyValueWidget } from '../../../widgets/EmptyValueWidget';

export interface BelongsToDisplayWidgetProps {
  relationship: Relationship;
  id: string;
  connection: AbstractConnection;
  open: (object: SchemaModelObject) => any;
  filterBelongsTo?: (object: SchemaModelObject) => any;
  className?: any;
}

export const BelongsToDisplayWidget: React.FC<BelongsToDisplayWidgetProps> = observer((props) => {
  const [object, setObject] = useState<SchemaModelObject>(null);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    if (!props.id) {
      return;
    }

    props.connection.waitForSchemaModelDefinitionByName(props.relationship.foreignType.name).then((conn) =>
      conn.resolve(props.id).then((obj) => {
        if (!obj) {
          setBroken(true);
          return;
        }
        setObject(obj);
      })
    );
  }, [props.id]);

  if (broken) {
    return (
      <S.Warning
        tooltip="Copy ID"
        label={`${props.id} not found`}
        icon="warning"
        action={() => {
          copyTextToClipboard(props.id);
        }}
      />
    );
  }

  if (!props.id) {
    return <EmptyValueWidget>Not set</EmptyValueWidget>;
  }

  if (!object) {
    return <S.Spinner spin={true} icon="spinner" />;
  }

  return (
    <S.Container className={props.className}>
      {object.data.display}
      <S.Actions>
        <PeekRelationshipButton object={object} open={props.open} filterBelongsTo={props.filterBelongsTo} />
        <TableButtonWidget
          icon="arrow-right"
          action={() => {
            props.open(object);
          }}
        />
      </S.Actions>
    </S.Container>
  );
});

namespace S {
  export const Warning = styled(TableButtonWidget)`
    display: flex;
    flex-direction: row;
  `;

  export const Spinner = styled(IconWidget)`
    opacity: 0.2;
  `;

  export const Container = styled.div`
    display: flex;
    flex-direction: row;
    column-gap: 5px;
    align-items: center;
    justify-content: space-between;
    flex-grow: 1;
  `;

  export const Actions = styled.div`
    display: flex;
    flex-direction: row;
    column-gap: 3px;
    align-items: center;
  `;
}
