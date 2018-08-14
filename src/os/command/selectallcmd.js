goog.provide('os.command.SelectAll');
goog.require('os.command.AbstractSelect');



/**
 * Command for selecting all features in a source
 * @extends {os.command.AbstractSelect}
 * @param {!string} sourceId
 * @constructor
 */
os.command.SelectAll = function(sourceId) {
  os.command.SelectAll.base(this, 'constructor', sourceId);

  var source = this.getSource();
  if (source) {
    this.title = 'Select all features on "' + source.getTitle() + '"';
  }

  /**
   * @type {?Array.<!ol.Feature>}
   * @protected
   */
  this.previous = null;
};
goog.inherits(os.command.SelectAll, os.command.AbstractSelect);


/**
 * @inheritDoc
 */
os.command.SelectAll.prototype.select = function() {
  var source = this.getSource();

  if (source) {
    source.selectAll();
  }
};
