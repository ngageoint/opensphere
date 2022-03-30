goog.declareModuleId('os.mixin.UrlTileSource');

import {listen, unlistenByKey} from 'ol/src/events.js';
import {intersects} from 'ol/src/extent.js';
import Tile from 'ol/src/source/Tile.js';
import TileEventType from 'ol/src/source/TileEventType.js';
import UrlTile from 'ol/src/source/UrlTile.js';

import {alertAuth} from '../auth.js';
import Settings from '../config/settings.js';
import PropertyChangeEvent from '../events/propertychangeevent.js';
import osImplements from '../implements.js';
import ILoadingSource from '../ol/source/iloadingsource.js';
import IUrlSource from '../ol/source/iurlsource.js';
import PropertyChange from '../source/propertychange.js';
import {RefreshTimers} from '../source/source.js';

const Timer = goog.require('goog.Timer');
const Uri = goog.require('goog.Uri');
const Delay = goog.require('goog.async.Delay');


// add support for providing custom URL parameters
osImplements(UrlTile, IUrlSource.ID);
osImplements(UrlTile, ILoadingSource.ID);


/*
 * We need tile layers to only load the tiles that intersect a given extent. OL3 provides an option for this
 * on the layer, but that clips the layer to the absolute extent and does not allow it to wrap. Instead, we
 * will provide an option to set the extent on the source and use a mixin to wrap the given TileURLFunction
 * and check the extent before continuing.
 *
 * This mixin also consolidates the logic necessary for the overall loading spinners for tile layers.
 */


/**
 * @type {boolean}
 */
UrlTile.prototype.tileUrlSet = false;


/**
 * @type {boolean}
 */
UrlTile.prototype.tileLoadSet = false;


/**
 * @type {?ol.Extent}
 */
UrlTile.prototype.extent = null;


/**
 * How often the source will automatically refresh itself.
 * @type {number}
 * @protected
 */
UrlTile.prototype.refreshInterval = 0;


/**
 * The delay used to auto refresh the source.
 * @type {Timer}
 * @protected
 */
UrlTile.prototype.refreshTimer = null;


/**
 * If the source can be refreshed.
 * @type {boolean}
 * @protected
 */
UrlTile.prototype.refreshEnabled = false;


/**
 * @return {?ol.Extent} The extent
 */
UrlTile.prototype.getExtent = function() {
  return this.extent;
};


/**
 * @param {?ol.Extent} extent The extent for the source. Must be in the same projection as the source.
 */
UrlTile.prototype.setExtent = function(extent) {
  this.extent = extent;
};


/**
 * Get the user-provided params, i.e. those passed to the constructor through
 * the "params" option, and possibly updated using the updateParams method.
 *
 * @return {Object} Params.
 */
UrlTile.prototype.getParams = function() {
  // by default, params are not supported. openlayers implements these functions in higher level sources.
  return null;
};


/**
 * Update the user-provided params.
 *
 * @param {Object} params Params.
 */
UrlTile.prototype.updateParams = function(params) {
  // by default, params are not supported. openlayers implements these functions in higher level sources.
};


/**
 * If the source can be refreshed.
 *
 * @return {boolean}
 */
UrlTile.prototype.isRefreshEnabled = function() {
  return this.refreshEnabled;
};


/**
 * Get the automatic refresh interval for the source.
 *
 * @return {number}
 */
UrlTile.prototype.getRefreshInterval = function() {
  return this.refreshInterval;
};


/**
 * Set the automatic refresh interval for the source.
 *
 * @param {number} value The new refresh interval, in seconds.
 */
UrlTile.prototype.setRefreshInterval = function(value) {
  if (this.refreshInterval != value) {
    this.refreshInterval = value;

    if (this.refreshTimer) {
      this.refreshTimer.unlisten(Timer.TICK, this.onRefreshTimer, false, this);
      if (!this.refreshTimer.hasListener()) {
        // nobody's listening, so stop it
        this.refreshTimer.stop();
      }
    }

    this.refreshTimer = null;

    if (this.refreshInterval > 0) {
      this.refreshTimer = RefreshTimers[value];

      if (!this.refreshTimer) {
        // didn't find one for that time, so make a new one and save it off
        this.refreshTimer = new Timer(1000 * value);
        RefreshTimers[value] = this.refreshTimer;
      }

      this.refreshTimer.listen(Timer.TICK, this.onRefreshTimer, false, this);
      this.refreshTimer.start();
    }

    this.dispatchEvent(new PropertyChangeEvent(PropertyChange.REFRESH_INTERVAL));
  }
};


/**
 * Refresh the source when the auto refresh delay fires.
 *
 * @protected
 */
UrlTile.prototype.onRefreshTimer = function() {
  if (this.isRefreshEnabled()) {
    this.refresh();
  }
};


/**
 * @inheritDoc
 */
UrlTile.prototype.refresh = function() {
  this.tileCache.clear();
  this.changed();
};


/**
 * @param {ol.TileUrlFunctionType} tileUrlFunction
 * @private
 */
UrlTile.prototype.setTileUrlFunctionInternal_ = UrlTile.prototype.setTileUrlFunction;


/**
 * @param {ol.TileUrlFunctionType} tileUrlFunction
 * @suppress {duplicate}
 */
UrlTile.prototype.setTileUrlFunction = function(tileUrlFunction) {
  this.tileUrlSet = true;
  var getExtent = this.getExtent.bind(this);
  var getTileGrid = this.getTileGrid.bind(this);

  this.setTileUrlFunctionInternal_(
      /**
       * @param {ol.TileCoord} tileCoord Tile Coordinate.
       * @param {number} pixelRatio Pixel ratio.
       * @param {ol.proj.Projection} projection Projection.
       * @return {string|undefined} Tile URL.
       */
      function(tileCoord, pixelRatio, projection) {
        var extent = getExtent();
        var intersectsTile = true;

        if (extent) {
          var tileGrid = getTileGrid();

          if (!tileGrid) {
            return undefined;
          }

          if (tileGrid.getResolutions().length <= tileCoord[0]) {
            return undefined;
          }

          var tileExtent = tileGrid.getTileCoordExtent(tileCoord);
          intersectsTile = intersects(extent, tileExtent);
        }

        return intersectsTile ? tileUrlFunction(tileCoord, pixelRatio, projection) : undefined;
      });
};


/**
 * @type {boolean}
 * @private
 */
UrlTile.prototype.loading_ = false;


/**
 * @type {number}
 * @private
 */
UrlTile.prototype.numLoadingTiles_ = 0;


/**
 * @type {number}
 * @private
 */
UrlTile.prototype.loadCount_ = 0;


/**
 * @type {number}
 * @private
 */
UrlTile.prototype.errorCount_ = 0;


/**
 * @type {boolean}
 * @private
 */
UrlTile.prototype.error_ = false;


/**
 * @type {?Array<ol.EventsKey>}
 * @private
 */
UrlTile.prototype.listenerKeys_ = null;


/**
 * Timer to prevent rapid firing loading events.
 * @type {?Delay}
 * @private
 */
UrlTile.prototype.loadingDelay_ = null;


/**
 * @inheritDoc
 */
UrlTile.prototype.disposeInternal = function() {
  Tile.prototype.disposeInternal.call(this);

  // remove any pending listeners
  if (this.listenerKeys_) {
    this.listenerKeys_.forEach(unlistenByKey);
    this.listenerKeys_.length = 0;
  }

  if (this.loadingDelay_) {
    this.loadingDelay_.dispose();
    this.loadingDelay_ = null;
  }

  if (this.tileCache) {
    // flush the image cache
    this.tileCache.clear();
  }
};


/**
 * @return {?Delay}
 * @protected
 */
UrlTile.prototype.getLoadingDelay = function() {
  if (!this.loadingDelay_ && !this.isDisposed()) {
    this.loadingDelay_ = new Delay(this.fireLoadingEvent_, 500, this);
  }

  return this.loadingDelay_;
};


/**
 * @return {boolean}
 */
UrlTile.prototype.isLoading = function() {
  return this.loading_;
};


/**
 * @param {boolean} value
 */
UrlTile.prototype.setLoading = function(value) {
  if (this.loading_ !== value) {
    this.loading_ = value;
    var delay = this.getLoadingDelay();

    if (delay) {
      if (this.loading_) {
        // always notify the UI when the layer starts loading
        delay.fire();
      } else {
        // add a delay when notifying the UI loading is complete in case it starts loading again soon. this prevents
        // flickering of the loading state, particularly when using Cesium.
        delay.start();
        this.numLoadingTiles_ = 0;
      }
    }
  }
};


/**
 * @return {boolean} True if this source has an error, false otherwise
 */
UrlTile.prototype.hasError = function() {
  return this.error_;
};


/**
 * Fires an event to indicate a loading change.
 *
 * @private
 */
UrlTile.prototype.fireLoadingEvent_ = function() {
  if (!this.isDisposed()) {
    if (this.loadCount_ || this.errorCount_) {
      this.error_ = this.errorCount_ / (this.loadCount_ + this.errorCount_) > /** @type {number} */ (
        Settings.getInstance().get('tileErrorThreshold', 0.6));

      this.errorCount_ = 0;
      this.loadCount_ = 0;
    }

    this.dispatchEvent(new PropertyChangeEvent('loading', this.loading_, !this.loading_));
  }
};


/**
 * Decrements loading
 */
UrlTile.prototype.decrementLoading = function() {
  this.numLoadingTiles_--;

  if (this.numLoadingTiles_ === 0) {
    this.setLoading(false);
  }
};


/**
 * Increments loading
 */
UrlTile.prototype.incrementLoading = function() {
  this.numLoadingTiles_++;

  if (this.numLoadingTiles_ === 1) {
    this.setLoading(true);
  }
};


/**
 * @param {ol.source.Tile.Event} evt
 * @private
 */
UrlTile.prototype.onImageLoadOrError_ = function(evt) {
  if (evt.type === TileEventType.TILELOADEND) {
    this.loadCount_++;
  } else {
    this.errorCount_++;

    // request failed, check if it's potentially due to a missing authentication with the server
    const urls = this.getUrls();
    if (urls) {
      urls.forEach((url) => {
        alertAuth(url);
      });
    }
  }

  this.decrementLoading();
};


/**
 * @param {ol.TileLoadFunctionType} tileLoadFunction
 * @private
 */
UrlTile.prototype.setTileLoadFunctionInternal_ = UrlTile.prototype.setTileLoadFunction;


/**
 * @param {ol.TileLoadFunctionType} tileLoadFunction
 * @suppress {duplicate}
 */
UrlTile.prototype.setTileLoadFunction = function(tileLoadFunction) {
  this.tileLoadSet = true;

  if (!this.listenerKeys_) {
    this.listenerKeys_ = [
      listen(this, TileEventType.TILELOADSTART, this.incrementLoading, this),
      listen(this, TileEventType.TILELOADEND, this.onImageLoadOrError_, this),
      listen(this, TileEventType.TILELOADERROR, this.onImageLoadOrError_, this)];
  }

  var scope = this;

  if (!this.loadingDelay_) {
    this.loadingDelay_ = new Delay(this.fireLoadingEvent_, 500, this);
  }

  this.setTileLoadFunctionInternal_(
      /**
       * @param {ol.Tile} tile
       * @param {string} source
       */
      function(tile, source) {
        if (scope.isRefreshEnabled() && scope.refreshInterval) {
          var uri = new Uri(source);
          var qd = uri.getQueryData();
          qd.set('_cd', Date.now());
          source = uri.toString();
        }

        tileLoadFunction(tile, source);
      });
};
