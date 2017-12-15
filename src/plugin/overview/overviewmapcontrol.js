goog.provide('plugin.overview.OverviewMap');

goog.require('ol.MapProperty');
goog.require('ol.View');
goog.require('ol.control.OverviewMap');
goog.require('os.map');



/**
 * @param {olx.control.OverviewMapOptions=} opt_opts
 * @extends {ol.control.OverviewMap}
 * @constructor
 *
 * @suppress {accessControls} To allow access to the box overlay.
 */
plugin.overview.OverviewMap = function(opt_opts) {
  plugin.overview.OverviewMap.base(this, 'constructor', opt_opts);
  this.updateView_();

  /* Interactive map in 3D mode */

  var ovmap = this.ovmap_;
  var endMoving = function(event) {
    var mapContainer = os.MapContainer.getInstance();
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
};
goog.inherits(plugin.overview.OverviewMap, ol.control.OverviewMap);


/**
 * @type {!Array<string>}
 * @const
 */
plugin.overview.OverviewMap.SHOW_KEY = ['overview', 'show'];


/**
 * @return {ol.Collection<ol.layer.Base>}
 * @suppress {accessControls}
 */
plugin.overview.OverviewMap.prototype.getLayers = function() {
  return this.ovmap_.getLayers();
};


/**
 * @inheritDoc
 * @suppress {accessControls}
 */
plugin.overview.OverviewMap.prototype.handleMapPropertyChange_ = function(evt) {
  if (evt.key === ol.MapProperty.VIEW) {
    this.updateView_();
  }

  plugin.overview.OverviewMap.base(this, 'handleMapPropertyChange_', evt);
};


/**
 * Updates the view with the current projection
 * @private
 * @suppress {accessControls}
 */
plugin.overview.OverviewMap.prototype.updateView_ = function() {
  var view = new ol.View({
    projection: os.map.PROJECTION,
    minZoom: os.map.MIN_ZOOM,
    maxZoom: os.map.MAX_ZOOM
  });

  if (this.getMap()) {
    var mainView = this.getMap().getView();

    if (mainView) {
      view.setCenter(mainView.getCenter());
      view.setResolution(mainView.getResolution());
    }
  }

  this.ovmap_.setView(view);
};


/**
 * @inheritDoc
 * @suppress {accessControls}
 */
plugin.overview.OverviewMap.prototype.handleClick_ = function(event) {
  plugin.overview.OverviewMap.base(this, 'handleClick_', event);
  os.settings.set(plugin.overview.OverviewMap.SHOW_KEY, this.getCollapsed());
};
