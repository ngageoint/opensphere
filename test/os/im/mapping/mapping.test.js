goog.require('ol.Feature');
goog.require('os.im.mapping');

describe('os.im.mapping', function() {
  var test = {
    a: 1,
    b: 2,
    c: 3,
    f: ''
  };
  var feature = new ol.Feature(test);

  it('gets a value from a feature', function() {
    expect(os.im.mapping.getItemField(feature, 'a')).toBe(1);
    expect(os.im.mapping.getItemField(feature, 'b')).toBe(2);
    expect(os.im.mapping.getItemField(feature, 'd')).toBe(undefined);
  });

  it('gets all values from a feature', function() {
    var fields = os.im.mapping.getItemFields(feature);
    expect(fields.length).toBe(4);
    expect(fields.indexOf('a')).not.toBe(-1);
    expect(fields.indexOf('b')).not.toBe(-1);
    expect(fields.indexOf('c')).not.toBe(-1);
  });

  it('sets a value on a feature', function() {
    os.im.mapping.setItemField(feature, 'a', 4);
    os.im.mapping.setItemField(feature, 'b', 5);
    os.im.mapping.setItemField(feature, 'd', 6);

    expect(os.im.mapping.getItemField(feature, 'a')).toBe(4);
    expect(os.im.mapping.getItemField(feature, 'b')).toBe(5);
    expect(os.im.mapping.getItemField(feature, 'c')).toBe(3);
    expect(os.im.mapping.getItemField(feature, 'd')).toBe(6);
  });

  it('deletes a field from a feature', function() {
    os.im.mapping.setItemField(feature, 'c', undefined);
    expect(os.im.mapping.getItemField(feature, 'c')).toBe(undefined);
  });

  it('gets a value from an object', function() {
    expect(os.im.mapping.getItemField(test, 'a')).toBe(1);
    expect(os.im.mapping.getItemField(test, 'b')).toBe(2);
    expect(os.im.mapping.getItemField(test, 'd')).toBe(undefined);
    expect(os.im.mapping.getItemField(test, 'f')).toBe('');
  });

  it('gets all values from an object', function() {
    var fields = os.im.mapping.getItemFields(test);
    expect(fields.length).toBe(4);
    expect(fields.indexOf('a')).not.toBe(-1);
    expect(fields.indexOf('b')).not.toBe(-1);
    expect(fields.indexOf('c')).not.toBe(-1);
  });

  it('sets a value on an object', function() {
    os.im.mapping.setItemField(test, 'a', 4);
    os.im.mapping.setItemField(test, 'b', 5);
    os.im.mapping.setItemField(test, 'd', 6);

    expect(os.im.mapping.getItemField(test, 'a')).toBe(4);
    expect(os.im.mapping.getItemField(test, 'b')).toBe(5);
    expect(os.im.mapping.getItemField(test, 'c')).toBe(3);
    expect(os.im.mapping.getItemField(test, 'd')).toBe(6);
  });

  it('deletes a field from an object', function() {
    os.im.mapping.setItemField(test, 'c', null);
    expect(os.im.mapping.getItemField(test, 'c')).toBe(null);
  });

  it('detects the best field match on an item for the provided regex', function() {
    var bfm = {
      abcd: 1,
      abcde: 2,
      bcde: 3,
      bcdef: 4
    };

    expect(os.im.mapping.getBestFieldMatch(bfm, /abcd/)).toBe('abcd');
    expect(os.im.mapping.getBestFieldMatch(bfm, /.*cd/)).toBe('abcd');
    expect(os.im.mapping.getBestFieldMatch(bfm, /b.*/)).toBe('bcde');
    expect(os.im.mapping.getBestFieldMatch(bfm, /bcd/)).toBe('bcde');
    expect(os.im.mapping.getBestFieldMatch(bfm, /cde/)).toBe('bcde');
    expect(os.im.mapping.getBestFieldMatch(bfm, /def/)).toBe('bcdef');
  });
});
