'use strict';

var assert = require('assert');
var _ = require('lodash');
var Sequelize = require('sequelize');
var {sequelizeTransformations} = require('./../');

var sequelize;
var testString = '  Test String  ';

var modelDefinition = {
  noTransformations: {
    type: Sequelize.STRING
  },
  trim: {
    type: Sequelize.STRING,
    trim: true
  },
  lowercase: {
    type: Sequelize.STRING,
    lowercase: true
  },
  uppercase: {
    type: Sequelize.STRING,
    uppercase: true
  },
  combined: {
    type: Sequelize.STRING,
    trim: true,
    lowercase: true
  },
  customSetter: {
    type: Sequelize.STRING,
    trim: true,
    lowercase: true,
    set: function(val) {
      return this.setDataValue('customSetter', val + '##');
    }
  },
  customTransformation: {
    type: Sequelize.STRING,
    append: '(postfix)'
  }
};

var instanceDefinition = {
  noTransformations: testString,
  trim: testString,
  lowercase: testString,
  uppercase: testString,
  combined: testString,
  customSetter: testString,
  customTransformation: testString
};

function defineModel() {
  // use a deep clone because sequelizeTransforms will modify the model definition by adding/replacing setters
  return sequelize.define('Model', _.cloneDeep(modelDefinition));
}

describe('Sequelize transformations', function() {

  beforeEach(function() {
    sequelize = new Sequelize('db', 'u', 'p', {dialect: 'mysql'});
  });

  it('default transformations should not fail for null values', function() {
    sequelizeTransformations(sequelize);

    var Model = defineModel();

    assert.doesNotThrow(function() {
      Model.build({
        trim: null,
        lowercase: null,
        uppercase: null
      });
    });
  });

  it('should run default transformations on configured attributes', function() {
    sequelizeTransformations(sequelize);

    var Model = defineModel();
    var instance = Model.build(instanceDefinition);

    assert.strictEqual(instance.noTransformations, '  Test String  ');
    assert.strictEqual(instance.trim, 'Test String');
    assert.strictEqual(instance.lowercase, '  test string  ');
    assert.strictEqual(instance.uppercase, '  TEST STRING  ');
    assert.strictEqual(instance.combined, 'test string');
    assert.strictEqual(instance.customSetter, 'test string##');
    assert.strictEqual(instance.customTransformation, '  Test String  ');
  });

  it('should run custom transformations', function() {
    sequelizeTransformations(sequelize, {
      trim: function(val, defintion) {
        return val.toString().replace(/ /g, '*');
      },
      append: function(val, definition) {
        return val.toString() + definition['append'];
      }
    });

    var Model = defineModel();
    var instance = Model.build(instanceDefinition);

    assert.strictEqual(instance.noTransformations, '  Test String  ');
    assert.strictEqual(instance.trim, '**Test*String**');
    assert.strictEqual(instance.lowercase, '  test string  ');
    assert.strictEqual(instance.uppercase, '  TEST STRING  ');
    assert.strictEqual(instance.combined, '**test*string**');
    assert.strictEqual(instance.customSetter, '**test*string**##');
    assert.strictEqual(instance.customTransformation, '  Test String  (postfix)');
  });
});