goog.provide('os.plugin.MockErrorPlugin');
goog.provide('os.plugin.MockPlugin');

goog.require('goog.Promise');
goog.require('os.plugin.AbstractPlugin');



/**
 * Mock plugin that loads after a timeout.
 * @param {Object=} opt_options Mock plugin options
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
os.plugin.MockPlugin = function(opt_options) {
  os.plugin.MockPlugin.base(this, 'constructor');

  var options = opt_options || {};

  this.id = options.id || 'mock';
  this.init_ = false;
  this.errorMessage = null;
  this.options = options;
};
goog.inherits(os.plugin.MockPlugin, os.plugin.AbstractPlugin);


/**
 * @inheritDoc
 */
os.plugin.MockPlugin.prototype.init = function() {
  var initTimeout = this.options.initTimeout != null ? this.options.initTimeout : 10;

  if (initTimeout > 0) {
    return new goog.Promise(function(resolve, reject) {
      setTimeout(resolve, initTimeout);
    });
  }
};



/**
 * Mock plugin the dispatches/throws errors.
 * @param {Object=} opt_options Mock plugin options
 * @constructor
 */
os.plugin.MockErrorPlugin = function(opt_options) {
  var options = opt_options || {};
  options.id = options.id || 'error';

  os.plugin.MockErrorPlugin.base(this, 'constructor', options);
};
goog.inherits(os.plugin.MockErrorPlugin, os.plugin.MockPlugin);


/**
 * @inheritDoc
 */
os.plugin.MockErrorPlugin.prototype.init = function() {
  if (this.options.shouldThrow) {
    throw new Error(this.options.errorMessage || 'fail');
  }

  return new goog.Promise(function(resolve, reject) {
    setTimeout(reject, this.options.initTimeout || 10);
  });
};
