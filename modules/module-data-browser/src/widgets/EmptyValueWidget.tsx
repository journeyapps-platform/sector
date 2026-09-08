import * as React from 'react';
import { themed } from '@journeyapps/reactor-mod';

export interface EmptyValueWidgetProps {
  label?: string;
  className?: any;
  children?: React.ReactNode;
}

export const EmptyValueWidget: React.FC<EmptyValueWidgetProps> = (props) => {
  const value = props.children ?? props.label ?? 'null';
  return <S.Label className={props.className}>{value}</S.Label>;
};

namespace S {
  export const Label = themed.span`
    color: ${(p) => p.theme.text.secondary};
    opacity: 0.6;
  `;
}
