goog.provide('os.command.ToggleWebGL');

goog.require('goog.Promise');
goog.require('os.command.AbstractAsyncCommand');
goog.require('os.command.State');


/**
 * Command to switch between 2D/3D map modes.
 * @param {boolean} toggle If WebGL should be enabled.
 * @param {boolean=} opt_silent If errors should be ignored.
 * @extends {os.command.AbstractAsyncCommand}
 * @constructor
 */
os.command.ToggleWebGL = function(toggle, opt_silent) {
  os.command.ToggleWebGL.base(this, 'constructor');
  this.details = null;
  this.isAsync = true;
  this.state = os.command.State.READY;
  this.title = 'Switch to ' + (toggle ? '3D' : '2D') + ' Mode';

  /**
   * If WebGL should be enabled.
   * @type {boolean}
   * @protected
   */
  this.webGLEnabled = toggle;

  /**
   * If errors should be ignored.
   * @type {boolean}
   * @protected
   */
  this.silent = opt_silent != null ? opt_silent : false;
};
goog.inherits(os.command.ToggleWebGL, os.command.AbstractAsyncCommand);


/**
 * If the application allows switching the map mode.
 * @param {boolean} webGLEnabled If WebGL is being used
 * @return {boolean}
 * @protected
 */
os.command.ToggleWebGL.prototype.canSwitch = function(webGLEnabled) {
  if (!webGLEnabled && !this.silent) {
    // make sure switching to 2D won't destroy the browser
    var totalCount = os.dataManager.getTotalFeatureCount();
    var maxCount = os.ogc.getMaxFeatures(os.MapMode.VIEW_2D);

    if (totalCount > maxCount) {
      return false;
    }
  }

  return true;
};


/**
 * @inheritDoc
 */
os.command.ToggleWebGL.prototype.execute = function() {
  this.state = os.command.State.EXECUTING;

  var webGLEnabled = this.webGLEnabled;

  if (this.canSwitch(webGLEnabled)) {
    os.MapContainer.getInstance().setWebGLEnabled(webGLEnabled, this.silent);
    return this.finish();
  } else {
    os.MapContainer.launch2DPerformanceDialog().then(function() {
      os.MapContainer.getInstance().setWebGLEnabled(webGLEnabled, this.silent);
      this.finish();
    }, function() {
      this.handleError(this.title + ' cancelled by user.');
    }, this);
  }

  return true;
};


/**
 * @inheritDoc
 */
os.command.ToggleWebGL.prototype.revert = function() {
  this.state = os.command.State.REVERTING;

  var webGLEnabled = !this.webGLEnabled;

  if (this.canSwitch(webGLEnabled)) {
    os.MapContainer.getInstance().setWebGLEnabled(webGLEnabled, this.silent);
    return os.command.ToggleWebGL.base(this, 'revert');
  } else {
    os.MapContainer.launch2DPerformanceDialog().then(function() {
      os.MapContainer.getInstance().setWebGLEnabled(webGLEnabled, this.silent);

      this.state = os.command.State.READY;
      this.details = null;
      this.dispatchEvent(os.command.EventType.REVERTED);
    }, function() {
      this.handleError(this.title + ' cancelled by user.');
    }, this);
  }

  return true;
};
