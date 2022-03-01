goog.require('plugin.arc');

describe('plugin.arc', function() {
  const arc = goog.module.get('plugin.arc');

  it('should translate ESRI types to types we understand', function() {
    var bool = 'esriFieldTypeBoolean';
    var string = 'esriFieldTypeString';
    var date = 'esriFieldTypeDate';
    var geom = 'esriFieldTypeGeometry';
    var num = 'esriFakeType';

    expect(arc.getColumnType(bool)).toBe('string');
    expect(arc.getColumnType(string)).toBe('string');
    expect(arc.getColumnType(date)).toBe('datetime');
    expect(arc.getColumnType(geom)).toBe('gml');
    expect(arc.getColumnType(num)).toBe('decimal');
  });
});
