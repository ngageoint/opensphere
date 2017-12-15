goog.provide('os.ui.query.cmd.AreaRemove');

goog.require('os.command.ICommand');
goog.require('os.ui.query.cmd.AbstractArea');



/**
 * Command for removing an area
 * @param {!ol.Feature} area
 * @implements {os.command.ICommand}
 * @extends {os.ui.query.cmd.AbstractArea}
 * @constructor
 */
os.ui.query.cmd.AreaRemove = function(area) {
  os.ui.query.cmd.AreaRemove.base(this, 'constructor', area);
  this.title = 'Remove area';

  if (area) {
    var areaTitle = area.get('title');
    if (areaTitle) {
      this.title += ' "' + areaTitle + '"';
    }
  }
};
goog.inherits(os.ui.query.cmd.AreaRemove, os.ui.query.cmd.AbstractArea);


/**
 * @inheritDoc
 */
os.ui.query.cmd.AreaRemove.prototype.execute = function() {
  if (this.canExecute()) {
    this.state = os.command.State.EXECUTING;

    var am = os.ui.areaManager;
    var qm = os.ui.queryManager;

    if (this.entries) {
      qm.removeEntriesArr(this.entries);
    }

    am.remove(this.area);

    this.state = os.command.State.SUCCESS;
    return true;
  }

  return false;
};


/**
 * @inheritDoc
 */
os.ui.query.cmd.AreaRemove.prototype.revert = function() {
  this.state = os.command.State.REVERTING;

  var am = os.ui.areaManager;
  var qm = os.ui.queryManager;

  am.add(this.area);
  qm.addEntries(this.entries);

  this.state = os.command.State.READY;
  return true;
};

