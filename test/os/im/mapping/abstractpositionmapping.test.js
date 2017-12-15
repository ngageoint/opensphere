goog.require('os.im.mapping.AbstractPositionMapping');

describe('os.im.mapping.AbstractPositionMapping', function() {
  var apm = new os.im.mapping.AbstractPositionMapping();

  apm.field = 'TestField';
  apm.label = 'Abstract Mapping';
  apm.customFormat = 'DMM';

  it('should clone properly', function() {
    var clone = apm.clone();
    expect(clone).not.toBeNull();
    expect(clone instanceof os.im.mapping.AbstractPositionMapping).toBe(true);
    expect(clone.customFormat).toBe(apm.customFormat);
  });

  it('should persist/restore properly', function() {
    var persist = apm.persist();
    expect(persist.id).toBe(apm.getId());
    expect(persist.customFormat).toBe(apm.customFormat);

    var restored = new os.im.mapping.AbstractPositionMapping();
    expect(restored.customFormat).not.toBe(apm.customFormat);
    restored.restore(persist);
    expect(restored.customFormat).toBe(apm.customFormat);
  });

  it('should persist/restore properly to XML', function() {
    var xml = apm.toXml();
    expect(xml).toBeDefined();
    expect(xml.localName).toBe('mapping');
    expect(xml.getAttribute('type')).toBe(apm.xmlType);

    var customFormatEl = xml.querySelector('customFormat');
    expect(customFormatEl).toBeDefined();
    expect(customFormatEl.textContent).toBe(apm.customFormat);

    var restored = new os.im.mapping.AbstractPositionMapping();
    expect(restored.customFormat).not.toBe(apm.customFormat);
    restored.fromXml(xml);
    expect(restored.customFormat).toBe(apm.customFormat);
  });
});
