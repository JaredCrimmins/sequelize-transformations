# Sequelize Transformations

[Sequelize](https://github.com/sequelize/sequelize) plugin to add configurable attribute transformations. It allows you to
define transformation functions to run on attribute values when an instance is updated (through assignment,
`set`, `build`, `create` etc.). The transformation functions can be enabled and configured on attribute level.

## Installation

```sh
npm install sequelize-transformations
```

## Activation

To activate the plugin for all your models, call the plugin on your `sequelize` instance:

```js
var sequelizeTransformations = require('sequelize-transformations');

sequelizeTransformations(sequelize);
```

## Usage

To use transformations for an attribute, just add them to its definition:

```js
var Model = sequelize.define('Model', {
  email: {
    type: Sequelize.DataTypes.STRING,
    lowercase: true,
    trim: true
  }
});
```

With this configuration, the `email` attribute will always be trimmed and transformed to lower case.

## Predefined Transformations

The plugin comes with the following predefined transformations:

* `trim`: trim value
* `lowercase`: transform value to all lower case
* `uppercase`: transform value to all upper case

## Custom Transformations

It is possible to override predefined transformations or add your own by passing an object as the second argument:

```js
sequelizeTransformations(sequelize, {
  trim: function(val, defintion) {
    return val.toString().replace(/ /g, '*');
  },
  append: function(val, definition) {
    return val.toString() + definition['append'];
  },
  removeMilliseconds: function(val, definition) {
    if(val) {
      val.setMilliseconds(0);
    }

    return val;
  }
});
```

This would override the `trim` transform and add a new one called `append`. Every transformation function is called with
two parameters: the value to transform and the definition of the attribute being transformed.

## Notes

* If more than one transformation is defined on an attribute, then the order in which they are executed is unpredictable.
This is generally not an issue as you should not use mutually exclusive transformation together, e.g. `lowercase` and `uppercase`.
* If an attribute is updated with the `raw` option set to `true`, then the transformation will not be run.

## TypeScript

### Activation

```ts
import {sequelizeTransformations, ModelAttributeDefinition} from 'sequelize-transformations';

type TransformationOptions = {
  removeMilliseconds?: boolean;
}

sequelizeTransformations(sequelize, {
  removeMilliseconds: function(date: Date, definition: ModelAttributeDefinition<TransformationOptions>) {
    if(definition.removeMilliseconds) {
      date?.setMilliseconds(0);
    }

    return date;
  }
});
```

### Usage

```ts
import {DataTypes, Optional} from 'sequelize';
import {ModelAttributesWithTransformations} from 'sequelize-transformations';

interface ModelAttributes {
  id: number;
  email: string;
}

interface ModelCreationAttributes extends Optional<ModelAttributes, 'id'> {}

var Model = sequelize.define('Model', (<ModelAttributesWithTransformations<ModelCreationAttributes>>{
  email: {
    type: DataTypes.STRING,
    lowercase: true,
    trim: true
  }
}));
```