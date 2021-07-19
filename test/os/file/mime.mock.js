goog.module('os.file.mime.mock');
goog.module.declareLegacyNamespace();

const XhrIo = goog.require('goog.net.XhrIo');
const OSFile = goog.require('os.file.File');
const {detect} = goog.require('os.file.mime');
const Request = goog.require('os.net.Request');

const testFiles = function(files, testFunc, len) {
  files.forEach(function(url) {
    var req = new Request(url);
    req.setResponseType(XhrIo.ResponseType.ARRAY_BUFFER);
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
      var file = new OSFile();
      file.setFileName(url);
      file.setUrl(url);

      var headers = req.getResponseHeaders();
      if (headers) {
        file.setContentType(headers['content-type']);
      }

      // take first chunk
      buffer = buffer.slice(0, Math.min(buffer.byteLength, len || 1024));
      testFunc(buffer, file);
    });
  });
};

const testNo = function(type) {
  return function(buffer, file) {
    var result = Number.POSITIVE_INFINITY;
    runs(function() {
      detect(buffer, file).then(function(val) {
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

const testYes = function(type) {
  return function(buffer, file) {
    var result = null;
    runs(function() {
      detect(buffer, file).then(function(val) {
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

exports = {
  testFiles,
  testNo,
  testYes
};
