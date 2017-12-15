goog.require('os.file.File');
goog.require('plugin.file.geojson.GeoJSONTypeMethod');

describe('plugin.file.geojson.GeoJSONTypeMethod', function() {
  it('matches clearly flagged GeoJSON files', function() {
    var method = new plugin.file.geojson.GeoJSONTypeMethod();

    var file = new os.file.File();
    file.setContent('');
    file.setContentType('application/json');
    file.setFileName('test.geojson');

    // extension and content type aren't adequate
    expect(method.isType(file)).toBe(false);

    file.setContentType(method.getContentType());
    expect(method.isType(file)).toBe(false);

    // unless the content appears to be JSON
    file.setContent('{}');
    expect(method.isType(file)).toBe(true);
    file.setContent('[]');
    expect(method.isType(file)).toBe(true);

    // whitespace doesn't matter
    file.setContent('   { }   ');
    expect(method.isType(file)).toBe(true);

    // other content type will not be detected
    file.setContentType('text/plain');
    expect(method.isType(file)).toBe(false);
  });

  it('matches JSON files with GeoJSON content', function() {
    var method = new plugin.file.geojson.GeoJSONTypeMethod();

    var file = new os.file.File();
    file.setContent('');
    file.setContentType('application/json');
    file.setFileName('test.json');
    expect(method.isType(file)).toBe(false);

    file.setContent('{}');
    expect(method.isType(file)).toBe(false);

    file.setContent('  { "type":"Feature" }  ');
    expect(method.isType(file)).toBe(true);
  });

  it('does not match zipped content', function() {
    var method = new plugin.file.geojson.GeoJSONTypeMethod();

    var file = new os.file.File();
    file.setContent('{}');
    file.setContentType('application/json');
    file.setFileName('test.geojson');

    expect(method.isType(file, [])).toBe(false);
  });
});
