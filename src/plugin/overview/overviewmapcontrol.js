goog.module('plugin.overview.OverviewMap');

const MapContainer = goog.require('os.MapContainer');
const Settings = goog.require('os.config.Settings');
const MapProperty = goog.require('ol.MapProperty');
const View = goog.require('ol.View');
const OLOverviewMap = goog.require('ol.control.OverviewMap');
const osMap = goog.require('os.map');

const Collection = goog.requireType('ol.Collection');
const LayerBase = goog.requireType('ol.layer.Base');


/**
 * Overview map control.
 */
class OverviewMap extends OLOverviewMap {
  /**
   * Constructor.
   * @param {olx.control.OverviewMapOptions=} opt_opts
   * @suppress {accessControls} To allow access to box overlay.
   */
  constructor(opt_opts) {
    super(opt_opts);
    this.updateView_();

    /* Interactive map in 3D mode */

    var endMoving = (event) => {
      var ovmap = this.getOverviewMap();
      var mapContainer = MapContainer.getInstance();
      if (mapContainer.is3DEnabled()) {
        var coordinates = ovmap.getEventCoordinate(event);

        mapContainer.flyTo(/** @type {!osx.map.FlyToOptions} */ ({
          center: coordinates
        }));
      }

      window.removeEventListener('mouseup', endMoving);
    };

    this.boxOverlay_.getElement().addEventListener('mousedown', function() {
      window.addEventListener('mouseup', endMoving);
    });
  }

  /**
   * @return {Collection<LayerBase>}
   */
  getLayers() {
    var ovmap = this.getOverviewMap();
    return ovmap ? ovmap.getLayers() : null;
  }

  /**
   * @inheritDoc
   * @suppress {accessControls} To allow extending private function.
   */
  handleMapPropertyChange_(evt) {
    if (evt.key === MapProperty.VIEW) {
      this.updateView_();
    }

    super.handleMapPropertyChange_(evt);
  }

  /**
   * Updates the view with the current projection
   *
   * @private
   */
  updateView_() {
    var view = new View({
      projection: osMap.PROJECTION,
      minZoom: osMap.MIN_ZOOM,
      maxZoom: osMap.MAX_ZOOM
    });

    if (this.getMap()) {
      var mainView = this.getMap().getView();

      if (mainView) {
        view.setCenter(mainView.getCenter());
        view.setResolution(mainView.getResolution());
      }
    }

    var ovmap = this.getOverviewMap();
    if (ovmap) {
      ovmap.setView(view);
    }
  }

  /**
   * @inheritDoc
   * @suppress {accessControls} To allow extending private function.
   */
  handleClick_(event) {
    super.handleClick_(event);
    Settings.getInstance().set(OverviewMap.SHOW_KEY, this.getCollapsed());
  }
}


/**
 * @type {!Array<string>}
 * @const
 */
OverviewMap.SHOW_KEY = ['overview', 'show'];


exports = OverviewMap;
