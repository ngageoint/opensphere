goog.require('os.file.File');
goog.require('os.file.mime.json');
goog.require('os.file.mime.mock');

describe('os.file.mime.json', function() {
  it('should not detect files that are not json files', function() {
    os.file.mime.mock.testFiles([
      '/base/test/plugin/file/kml/kml_test.xml',
      '/base/test/resources/bin/rand.bin',
      '/base/test/resources/json/ERROR_invalid_field.json',
      '/base/test/resources/json/ERROR_invalid_field2.json',
      '/base/test/resources/json/ERROR_invalid_value.json',
      '/base/test/resources/json/ERROR_invalid_value2.json',
      '/base/test/resources/json/ERROR_trailing_comma.json'],
        os.file.mime.mock.testNo(os.file.mime.json.TYPE));
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

    os.file.mime.mock.testFiles(Object.keys(expected),
        function(buffer, filename) {
          var eVal = expected[filename];
          var context = os.file.mime.text.getText(buffer);
          var result = null;
          runs(function() {
            os.file.mime.json.isJSON(buffer, undefined, context).then(function(val) {
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
    var chain = os.file.mime.getTypeChain(os.file.mime.json.TYPE).join(', ');
    expect(chain).toBe('application/octet-stream, text/plain, application/json');
  });
});
