goog.provide('os.command.SwitchView');

goog.require('ol.View');
goog.require('ol.proj');
goog.require('os.command.ICommand');
goog.require('os.command.State');
goog.require('os.map');
goog.require('os.proj');



/**
 * Abstract command for performing selections on a source
 * @implements {os.command.ICommand}
 * @param {!ol.ProjectionLike} projection
 * @constructor
 */
os.command.SwitchView = function(projection) {
  /**
   * @type {!ol.proj.Projection}
   * @protected
   */
  this.oldProjection = /** @type {!ol.proj.Projection} */ (os.map.PROJECTION);

  /**
   * @type {!ol.proj.Projection}
   * @protected
   */
  this.newProjection = /** @type {!ol.proj.Projection} */ (ol.proj.get(projection));
};


/**
 * @inheritDoc
 */
os.command.SwitchView.prototype.state = os.command.State.READY;


/**
 * @inheritDoc
 */
os.command.SwitchView.prototype.isAsync = false;


/**
 * @inheritDoc
 */
os.command.SwitchView.prototype.title = 'Switch map view';


/**
 * @inheritDoc
 */
os.command.SwitchView.prototype.details = null;


/**
 * Checks if the command is ready to execute
 * @return {boolean}
 */
os.command.SwitchView.prototype.canExecute = function() {
  if (this.state !== os.command.State.READY) {
    this.details = 'Command not in ready state.';
    return false;
  }

  if (!this.oldProjection) {
    this.state = os.command.State.ERROR;
    this.details = 'Old projection is not defined';
    return false;
  }

  if (!this.newProjection) {
    this.state = os.command.State.ERROR;
    this.details = 'New projection is not defined';
    return false;
  }

  return true;
};


/**
 * @inheritDoc
 */
os.command.SwitchView.prototype.execute = function() {
  if (this.canExecute()) {
    this.state = os.command.State.EXECUTING;
    os.MapContainer.getInstance().setView(this.getView(this.newProjection));
    this.state = os.command.State.SUCCESS;
    return true;
  }

  return false;
};


/**
 * @param {!ol.proj.Projection} projection
 * @return {!ol.View}
 */
os.command.SwitchView.prototype.getView = function(projection) {
  var currentView = os.MapContainer.getInstance().getMap().getView();
  var center = currentView.getCenter();
  if (center) {
    center = ol.proj.transform(center, currentView.getProjection(), projection);
  }

  var resolution = currentView.getResolution();
  if (resolution) {
    var zoom = os.map.resolutionToZoom(resolution, os.map.PROJECTION);
  }

  os.map.PROJECTION = projection;
  os.map.TILEGRID = ol.tilegrid.createForProjection(
      os.map.PROJECTION, ol.DEFAULT_MAX_ZOOM, [512, 512]);
  os.map.MIN_RESOLUTION = os.map.zoomToResolution(os.map.MAX_ZOOM, os.map.PROJECTION);
  os.map.MAX_RESOLUTION = os.map.zoomToResolution(os.map.MIN_ZOOM, os.map.PROJECTION);

  os.settings.set(os.map.PROJECTION_KEY, os.map.PROJECTION.getCode());

  // check if the view position is valid
  if (center && !ol.extent.containsCoordinate(os.map.PROJECTION.getExtent(), center)) {
    center = undefined;
    zoom = undefined;
  }

  return new ol.View({
    projection: os.map.PROJECTION,
    center: center || [0, 0],
    zoom: zoom || os.map.DEFAULT_ZOOM,
    minZoom: os.map.MIN_ZOOM,
    maxZoom: os.map.MAX_ZOOM
  });
};


/**
 * @inheritDoc
 */
os.command.SwitchView.prototype.revert = function() {
  this.state = os.command.State.REVERTING;
  os.MapContainer.getInstance().getMap().setView(this.getView(this.oldProjection));
  this.state = os.command.State.READY;
  return true;
};
