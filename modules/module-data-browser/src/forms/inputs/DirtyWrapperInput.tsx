import { FormInput, FormInputRenderOptions, styled } from '@journeyapps/reactor-mod';
import * as React from 'react';
import { SchemaModelObject } from '../../core/SchemaModelObject';
import { computed } from 'mobx';
import { observer } from 'mobx-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export class DirtyWrapperInput extends FormInput {
  constructor(
    public input: FormInput,
    public object?: SchemaModelObject
  ) {
    super({
      ...input.options
    });
    input.registerListener({
      valueChanged: () => {
        this.setValue(input.value);
      },
      errorChanged: () => {
        this.setError(input.error);
      }
    });
  }

  revert() {
    if (this.object) {
      this.object.revert(this.input.name);
    }
  }

  clear() {
    if (this.object) {
      this.object.set(this.input.name, null);
    }
  }

  @computed get dirty() {
    return this.object?.patch.has(this.input.name);
  }

  renderControl(options: FormInputRenderOptions): React.JSX.Element {
    return <Wrapper input={this}>{this.input.renderControl(options)}</Wrapper>;
  }
}

export interface WrapperProps {
  input: DirtyWrapperInput;
}

export const Wrapper: React.FC<React.PropsWithChildren<WrapperProps>> = observer((props) => {
  return (
    <S.Container dirty={props.input.dirty}>
      {props.children}
      {props.input.dirty ? (
        <S.RevertButton
          icon="arrow-rotate-back"
          onClick={() => {
            props.input.revert();
          }}
        />
      ) : null}
      {props.input.value != null ? (
        <S.ClearButton
          icon="close"
          onClick={() => {
            props.input.clear();
          }}
        />
      ) : null}
    </S.Container>
  );
});
namespace S {
  export const Container = styled.div<{ dirty: boolean }>`
    border-left: solid 4px ${(p) => (p.dirty ? p.theme.status.success : 'transparent')};
    padding-left: 2px;
    display: flex;
    flex-direction: row;
    align-items: center;
  `;

  export const RevertButton = styled(FontAwesomeIcon)`
    color: ${(p) => p.theme.status.success};
    font-size: 12px;
    padding: 5px;
    cursor: pointer;
  `;
  export const ClearButton = styled(FontAwesomeIcon)`
    color: ${(p) => p.theme.text.secondary};
    font-size: 12px;
    padding: 5px;
    cursor: pointer;
  `;
}
