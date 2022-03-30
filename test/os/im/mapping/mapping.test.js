goog.require('os.im.mapping');

import Feature from 'ol/src/Feature.js';

describe('os.im.mapping', function() {
  const mapping = goog.module.get('os.im.mapping');

  var test = {
    a: 1,
    b: 2,
    c: 3,
    f: ''
  };
  var feature = new Feature(test);

  it('gets a value from a feature', function() {
    expect(mapping.getItemField(feature, 'a')).toBe(1);
    expect(mapping.getItemField(feature, 'b')).toBe(2);
    expect(mapping.getItemField(feature, 'd')).toBe(undefined);
  });

  it('gets all values from a feature', function() {
    var fields = mapping.getItemFields(feature);
    expect(fields.length).toBe(4);
    expect(fields.indexOf('a')).not.toBe(-1);
    expect(fields.indexOf('b')).not.toBe(-1);
    expect(fields.indexOf('c')).not.toBe(-1);
  });

  it('sets a value on a feature', function() {
    mapping.setItemField(feature, 'a', 4);
    mapping.setItemField(feature, 'b', 5);
    mapping.setItemField(feature, 'd', 6);

    expect(mapping.getItemField(feature, 'a')).toBe(4);
    expect(mapping.getItemField(feature, 'b')).toBe(5);
    expect(mapping.getItemField(feature, 'c')).toBe(3);
    expect(mapping.getItemField(feature, 'd')).toBe(6);
  });

  it('deletes a field from a feature', function() {
    mapping.setItemField(feature, 'c', undefined);
    expect(mapping.getItemField(feature, 'c')).toBe(undefined);
  });

  it('gets a value from an object', function() {
    expect(mapping.getItemField(test, 'a')).toBe(1);
    expect(mapping.getItemField(test, 'b')).toBe(2);
    expect(mapping.getItemField(test, 'd')).toBe(undefined);
    expect(mapping.getItemField(test, 'f')).toBe('');
  });

  it('gets all values from an object', function() {
    var fields = mapping.getItemFields(test);
    expect(fields.length).toBe(4);
    expect(fields.indexOf('a')).not.toBe(-1);
    expect(fields.indexOf('b')).not.toBe(-1);
    expect(fields.indexOf('c')).not.toBe(-1);
  });

  it('sets a value on an object', function() {
    mapping.setItemField(test, 'a', 4);
    mapping.setItemField(test, 'b', 5);
    mapping.setItemField(test, 'd', 6);

    expect(mapping.getItemField(test, 'a')).toBe(4);
    expect(mapping.getItemField(test, 'b')).toBe(5);
    expect(mapping.getItemField(test, 'c')).toBe(3);
    expect(mapping.getItemField(test, 'd')).toBe(6);
  });

  it('deletes a field from an object', function() {
    mapping.setItemField(test, 'c', null);
    expect(mapping.getItemField(test, 'c')).toBe(null);
  });

  it('detects the best field match on an item for the provided regex', function() {
    var bfm = {
      abcd: 1,
      abcde: 2,
      bcde: 3,
      bcdef: 4
    };

    expect(mapping.getBestFieldMatch(bfm, /abcd/)).toBe('abcd');
    expect(mapping.getBestFieldMatch(bfm, /.*cd/)).toBe('abcd');
    expect(mapping.getBestFieldMatch(bfm, /b.*/)).toBe('bcde');
    expect(mapping.getBestFieldMatch(bfm, /bcd/)).toBe('bcde');
    expect(mapping.getBestFieldMatch(bfm, /cde/)).toBe('bcde');
    expect(mapping.getBestFieldMatch(bfm, /def/)).toBe('bcdef');
  });
});
