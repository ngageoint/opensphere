goog.provide('os.file.mime.json');

goog.require('goog.Promise');
goog.require('os.file.mime');
goog.require('os.file.mime.text');


/**
 * @const
 * @type {string}
 */
os.file.mime.json.TYPE = 'application/json';


/**
 * @param {ArrayBuffer} buffer
 * @param {os.file.File=} opt_file
 * @param {*=} opt_context
 * @return {!goog.Promise<*|undefined>} This returns the parsed JSON (so far) as the context. Note that
 *    single falsy values such as `null`, `0`, `""`, and `false` will not be detected as
 *    JSON
 */
os.file.mime.json.isJSON = function(buffer, opt_file, opt_context) {
  var retVal;

  if (opt_context && goog.isString(opt_context)) {
    var parser = oboe();

    var error = false;
    parser.fail(function(details) {
      if (!details.thrown || !/^Invalid null /.test(details.thrown.message)) {
        error = true;
      }
    });

    parser.emit('data', opt_context);
    retVal = !error ? parser.root() : retVal;
  }

  return goog.Promise.resolve(retVal);
};

os.file.mime.register(os.file.mime.json.TYPE, os.file.mime.json.isJSON, 0, os.file.mime.text.TYPE);
