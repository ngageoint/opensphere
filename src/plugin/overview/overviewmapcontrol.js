goog.declareModuleId('plugin.overview.OverviewMap');

import OLOverviewMap from 'ol/src/control/OverviewMap.js';
import MapProperty from 'ol/src/MapProperty.js';
import View from 'ol/src/View.js';

import Settings from '../../os/config/settings.js';
import * as osMap from '../../os/map/map.js';
import MapContainer from '../../os/mapcontainer.js';

/**
 * Overview map control.
 */
export default class OverviewMap extends OLOverviewMap {
  /**
   * Constructor.
   * @param {olx.control.OverviewMapOptions=} opt_opts
   * @suppress {accessControls} To allow access to box overlay.
   */
  constructor(opt_opts) {
    const view = new View({
      projection: osMap.PROJECTION,
      minZoom: osMap.OVERVIEW_MAP_MIN_ZOOM,
      maxZoom: osMap.MAX_ZOOM,
      center: [0, 0],
      showFullExtent: true
    });

    opt_opts.view = view;
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
    } else {
      super.handleMapPropertyChange_(evt);
    }
  }

  /**
   * Updates the view with the current projection
   *
   * @suppress {accessControls} To allow replacing the resolution constraint function.
   * @private
   */
  updateView_() {
    var view = new View({
      projection: osMap.PROJECTION,
      minZoom: osMap.OVERVIEW_MAP_MIN_ZOOM,
      maxZoom: osMap.MAX_ZOOM,
      center: [0, 0],
      showFullExtent: true
    });

    // Don't contrain the view resolution for the overview map. This improves overview map behavior when fitting the
    // view to the current map extent. Without this, small changes in rotation can drastically change the resolution
    // which makes the overmap appear jumpy. This is especially prevalent in the 3D view.
    const minResolution = view.getMinResolution();
    const maxResolution = view.getMaxResolution();
    view.constraints_.resolution = (resolution) => Math.max(minResolution, Math.min(maxResolution, resolution));

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
