goog.module('os.command.SwitchView');
goog.module.declareLegacyNamespace();

const {DEFAULT_MAX_ZOOM} = goog.require('ol');
const View = goog.require('ol.View');
const olExtent = goog.require('ol.extent');
const olProj = goog.require('ol.proj');
const tilegrid = goog.require('ol.tilegrid');
const State = goog.require('os.command.State');
const Settings = goog.require('os.config.Settings');
const osMap = goog.require('os.map');
const {getMapContainer} = goog.require('os.map.instance');

const ICommand = goog.requireType('os.command.ICommand');


/**
 * Abstract command for performing selections on a source
 *
 * @implements {ICommand}
 */
class SwitchView {
  /**
   * Constructor.
   * @param {!ol.ProjectionLike} projection
   */
  constructor(projection) {
    /**
     * @inheritDoc
     */
    this.state = State.READY;

    /**
     * @inheritDoc
     */
    this.isAsync = false;

    /**
     * @inheritDoc
     */
    this.title = 'Switch map view';

    /**
     * @inheritDoc
     */
    this.details = null;

    /**
     * @type {!olProj.Projection}
     * @protected
     */
    this.oldProjection = /** @type {!olProj.Projection} */ (osMap.PROJECTION);

    /**
     * @type {!olProj.Projection}
     * @protected
     */
    this.newProjection = /** @type {!olProj.Projection} */ (olProj.get(projection));
  }

  /**
   * Checks if the command is ready to execute
   *
   * @return {boolean}
   */
  canExecute() {
    if (this.state !== State.READY) {
      this.details = 'Command not in ready state.';
      return false;
    }

    if (!this.oldProjection) {
      this.state = State.ERROR;
      this.details = 'Old projection is not defined';
      return false;
    }

    if (!this.newProjection) {
      this.state = State.ERROR;
      this.details = 'New projection is not defined';
      return false;
    }

    return true;
  }

  /**
   * @inheritDoc
   */
  execute() {
    if (this.canExecute()) {
      this.state = State.EXECUTING;
      getMapContainer().setView(this.getView(this.newProjection));
      this.state = State.SUCCESS;
      return true;
    }

    return false;
  }

  /**
   * @param {!olProj.Projection} projection
   * @return {!View}
   */
  getView(projection) {
    var currentView = getMapContainer().getMap().getView();
    var center = currentView.getCenter();
    if (center) {
      center = olProj.transform(center, currentView.getProjection(), projection);
    }

    var resolution = currentView.getResolution();
    if (resolution) {
      var zoom = osMap.resolutionToZoom(resolution, osMap.PROJECTION);
    }

    osMap.setProjection(projection);
    osMap.setTileGrid(tilegrid.createForProjection(osMap.PROJECTION, DEFAULT_MAX_ZOOM, [512, 512]));
    osMap.setMinResolution(osMap.zoomToResolution(osMap.MAX_ZOOM, osMap.PROJECTION));
    osMap.setMaxResolution(osMap.zoomToResolution(osMap.MIN_ZOOM, osMap.PROJECTION));

    Settings.getInstance().set(osMap.PROJECTION_KEY, osMap.PROJECTION.getCode());

    // check if the view position is valid
    if (center && !olExtent.containsCoordinate(osMap.PROJECTION.getExtent(), center)) {
      center = undefined;
      zoom = undefined;
    }

    return new View({
      projection: osMap.PROJECTION,
      center: center || [0, 0],
      zoom: zoom || osMap.DEFAULT_ZOOM,
      minZoom: osMap.MIN_ZOOM,
      maxZoom: osMap.MAX_ZOOM
    });
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = State.REVERTING;
    getMapContainer().getMap().setView(this.getView(this.oldProjection));
    this.state = State.READY;
    return true;
  }
}

exports = SwitchView;
