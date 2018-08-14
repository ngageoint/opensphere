goog.provide('os.ui.query.cmd.AreaModify');
goog.require('os.command.ICommand');
goog.require('os.ol.feature');
goog.require('os.ui.query.cmd.AbstractArea');



/**
 * Command for modifying an area
 * @param {!ol.Feature} area
 * @param {!ol.geom.Geometry} geometry
 * @implements {os.command.ICommand}
 * @extends {os.ui.query.cmd.AbstractArea}
 * @constructor
 */
os.ui.query.cmd.AreaModify = function(area, geometry) {
  os.ui.query.cmd.AreaModify.base(this, 'constructor', area);

  /**
   * @type {ol.geom.Geometry|undefined}
   * @protected
   */
  this.newGeometry = undefined;

  /**
   * @type {ol.geom.Geometry|undefined}
   * @protected
   */
  this.oldGeometry = undefined;

  // this will prevent the command from executing if the area isn't in the query manager already
  if (os.ui.areaManager.get(area)) {
    this.newGeometry = geometry;
    this.oldGeometry = area.getGeometry();
  }

  this.title = 'Modify area';
  if (area) {
    var areaTitle = area.get('title');
    if (areaTitle) {
      this.title += ' "' + areaTitle + '"';
    }
  }
};
goog.inherits(os.ui.query.cmd.AreaModify, os.ui.query.cmd.AbstractArea);


/**
 * @inheritDoc
 */
os.ui.query.cmd.AreaModify.prototype.execute = function() {
  if (this.canExecute()) {
    this.state = os.command.State.EXECUTING;

    // update the geometry and re-add the area to trigger a refresh
    this.area.setGeometry(this.newGeometry);
    os.ui.areaManager.remove(this.area);
    os.ui.areaManager.add(this.area);

    this.state = os.command.State.SUCCESS;
    return true;
  }

  return false;
};


/**
 * @inheritDoc
 */
os.ui.query.cmd.AreaModify.prototype.revert = function() {
  this.state = os.command.State.REVERTING;

  // revert to the original geometry and re-add the area to trigger a refresh
  this.area.setGeometry(this.oldGeometry);
  os.ui.areaManager.remove(this.area);
  os.ui.areaManager.add(this.area);

  this.state = os.command.State.READY;
  return true;
};


/**
 * @inheritDoc
 */
os.ui.query.cmd.AreaModify.prototype.canExecute = function() {
  if (!this.oldGeometry) {
    this.details = 'Original area unknown.';
    return false;
  }

  if (!this.newGeometry) {
    this.details = 'No new area provided.';
    return false;
  }

  return os.ui.query.cmd.AreaModify.base(this, 'canExecute');
};

