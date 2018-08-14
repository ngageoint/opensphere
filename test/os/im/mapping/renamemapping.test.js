goog.require('os.im.mapping.RenameMapping');

describe('os.im.mapping.RenameMapping', function() {
  var rm = new os.im.mapping.RenameMapping();

  beforeEach(function() {
    rm.field = 'TestField';
    rm.toField = 'ResultField';
    rm.keepOriginal = false;
  });

  it('should report modifying the field and toField when keepOriginal is false', function() {
    expect(rm.getFieldsChanged().length).toBe(2);
    expect(rm.getFieldsChanged()).toContain(rm.field);
    expect(rm.getFieldsChanged()).toContain(rm.toField);
  });

  it('should report modifying the toField when keepOriginal is true', function() {
    rm.keepOriginal = true;
    expect(rm.getFieldsChanged().length).toBe(1);
    expect(rm.getFieldsChanged()).toContain(rm.toField);
  });

  it('should rename the field properly', function() {
    var record = {TestField: true};
    rm.execute(record);
    expect(record.ResultField).toBe(true);
    expect(record.TestField).toBe(undefined);
  });

  it('should rename the field and keep the original', function() {
    rm.keepOriginal = true;
    var record = {TestField: true};
    rm.execute(record);
    expect(record.ResultField).toBe(true);
    expect(record.TestField).toBe(true);
  });

  it('should report a null sosType (meaning no autodetection)', function() {
    expect(rm.getScoreType()).toBe(os.im.mapping.DEFAULT_SCORETYPE);
  });

  it('should report a 0 for the sos', function() {
    expect(rm.getScore()).toBe(0);
  });

  it('should clone properly', function() {
    var clone = rm.clone();
    expect(clone).not.toBeNull();
    expect(clone instanceof os.im.mapping.RenameMapping).toBe(true);
    expect(clone.field).toBe(rm.field);
    expect(clone.toField).toBe(rm.toField);
    expect(clone.keepOriginal).toBe(rm.keepOriginal);
  });

  it('should persist/restore properly', function() {
    // changing the value from the default
    rm.keepOriginal = true;

    var persist = rm.persist();
    expect(persist.id).toBe(rm.getId());
    expect(persist.field).toBe(rm.field);
    expect(persist.toField).toBe(rm.toField);
    expect(persist.keepOriginal).toBe(rm.keepOriginal);

    var restored = new os.im.mapping.RenameMapping();
    expect(restored.field).not.toBe(rm.field);
    expect(restored.toField).not.toBe(rm.toField);
    expect(restored.keepOriginal).not.toBe(rm.keepOriginal);

    restored.restore(persist);
    expect(restored.field).toBe(rm.field);
    expect(restored.toField).toBe(rm.toField);
    expect(restored.keepOriginal).toBe(rm.keepOriginal);
  });

  it('should persist/restore properly to XML', function() {
    // changing the value from the default
    rm.keepOriginal = true;

    var xml = rm.toXml();
    expect(xml).toBeDefined();
    expect(xml.localName).toBe('mapping');
    expect(xml.getAttribute('type')).toBe(rm.xmlType);

    var fieldEl = xml.querySelector('field');
    expect(fieldEl).toBeDefined();
    expect(fieldEl.textContent).toBe(rm.field);

    var toFieldEl = xml.querySelector('toField');
    expect(toFieldEl).toBeDefined();
    expect(toFieldEl.textContent).toBe(rm.toField);

    var keepOriginalEl = xml.querySelector('keepOriginal');
    expect(keepOriginalEl).toBeDefined();
    expect(keepOriginalEl.textContent).toBe(String(rm.keepOriginal));

    var restored = new os.im.mapping.RenameMapping();
    expect(restored.field).not.toBe(rm.field);
    expect(restored.toField).not.toBe(rm.toField);
    expect(restored.keepOriginal).not.toBe(rm.keepOriginal);

    restored.fromXml(xml);
    expect(restored.field).toBe(rm.field);
    expect(restored.toField).toBe(rm.toField);
    expect(restored.keepOriginal).toBe(rm.keepOriginal);
  });
});
