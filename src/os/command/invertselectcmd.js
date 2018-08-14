goog.provide('os.command.InvertSelect');
goog.require('goog.array');
goog.require('os.command.AbstractSource');
goog.require('os.command.ICommand');
goog.require('os.command.State');



/**
 * Inverts the selection on a source
 * @implements {os.command.ICommand}
 * @extends {os.command.AbstractSource}
 * @param {!string} sourceId
 * @constructor
 */
os.command.InvertSelect = function(sourceId) {
  os.command.InvertSelect.base(this, 'constructor', sourceId);

  var source = this.getSource();
  if (source) {
    this.title = 'Invert selection on "' + source.getTitle() + '"';
  }
};
goog.inherits(os.command.InvertSelect, os.command.AbstractSource);


/**
 * @inheritDoc
 */
os.command.InvertSelect.prototype.execute = function() {
  if (this.canExecute()) {
    this.state = os.command.State.EXECUTING;
    this.invert_();
    this.state = os.command.State.SUCCESS;
    return true;
  }

  return false;
};


/**
 * Inverts the selection on the source
 * @private
 */
os.command.InvertSelect.prototype.invert_ = function() {
  var source = this.getSource();
  if (source) {
    source.setSelectedItems(source.getUnselectedItems());
  }
};


/**
 * @inheritDoc
 */
os.command.InvertSelect.prototype.revert = function() {
  this.state = os.command.State.REVERTING;
  this.invert_();
  this.state = os.command.State.READY;
  return true;
};
