import {DataType, Sequelize, ModelAttributes, ModelAttributeColumnOptions, Model} from 'sequelize';

export type TransformationFunction
  = (value: any, definition: ModelAttributeDefinition<any>) => any;

export type TransformationsInit = {
  [name: string]: TransformationFunction;
}

type DefaultTransformationOptions = {
  trim?: boolean;
  lowercase?: boolean;
  uppercase?: boolean;
}

export type ModelAttributeDefinition<TransformationOptions = {}>
  = ModelAttributeColumnOptions
    & DefaultTransformationOptions
      & TransformationOptions;


export type ModelAttributesWithTransformations
  <TCreationAttributes = {}, TransformationOptions = {}>
    = {[key: string]: any} & {
      [name in keyof TCreationAttributes]: DataType
        | ModelAttributeDefinition<TransformationOptions>;
}

const defaultTransformations = {
  trim: function(value: string) {
    return value?.trim();
  },
  lowercase: function(value: string) {
    return value?.toLowerCase();
  },
  uppercase: function(value: string) {
    return value?.toUpperCase();
  }
}

export function sequelizeTransformations
  (sequelize: Sequelize, transformations: TransformationsInit) {
  sequelize.beforeDefine(attributes => {
    init(attributes, transformations);
  });
}

function init(
  attributes: ModelAttributesWithTransformations<{}, typeof transformations>,
  transformations: TransformationsInit = {}
) {
  transformations = Object.assign(defaultTransformations, transformations);

  const names = Object.keys(transformations);

  Object.keys(attributes).forEach(function(attr) {
    const definition: ModelAttributeDefinition<any> = attributes[attr];
    const localTransforms: ((value: any) => any)[] = [];

    names.forEach(function(name) {
      if(definition[name]) {
        localTransforms.push(function(value) {
          return transformations[name](value, definition);
        });
      }
    });

    if(localTransforms.length) {
      var $set = definition.set || null;

      definition.set = function(value: any) {
        var self = this;

        localTransforms.forEach(function(fn) {
          value = fn.call(self, value);
        });

        if($set)
          return $set.call(this, value);
        else
          return this.setDataValue(attr, value);
      }
    }
  });
}