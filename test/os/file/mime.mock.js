goog.provide('os.file.mime.mock');

goog.require('goog.net.XhrIo');
goog.require('os.file.File');
goog.require('os.net.Request');
goog.require;

os.file.mime.mock.testFiles = function(files, testFunc, len) {
  files.forEach(function(url) {
    var req = new os.net.Request(url);
    req.setResponseType(goog.net.XhrIo.ResponseType.ARRAY_BUFFER);
    var buffer = null;

    runs(function() {
      req.getPromise().then(function(resp) {
        buffer = resp;
      });
    });

    waitsFor(function() {
      return !!buffer;
    }, url + ' to load');

    runs(function() {
      var file = new os.file.File();
      file.setFileName(url);
      file.setUrl(url);

      var headers = req.getResponseHeaders();
      if (headers) {
        for (var header in headers) {
          if (header.toLowerCase() === 'content-type') {
            file.setContentType(headers[header]);
            break;
          }
        }
      }

      // take first chunk
      buffer = buffer.slice(0, Math.min(buffer.byteLength, len || 1024));
      testFunc(buffer, file);
    });
  });
};


os.file.mime.mock.testNo = function(type) {
  return function(buffer, file) {
    var result = Number.POSITIVE_INFINITY;
    runs(function() {
      os.file.mime.detect(buffer, file).then(function(val) {
        result = val;
      });
    });

    waitsFor(function() {
      return result !== Number.POSITIVE_INFINITY;
    }, 'promise to conclude');

    runs(function() {
      expect(result).not.toBe(type);
    });
  };
};


os.file.mime.mock.testYes = function(type) {
  return function(buffer, file) {
    var result = null;
    runs(function() {
      os.file.mime.detect(buffer, file).then(function(val) {
        result = val;
      });
    });

    waitsFor(function() {
      return !!result;
    }, 'promise to conclude');

    runs(function() {
      if (result !== type) {
        console.log(file.getUrl() + ' failed!');
      }

      expect(result).toBe(type);
    });
  };
};
