goog.provide('os.command.AreaToggle');

goog.require('os.command.ICommand');
goog.require('os.ui.query.cmd.AbstractArea');



/**
 * Command for toggling an area
 * @param {!ol.Feature} area
 * @param {boolean} show
 * @implements {os.command.ICommand}
 * @extends {os.ui.query.cmd.AbstractArea}
 * @constructor
 */
os.command.AreaToggle = function(area, show) {
  os.command.AreaToggle.base(this, 'constructor', area);

  /**
   * @type {boolean}
   * @private
   */
  this.show_ = show;
  this.title = 'Toggle area' + ' ' + (show ? 'on' : 'off');
};
goog.inherits(os.command.AreaToggle, os.ui.query.cmd.AbstractArea);


/**
 * @inheritDoc
 */
os.command.AreaToggle.prototype.execute = function() {
  if (this.canExecute()) {
    this.state = os.command.State.EXECUTING;
    var am = os.ui.areaManager;

    am.toggle(this.area, this.show_);

    this.state = os.command.State.SUCCESS;
    return true;
  }

  return false;
};


/**
 * @inheritDoc
 */
os.command.AreaToggle.prototype.revert = function() {
  this.state = os.command.State.REVERTING;
  var am = os.ui.areaManager;

  am.toggle(this.area, !this.show_);

  this.state = os.command.State.READY;
  return true;
};


