goog.provide('os.command.ToggleCesium');

goog.require('goog.Promise');
goog.require('os.command.AbstractAsyncCommand');
goog.require('os.command.State');



/**
 * Command to switch between 2D/3D map modes.
 * @param {boolean} toggle If Cesium should be enabled
 * @param {boolean=} opt_silent If errors should be ignored
 * @extends {os.command.AbstractAsyncCommand}
 * @constructor
 */
os.command.ToggleCesium = function(toggle, opt_silent) {
  os.command.ToggleCesium.base(this, 'constructor');

  this.state = os.command.State.READY;
  this.isAsync = true;
  this.title = 'Toggle Cesium';
  this.details = null;

  /**
   * If Cesium should be enabled.
   * @type {boolean}
   * @protected
   */
  this.useCesium = toggle;

  /**
   * @type {boolean}
   * @protected
   */
  this.silent = opt_silent != null ? opt_silent : false;

  this.title = 'Switch to ' + (toggle ? '3D' : '2D') + ' mode';
};
goog.inherits(os.command.ToggleCesium, os.command.AbstractAsyncCommand);


/**
 * If the application allows switching the map mode.
 * @param {boolean} useCesium If Cesium is being used
 * @return {boolean}
 * @protected
 */
os.command.ToggleCesium.prototype.canSwitch = function(useCesium) {
  if (!useCesium && !this.silent) {
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
os.command.ToggleCesium.prototype.execute = function() {
  this.state = os.command.State.EXECUTING;

  var useCesium = this.useCesium;

  if (this.canSwitch(useCesium)) {
    os.MapContainer.getInstance().setCesiumEnabled(useCesium, this.silent);
    return this.finish();
  } else {
    os.MapContainer.launch2DPerformanceDialog().then(function() {
      os.MapContainer.getInstance().setCesiumEnabled(useCesium, this.silent);
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
os.command.ToggleCesium.prototype.revert = function() {
  this.state = os.command.State.REVERTING;

  var useCesium = !this.useCesium;

  if (this.canSwitch(useCesium)) {
    os.MapContainer.getInstance().setCesiumEnabled(useCesium, this.silent);
    return os.command.ToggleCesium.base(this, 'revert');
  } else {
    os.MapContainer.launch2DPerformanceDialog().then(function() {
      os.MapContainer.getInstance().setCesiumEnabled(useCesium, this.silent);

      this.state = os.command.State.READY;
      this.details = null;
      this.dispatchEvent(os.command.EventType.REVERTED);
    }, function() {
      this.handleError(this.title + ' cancelled by user.');
    }, this);
  }

  return true;
};
