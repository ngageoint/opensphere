goog.require('os.file.File');
goog.require('os.file.mime');
goog.require('os.file.mime.json');
goog.require('os.file.mime.mock');
goog.require('os.file.mime.text');

describe('os.file.mime.json', function() {
  const mime = goog.module.get('os.file.mime');
  const json = goog.module.get('os.file.mime.json');
  const text = goog.module.get('os.file.mime.text');

  const mockMime = goog.module.get('os.file.mime.mock');

  it('should not detect files that are not json files', function() {
    mockMime.testFiles([
      '/base/test/plugin/file/kml/kml_test.xml',
      '/base/test/resources/bin/rand.bin',
      '/base/test/resources/json/ERROR_invalid_field.json',
      '/base/test/resources/json/ERROR_invalid_field2.json',
      '/base/test/resources/json/ERROR_invalid_value.json',
      '/base/test/resources/json/ERROR_invalid_value2.json',
      '/base/test/resources/json/ERROR_trailing_comma.json'
    ], mockMime.testNo(json.TYPE));
  });

  it('should detect files that are json files', function() {
    var expected = {
      '/base/test/resources/json/partial_object.json': {
        'string': 'string',
        'number': 123,
        'boolean': true,
        'null': null
      },
      '/base/test/resources/json/partial_array.json': {
        'field': [1, 2]
      },
      '/base/test/resources/json/partial_string.json': {
        // 'field': 'There once was a'
        'field': undefined
      },
      '/base/test/resources/json/partial_number.json': {'field': 1},
      '/base/test/resources/json/partial_null.json': {'field': undefined}
    };

    mockMime.testFiles(Object.keys(expected),
        function(buffer, filename) {
          var eVal = expected[filename];
          var context = text.getText(buffer);
          var result = null;
          runs(function() {
            json.isJSON(buffer, undefined, context).then(function(val) {
              result = val;
            });
          });

          waitsFor(function() {
            return !!result;
          }, 'promise to conclude');

          runs(function() {
            if (!result) {
              console.log(filename, 'failed!');
            }

            expect(result).toBeTruthy();
            for (var key in eVal) {
              expect(result[key]).toEqual(eVal[key]);
            }
          });
        });
  });

  it('should register itself with mime detection', function() {
    var chain = mime.getTypeChain(json.TYPE).join(', ');
    expect(chain).toBe('application/octet-stream, text/plain, application/json');
  });
});
