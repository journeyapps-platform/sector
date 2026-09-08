import { Location, LocationType } from '@journeyapps/db';
import { MetadataWidget, styled } from '@journeyapps/reactor-mod';
import * as React from 'react';
import { LocationInput } from '../inputs/LocationInput';
import { TypeHandler } from './shared/type-handler';

export const locationHandler: TypeHandler = {
  matches: (type) => type instanceof LocationType,
  getTypeLabel: () => 'Location',
  encode: async (value: Location) => value,
  decode: async (value: Location) => value,
  encodeToScalar: async (value: Location) => {
    if (!value) {
      return null;
    }
    return `${value.latitude},${value.longitude}`;
  },
  decodeFromScalar: async (value) => {
    if (typeof value !== 'string') {
      return null;
    }
    const [latitude, longitude] = value.split(',').map((v) => Number(v.trim()));
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return null;
    }
    return new Location({
      latitude,
      longitude,
      timestamp: new Date()
    });
  },
  generateField: ({ label, name }) => {
    return new LocationInput({
      name,
      label
    });
  },
  generateDisplay: ({ value }) => {
    return (
      <S.Container>
        <MetadataWidget label={'Lat'} value={`${value.latitude}`} />
        <MetadataWidget label={'Long'} value={`${value.longitude}`} />
      </S.Container>
    );
  }
};

namespace S {
  export const Container = styled.div`
    display: flex;
    flex-wrap: wrap;
    row-gap: 2px;
  `;
}
