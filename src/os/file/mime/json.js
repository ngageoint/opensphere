goog.module('os.file.mime.json');

const Promise = goog.require('goog.Promise');
const mime = goog.require('os.file.mime');
const text = goog.require('os.file.mime.text');

const OSFile = goog.requireType('os.file.File');


/**
 * @type {string}
 */
const TYPE = 'application/json';

/**
 * @param {ArrayBuffer} buffer
 * @param {OSFile=} opt_file
 * @param {*=} opt_context
 * @return {!Promise<*|undefined>} This returns the parsed JSON (so far) as the context. Note that
 *    single falsy values such as `null`, `0`, `""`, and `false` will not be detected as
 *    JSON
 */
const isJSON = function(buffer, opt_file, opt_context) {
  var retVal;

  if (opt_context && typeof opt_context === 'string') {
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

  return Promise.resolve(retVal);
};

mime.register(TYPE, isJSON, 0, text.TYPE);

exports = {
  TYPE,
  isJSON
};
