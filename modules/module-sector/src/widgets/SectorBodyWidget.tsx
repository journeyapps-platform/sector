import * as React from 'react';
import { BodyWidget } from '@journeyapps/reactor-mod';

import logo from '../../media/logo-long.png';

export const SectorBodyWidget: React.FC = (props) => {
  return <BodyWidget additionalFooterRightBtns={[]} logo={logo} additionalLayers={[]} logoClicked={() => {}} />;
};
