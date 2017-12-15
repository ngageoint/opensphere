goog.require('os.im.mapping.StaticMapping');

describe('os.im.mapping.StaticMapping', function() {
  var mapping = new os.im.mapping.StaticMapping();
  var field = 'testField';
  var value = 'testValue';

  beforeEach(function() {
    mapping.field = field;
    mapping.value = value;
    mapping.replace = true;
  });

  it('should replace the field when the replace flag is true', function() {
    // property already exists
    var record = {
      testField: 'something'
    };
    mapping.execute(record);
    expect(record.testField).toBe(value);

    // property doesn't exist
    record = {};
    mapping.execute(record);
    expect(record.testField).toBe(value);
  });

  it('should not replace the field when the replace flag is false', function() {
    // property exists
    var record = {
      testField: 'something'
    };

    mapping.replace = false;
    mapping.execute(record);
    expect(record.testField).toBe('something');

    // exists but not defined
    record.testField = undefined;
    mapping.execute(record);
    expect(record.testField).toBe(value);

    // doesn't exist
    record = {};
    mapping.execute(record);
    expect(record.testField).toBe(value);
  });

  it('should report the default sos type (meaning no autodetection)', function() {
    expect(mapping.getScoreType()).toBe(os.im.mapping.DEFAULT_SCORETYPE);
  });

  it('should report a 0 for the sos', function() {
    expect(mapping.getScore()).toBe(0);
  });

  it('should clone properly', function() {
    // changing values from the default
    mapping.replace = false;
    mapping.field = 'cloneTestField';
    mapping.value = 'cloneTestValue';

    var clone = mapping.clone();
    expect(clone).not.toBeNull();
    expect(clone instanceof os.im.mapping.StaticMapping).toBe(true);
    expect(clone.field).toBe(mapping.field);
    expect(clone.value).toBe(mapping.value);
    expect(clone.replace).toBe(mapping.replace);
  });

  it('should persist/restore properly', function() {
    // changing values from the default
    mapping.replace = false;
    mapping.field = 'restoreTestField';
    mapping.value = 'restoreTestValue';

    var persist = mapping.persist();
    expect(persist.id).toBe(mapping.getId());
    expect(persist.field).toBe(mapping.field);
    expect(persist.value).toBe(mapping.value);
    expect(persist.replace).toBe(mapping.replace);

    var restored = new os.im.mapping.StaticMapping();
    expect(restored.field).not.toBe(mapping.field);
    expect(restored.value).not.toBe(mapping.value);
    expect(restored.replace).not.toBe(mapping.replace);

    restored.restore(persist);
    expect(restored.field).toBe(mapping.field);
    expect(restored.value).toBe(mapping.value);
    expect(restored.replace).toBe(mapping.replace);
  });
});
