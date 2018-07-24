goog.require('os.file.File');
goog.require('plugin.arc');


describe('plugin.arc', function() {
  it('should translate ESRI types to types we understand', function() {
    var bool = 'esriFieldTypeBoolean';
    var string = 'esriFieldTypeString';
    var date = 'esriFieldTypeDate';
    var geom = 'esriFieldTypeGeometry';
    var num = 'esriFakeType';

    expect(plugin.arc.getColumnType(bool)).toBe('string');
    expect(plugin.arc.getColumnType(string)).toBe('string');
    expect(plugin.arc.getColumnType(date)).toBe('datetime');
    expect(plugin.arc.getColumnType(geom)).toBe('gml');
    expect(plugin.arc.getColumnType(num)).toBe('decimal');
  });
});
