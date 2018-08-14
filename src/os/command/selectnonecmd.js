goog.provide('os.command.SelectNone');
goog.require('os.command.AbstractSelect');



/**
 * Command for selecting all features in a source
 * @extends {os.command.AbstractSelect}
 * @param {!string} sourceId
 * @constructor
 */
os.command.SelectNone = function(sourceId) {
  os.command.SelectNone.base(this, 'constructor', sourceId);

  var source = this.getSource();
  if (source) {
    this.title = 'Deselect all features on "' + source.getTitle() + '"';
  }

  /**
   * @type {?Array.<!ol.Feature>}
   * @protected
   */
  this.previous = null;
};
goog.inherits(os.command.SelectNone, os.command.AbstractSelect);


/**
 * @inheritDoc
 */
os.command.SelectNone.prototype.select = function() {
  var source = this.getSource();
  if (source) {
    source.selectNone();
  }
};
