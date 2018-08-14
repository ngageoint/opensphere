goog.provide('os.net.VariableReplacer');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.net.AbstractModifier');



/**
 * Replaces variables in URL paths andparameters. Variables like `{time:start, Last 24 Hours, DD/MM/YY}`
 * are converted to the proper replace function by digging out the namespace (in this case, 'time')
 * and mapping it to a replacement function, which is passed the rest of the variable
 * ('start, Last 24 Hours, DD/MM/YY').
 *
 * @example
 *  // replace {echo:foo} with foo
 *  // e.g. '/path/to/{echo:foo}?q={echo:bar}' will result in '/path/to/foo?q=bar'
 *
 *  os.net.VariableReplacer.add('echo', function(match, submatch, offset, str) {
 *    return submatch;
 *  });
 *
 * @extends {os.net.AbstractModifier}
 * @constructor
 */
os.net.VariableReplacer = function() {
  os.net.VariableReplacer.base(this, 'constructor', 'variables', -100);
};
goog.inherits(os.net.VariableReplacer, os.net.AbstractModifier);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.net.VariableReplacer.LOGGER_ = goog.log.getLogger('os.net.VariableReplacer');


/**
 * @type {Object<string, {replacer: function(string, string, number, string):string, regex: RegExp}>}
 * @private
 */
os.net.VariableReplacer.REPLACERS_ = {};


/**
 * Adds a variable replacer for the given key. Note that the key is case-sensitive
 * @param {!string} key
 * @param {function(string, string, number, string):string} replaceFn A function matching the definition for
 *  string.replace(needle, replaceFn)
 */
os.net.VariableReplacer.add = function(key, replaceFn) {
  if (key in os.net.VariableReplacer.REPLACERS_) {
    goog.log.warning(os.net.VariableReplacer.LOGGER_, 'Overriding variable replacement function for "' + key + '"!');
  }

  os.net.VariableReplacer.REPLACERS_[key] = {
    replacer: replaceFn,
    regex: new RegExp('{' + key + ':?([^}]+)?}', 'g')
  };
};


/**
 * @inheritDoc
 */
os.net.VariableReplacer.prototype.modify = function(uri) {
  var qd = uri.getQueryData();
  var keys = qd.getKeys();
  var replacers = os.net.VariableReplacer.REPLACERS_;

  for (var replaceKey in replacers) {
    var replaceFn = replacers[replaceKey].replacer;
    var regexp = replacers[replaceKey].regex;

    // this replaces in the query string
    if (keys) {
      for (var i = 0, n = keys.length; i < n; i++) {
        var key = keys[i];
        var value = qd.get(key);

        if (value) {
          var newValue = value.toString().replace(regexp, replaceFn);

          if (newValue != value) {
            qd.set(key, newValue);
          }
        }
      }
    }

    // this replaces in the URI path
    value = uri.getPath();
    if (value) {
      newValue = value.replace(regexp, replaceFn);

      if (newValue != value) {
        uri.setPath(newValue);
      }
    }
  }
};


/**
 * Splits the submatch by commas and trims each value.
 * @param {undefined|string} submatch
 * @return {Array<string>} parts
 */
os.net.VariableReplacer.getParts = function(submatch) {
  return submatch ? submatch.split(/\s*,\s*/) : [];
};
