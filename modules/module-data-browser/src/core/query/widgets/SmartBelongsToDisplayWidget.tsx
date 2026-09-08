import * as React from 'react';
import { EditSchemaModelAction } from '../../../actions/schema-model/EditSchemaModelAction';
import { BelongsToDisplayWidget } from './BelongsToDisplayWidget';
import { PageRow } from '../Page';
import { ActionSource, styled } from '@journeyapps/reactor-mod';
import { AbstractConnection } from '../../AbstractConnection';
import { SchemaModelObject } from '../../SchemaModelObject';
import { Variable } from '@journeyapps/db';
import { observer } from 'mobx-react';

export interface SmartBelongsToDisplayWidgetProps {
  row: PageRow;
  connection: AbstractConnection;
  variable_id: Variable;
  filterBelongsTo?: (object: SchemaModelObject) => any;
}

export const SmartBelongsToDisplayWidget: React.FC<SmartBelongsToDisplayWidgetProps> = observer((props) => {
  const { row, connection, variable_id } = props;

  let dirty = false;
  let value = row.model.model[variable_id.name];
  if (row.model.patch.has(variable_id.relationship)) {
    value = row.model.patch.get(variable_id.relationship)?.id;
    dirty = true;
  }

  return (
    <S.Container
      dirty={dirty}
      open={(object) => {
        EditSchemaModelAction.get().fireAction({
          source: ActionSource.BUTTON,
          targetEntity: object
        });
      }}
      relationship={row.model.definition.definition.belongsTo[variable_id.relationship]}
      connection={connection}
      id={value}
      filterBelongsTo={props.filterBelongsTo}
    />
  );
});
namespace S {
  export const Container = styled(BelongsToDisplayWidget)<{ dirty: boolean }>`
    border-left: solid 4px ${(p) => (p.dirty ? p.theme.status.success : 'transparent')};
    padding-left: 2px;
  `;
}
