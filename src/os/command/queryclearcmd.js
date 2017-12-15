goog.provide('os.command.QueryClear');
goog.require('os.command.ICommand');
goog.require('os.command.State');



/**
 * Command for clearing spatial queries on the map.
 * @implements {os.command.ICommand}
 * @constructor
 */
os.command.QueryClear = function() {
  /**
   * @type {!Object<number|string|undefined, boolean>}
   * @private
   */
  this.ids_ = {};

  /**
   * @type {boolean}
   * @protected
   */
  this.value = true;
};


/**
 * @inheritDoc
 */
os.command.QueryClear.prototype.isAsync = false;


/**
 * @inheritDoc
 */
os.command.QueryClear.prototype.title = 'Clear query areas';


/**
 * @inheritDoc
 */
os.command.QueryClear.prototype.details = null;


/**
 * @inheritDoc
 */
os.command.QueryClear.prototype.state = os.command.State.READY;


/**
 * @inheritDoc
 */
os.command.QueryClear.prototype.execute = function() {
  this.state = os.command.State.EXECUTING;
  var am = os.query.AreaManager.getInstance();
  var list = am.getAll();

  for (var i = 0, n = list.length; i < n; i++) {
    if (list[i].get('shown')) {
      this.ids_[list[i].getId()] = true;
      am.toggle(list[i], false);
    }
  }

  this.state = os.command.State.SUCCESS;
  return true;
};


/**
 * @inheritDoc
 */
os.command.QueryClear.prototype.revert = function() {
  this.state = os.command.State.REVERTING;

  var am = os.query.AreaManager.getInstance();
  var list = am.getAll();

  for (var i = 0, n = list.length; i < n; i++) {
    if (list[i].getId() in this.ids_) {
      am.toggle(list[i], true);
    }
  }

  this.ids_ = {};
  this.state = os.command.State.READY;
  return true;
};
