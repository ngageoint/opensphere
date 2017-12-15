goog.require('os.im.mapping.AbstractMapping');

describe('os.im.mapping.AbstractMapping', function() {
  var am = new os.im.mapping.AbstractMapping();

  am.field = 'TestField';
  am.label = 'Abstract Mapping';
  am.xmlType = 'TestMapping';

  it('should report modifying the field', function() {
    expect(am.getFieldsChanged().length).toBe(1);
    expect(am.getFieldsChanged()).toContain(am.field);
  });

  it('should report a null sosType', function() {
    expect(am.getScoreType()).toBe(os.im.mapping.DEFAULT_SCORETYPE);
  });

  it('should report a 0 for the sos', function() {
    expect(am.getScore()).toBe(0);
  });

  it('should clone properly', function() {
    var clone = am.clone();
    expect(clone).not.toBeNull();
    expect(clone instanceof os.im.mapping.AbstractMapping).toBe(true);
    expect(clone.field).toBe(am.field);
  });

  it('should persist/restore properly', function() {
    var persist = am.persist();
    expect(persist.id).toBe(am.getId());
    expect(persist.field).toBe(am.field);

    var restored = new os.im.mapping.AbstractMapping();
    expect(restored.field).not.toBe(am.field);
    restored.restore(persist);
    expect(restored.field).toBe(am.field);
  });

  it('should persist/restore properly to XML', function() {
    var xml = am.toXml();
    expect(xml).toBeDefined();
    expect(xml.localName).toBe('mapping');
    expect(xml.getAttribute('type')).toBe(am.xmlType);

    var fieldEl = xml.querySelector('field');
    expect(fieldEl).toBeDefined();
    expect(fieldEl.textContent).toBe(am.field);

    var restored = new os.im.mapping.AbstractMapping();
    expect(restored.field).not.toBe(am.field);
    expect(restored.xmlType).not.toBe(am.xmlType);
    restored.fromXml(xml);
    expect(restored.field).toBe(am.field);
    expect(restored.xmlType).toBe(am.xmlType);
  });
});
