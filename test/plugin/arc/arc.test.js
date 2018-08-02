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

  it('should detect an Arc response and sos it', function() {
    var file = new os.file.File();
    var url = 'https://fake.arc.server/arcgis/rest/services';
    var content = '<div>Some Fake Title</div><br><br>ArcGIS REST Services Directory';

    file.setUrl(url);
    expect(plugin.arc.isArcResponse(file)).toBe(3);

    file.setContent(content);
    expect(plugin.arc.isArcResponse(file)).toBe(6);
  });
});
