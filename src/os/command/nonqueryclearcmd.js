goog.provide('os.command.NonQueryClear');
goog.require('os.command.ICommand');
goog.require('os.command.State');



/**
 * Command for clearing spatial queries on the map.
 * @implements {os.command.ICommand}
 * @constructor
 */
os.command.NonQueryClear = function() {
  /**
   * @type {!Array<!ol.Feature>}
   * @private
   */
  this.features_ = [];
};


/**
 * @inheritDoc
 */
os.command.NonQueryClear.prototype.isAsync = false;


/**
 * @inheritDoc
 */
os.command.NonQueryClear.prototype.title = 'Clear Non-query Features';


/**
 * @inheritDoc
 */
os.command.NonQueryClear.prototype.details = null;


/**
 * @inheritDoc
 */
os.command.NonQueryClear.prototype.state = os.command.State.READY;


/**
 * @inheritDoc
 */
os.command.NonQueryClear.prototype.execute = function() {
  this.state = os.command.State.EXECUTING;

  var features = os.MapContainer.getInstance().getFeatures();
  var featuresToRemove = [];
  var am = os.ui.areaManager;

  if (features.length > 0) {
    for (var i = 0; i < features.length; i++) {
      var feature = features[i];
      if (!am.get(feature)) {
        featuresToRemove.push(feature);
      }
    }
  }

  os.MapContainer.getInstance().removeFeatures(featuresToRemove);
  this.features_ = featuresToRemove;

  this.state = os.command.State.SUCCESS;
  return true;
};


/**
 * @inheritDoc
 */
os.command.NonQueryClear.prototype.revert = function() {
  this.state = os.command.State.REVERTING;
  os.MapContainer.getInstance().addFeatures(this.features_);
  this.features_.length = 0;
  this.state = os.command.State.READY;
  return true;
};
