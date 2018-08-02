goog.provide('os.ui.query.cmd.AbstractArea');
goog.require('goog.Disposable');
goog.require('ol.Feature');
goog.require('os.command.ICommand');
goog.require('os.command.State');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.ui.query.AreaManager');



/**
 * Abstract command for adding/removing area
 * @param {!ol.Feature} area
 * @implements {os.command.ICommand}
 * @extends {goog.Disposable}
 * @constructor
 */
os.ui.query.cmd.AbstractArea = function(area) {
  os.ui.query.cmd.AbstractArea.base(this, 'constructor');

  /**
   * @type {!ol.Feature}
   * @protected
   */
  this.area = area;

  var qm = os.ui.queryManager;

  /**
   * @type {!Array<Object<string, string|boolean>>}
   * @protected
   */
  this.entries = area.getId() ? qm.getEntries(null, /** @type {string} */ (area.getId())) : [];

  /**
   * @type {boolean}
   * @protected
   */
  this.include = qm.isInclusion(area);

  /**
   * @type {boolean}
   * @protected
   */
  this.exclude = qm.isExclusion(area);

  /**
   * @type {boolean}
   * @protected
   */
  this.append = true;
};
goog.inherits(os.ui.query.cmd.AbstractArea, goog.Disposable);


/**
 * @inheritDoc
 */
os.ui.query.cmd.AbstractArea.prototype.isAsync = false;


/**
 * @inheritDoc
 */
os.ui.query.cmd.AbstractArea.prototype.title = 'Add/Remove Area';


/**
 * @inheritDoc
 */
os.ui.query.cmd.AbstractArea.prototype.details = null;


/**
 * @inheritDoc
 */
os.ui.query.cmd.AbstractArea.prototype.state = os.command.State.READY;


/**
 * @inheritDoc
 */
os.ui.query.cmd.AbstractArea.prototype.execute = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.ui.query.cmd.AbstractArea.prototype.revert = goog.abstractMethod;


/**
 * Checks if the command is ready to execute.
 * @return {boolean}
 */
os.ui.query.cmd.AbstractArea.prototype.canExecute = function() {
  if (this.state !== os.command.State.READY) {
    this.details = 'Command not in ready state.';
    return false;
  }

  if (!this.area) {
    this.details = 'No area provided.';
    return false;
  }

  return true;
};
