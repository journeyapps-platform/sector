import {
  FormInput,
  FormInputGenerics,
  FormInputOptions,
  FormInputRenderOptions,
  InputContainerWidget,
  NumberInput,
  PanelButtonMode,
  PanelButtonWidget
} from '@journeyapps/reactor-mod';
import * as React from 'react';
import { Location } from '@journeyapps/db';
import styled from '@emotion/styled';

export class LocationInput extends FormInput<FormInputGenerics & { VALUE: Location }> {
  latitude: NumberInput;
  longitude: NumberInput;

  constructor(options: FormInputOptions<Location>) {
    super(options);
    this.latitude = new NumberInput({
      name: 'latitude',
      label: 'Latitude',
      value: options.value?.latitude || null
    });
    this.longitude = new NumberInput({
      name: 'longitude',
      label: 'Longitude',
      value: options.value?.longitude || null
    });

    this.update();

    [this.latitude, this.longitude].forEach((l) => {
      l.registerListener({
        valueChanged: () => {
          this.update();
        }
      });
    });
  }

  setValue(value: Location) {
    super.setValue(value);

    let lat = value?.latitude || null;
    let lon = value?.longitude || null;

    if (this.latitude.value !== lat) {
      this.latitude.setValue(lat);
    }
    if (this.longitude.value !== lon) {
      this.longitude.setValue(lon);
    }
  }

  update() {
    let lat = this.latitude.value;
    let long = this.longitude.value;
    if (lat == null && long === null) {
      this.setValue(null);
      this.setError(null);
    } else if (lat == null || long === null) {
      this.setError('Invalid location');
    } else {
      this.setValue(
        new Location({
          latitude: lat,
          longitude: long,
          horizontal_accuracy: (this.value as Location)?.horizontal_accuracy,
          vertical_accuracy: (this.value as Location)?.vertical_accuracy,
          altitude: (this.value as Location)?.altitude,
          timestamp: new Date()
        })
      );
    }
  }

  renderControl(options: FormInputRenderOptions): React.JSX.Element {
    return (
      <S.Container>
        <InputContainerWidget error={this.latitude.error} label={this.latitude.label} inline={true}>
          {this.latitude.renderControl({ inline: true })}
        </InputContainerWidget>
        <InputContainerWidget error={this.longitude.error} label={this.longitude.label} inline={true}>
          {this.longitude.renderControl({ inline: true })}
        </InputContainerWidget>
        {this.value ? (
          <PanelButtonWidget
            mode={PanelButtonMode.LINK}
            label="Open in maps"
            icon="map"
            action={() => {
              window.open(`https://www.google.com/maps/?q=${this.latitude.value},${this.longitude.value}`, '_blank');
            }}
          />
        ) : null}
      </S.Container>
    );
  }
}

namespace S {
  export const Container = styled.div`
    display: flex;
    flex-direction: column;
    row-gap: 2px;
    max-width: 250px;
    align-items: flex-start;
  `;
}
