import { ioc, SmartDateDisplayWidget } from '@journeyapps/reactor-mod';
import * as React from 'react';
import { PageRow } from '../Page';
import { TypeEngine } from '../../../forms/TypeEngine';
import { EmptyValueWidget } from '../../../widgets/EmptyValueWidget';
import { StandardModelFields } from '../StandardModelFields';

export interface CellDisplayWidgetProps {
  row: PageRow;
  cell: any;
  name: string;
}

export const CellDisplayWidget: React.FC<CellDisplayWidgetProps> = (props) => {
  const { row, cell, name } = props;
  if (cell == null) {
    return <EmptyValueWidget />;
  }

  if (name === StandardModelFields.UPDATED_AT) {
    return <SmartDateDisplayWidget date={cell} />;
  }

  let display = ioc.get(TypeEngine).getHandler(row.definition.definition.attributes[name].type)?.generateDisplay({
    model: row.model,
    value: cell,
    label: row.definition.definition.attributes[name].label,
    name,
    type: row.definition.definition.attributes[name].type
  });
  if (display) {
    return display;
  }

  console.log('unknown type', cell, row.definition.definition.attributes[name].type);
  return null;
};
