goog.provide('os.command.AbstractSource');
goog.require('os.command.ICommand');
goog.require('os.command.State');
goog.require('os.data.OSDataManager');
goog.require('os.source.ISource');



/**
 * Abstract command for interaction with sources
 * @constructor
 * @implements {os.command.ICommand}
 * @param {!string} sourceId
 */
os.command.AbstractSource = function(sourceId) {
  /**
   * @type {!string}
   * @protected
   */
  this.sourceId = sourceId;

  /**
   * @type {!os.command.State}
   */
  this.state = os.command.State.READY;
};


/**
 * @return {?os.source.ISource} The source
 */
os.command.AbstractSource.prototype.getSource = function() {
  return os.osDataManager.getSource(this.sourceId);
};


/**
 * @inheritDoc
 */
os.command.AbstractSource.prototype.isAsync = false;


/**
 * @inheritDoc
 */
os.command.AbstractSource.prototype.execute = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.command.AbstractSource.prototype.revert = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.command.AbstractSource.prototype.title = 'Source';


/**
 * @inheritDoc
 */
os.command.AbstractSource.prototype.details = null;


/**
 * Checks if the command is ready to execute.
 * @return {boolean}
 */
os.command.AbstractSource.prototype.canExecute = function() {
  if (this.state !== os.command.State.READY) {
    this.details = 'Command not in ready state.';
    return false;
  }

  var source = this.getSource();
  if (!source) {
    this.state = os.command.State.ERROR;
    this.details = 'Data source "' + this.sourceId + '" does not exist';
    return false;
  }

  return true;
};


