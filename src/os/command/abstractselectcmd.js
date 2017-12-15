goog.provide('os.command.AbstractSelect');
goog.require('os.command.AbstractSource');
goog.require('os.command.ICommand');
goog.require('os.command.State');



/**
 * Abstract command for performing selections on a source
 * @implements {os.command.ICommand}
 * @extends {os.command.AbstractSource}
 * @param {!string} sourceId
 * @constructor
 */
os.command.AbstractSelect = function(sourceId) {
  os.command.AbstractSelect.base(this, 'constructor', sourceId);

  /**
   * @type {?Array.<number|string|undefined>}
   * @protected
   */
  this.previous = null;
};
goog.inherits(os.command.AbstractSelect, os.command.AbstractSource);


/**
 * @inheritDoc
 */
os.command.AbstractSelect.prototype.execute = function() {
  if (this.canExecute()) {
    this.state = os.command.State.EXECUTING;

    var source = this.getSource();
    this.previous = source.getSelectedItems().map(
        /**
         * @param {ol.Feature} feature
         * @return {number|string|undefined}
         */
        function(feature) {
          return feature.getId();
        });


    this.select();
    this.state = os.command.State.SUCCESS;
    return true;
  }

  return false;
};


/**
 * Does the selection
 */
os.command.AbstractSelect.prototype.select = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.command.AbstractSelect.prototype.revert = function() {
  this.state = os.command.State.REVERTING;

  var source = this.getSource();

  if (source) {
    if (this.previous) {
      var src = /** @type {ol.source.Vector} */ (source);
      var s = this.previous.map(
          /**
           * @param {number|string|undefined} id
           * @return {ol.Feature}
           */
          function(id) {
            return src.getFeatureById(id || 0);
          });

      source.setSelectedItems(s);
    } else {
      source.selectNone();
    }
  }

  this.state = os.command.State.READY;
  return true;
};
