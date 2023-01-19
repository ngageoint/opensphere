goog.declareModuleId('plugin.cesium.ImageryProvider');

import EventType from 'ol/src/events/EventType.js';
import {listen, unlistenByKey} from 'ol/src/events.js';
import ImageTile from 'ol/src/ImageTile.js';
import VectorTile from 'ol/src/source/VectorTile.js';
import {DEFAULT_MAX_ZOOM} from 'ol/src/tilegrid/common.js';
import {createXYZ} from 'ol/src/tilegrid.js';
import TileState from 'ol/src/TileState.js';
import VectorImageTile from 'ol/src/VectorRenderTile.js';
import OLImageryProvider from 'ol-cesium/src/olcs/core/OLImageryProvider.js';
import olcsUtil from 'ol-cesium/src/olcs/util.js';


import '../../os/mixin/vectorimagetilemixin.js';
import TileGridTilingScheme from './tilegridtilingscheme.js';

const IDisposable = goog.requireType('goog.disposable.IDisposable');

/**
 * @implements {IDisposable}
 *
 * @suppress {invalidCasts}
 */
export default class ImageryProvider extends OLImageryProvider {
  /**
   * Constructor.
   * @param {!TileSource} source
   * @param {?Layer} layer
   * @param {Projection=} opt_fallbackProj Projection to assume if the projection of the source is not defined.
   */
  constructor(source, layer, opt_fallbackProj) {
    super(layer, source, opt_fallbackProj);

    /**
     * @type {boolean}
     * @private
     */
    this.disposed_ = false;

    /**
     * @type {?Layer}
     * @private
     */
    this.layer_ = layer;
  }

  /**
   * @inheritDoc
   */
  dispose() {
    this.disposed_ = true;
  }

  /**
   * @inheritDoc
   */
  isDisposed() {
    return this.disposed_;
  }

  /**
   * @inheritDoc
   * @suppress {accessControls}
   */
  handleSourceChanged_() {
    if (!this.ready_ && this.source_.getState() == 'ready') {
      this.projection_ = olcsUtil.getSourceProjection(this.source_) || this.fallbackProj_;

      if (this.source_ instanceof VectorTile) {
        // For vector tiles, create a copy of the tile grid with min/max zoom covering all levels. This ensures Cesium
        // will render tiles at all levels.
        const sourceTileGrid = this.source_.getTileGrid();
        const tileGrid = createXYZ({
          extent: sourceTileGrid.getExtent(),
          maxZoom: DEFAULT_MAX_ZOOM,
          minZoom: 0,
          tileSize: sourceTileGrid.getTileSize()
        });

        this.tilingScheme_ = new TileGridTilingScheme(this.source_, tileGrid);
      } else {
        this.tilingScheme_ = new TileGridTilingScheme(this.source_);
      }

      this.rectangle_ = this.tilingScheme_.rectangle;
      this.ready_ = true;
    }
  }

  /**
   * @override
   * @suppress {accessControls}
   * @export
   */
  requestImage(x, y, level) {
    var z_ = level;
    var y_ = y;

    var deferred = Cesium.when.defer();

    // If the source doesn't have tiles at the current level, return an empty canvas.
    if (!(this.source_ instanceof VectorTile)) {
      var tilegrid = this.source_.getTileGridForProjection(this.projection_);

      if (z_ < tilegrid.getMinZoom() - 1 || z_ > tilegrid.getMaxZoom()) {
        deferred.resolve(this.emptyCanvas_); // no data
        return deferred.promise;
      }
    }

    var tile = this.source_.getTile(z_, x, y_, 1, this.projection_);
    var state = tile.getState();

    if (state === TileState.EMPTY) {
      deferred.resolve(this.emptyCanvas_);
    } else if (state === TileState.LOADED) {
      if (tile instanceof ImageTile) {
        deferred.resolve(tile.getImage());
      } else if (tile instanceof VectorImageTile) {
        deferred.resolve(tile.getDrawnImage(this.layer_));
      }
    } else if (state === TileState.ERROR) {
      deferred.resolve(this.emptyCanvas_);
    } else {
      tile.load();

      var layer = this.layer_;
      var unlisten = listen(tile, EventType.CHANGE, function() {
        var state = tile.getState();
        if (state === TileState.EMPTY) {
          deferred.resolve(this.emptyCanvas_);
          unlistenByKey(unlisten);
        } else if (state === TileState.LOADED) {
          if (tile instanceof ImageTile) {
            deferred.resolve(tile.getImage());
          } else if (tile instanceof VectorImageTile) {
            deferred.resolve(tile.getDrawnImage(layer));
          }
          unlistenByKey(unlisten);
        } else if (state === TileState.ERROR) {
          deferred.resolve(this.emptyCanvas_);
          unlistenByKey(unlisten);
        }
      });
    }

    return deferred.promise;
  }

  /**
   * @inheritDoc
   * @suppress {accessControls}
   */
  get maximumLevel() {
    // Vector tiles can be rendered at all zoom levels using data from other levels.
    if (!(this.source_ instanceof VectorTile)) {
      const tg = this.source_.getTileGrid();
      return tg ? tg.getMaxZoom() : 18;
    }
    return DEFAULT_MAX_ZOOM;
  }

  /**
   * @inheritDoc
   */
  get minimumLevel() {
    // apparently level 0 tiles look like garbage and we're just gonna pass on those
    return 1;
  }

  /**
   * @inheritDoc
   * @suppress {accessControls}
   */
  get tileWidth() {
    var tg = this.source_.getTileGrid();
    if (tg) {
      var tileSize = tg.getTileSize(tg.getMinZoom());
      return Array.isArray(tileSize) ? tileSize[0] : tileSize;
    }
    return 256;
  }

  /**
   * @inheritDoc
   * @suppress {accessControls}
   */
  get tileHeight() {
    var tg = this.source_.getTileGrid();
    if (tg) {
      var tileSize = tg.getTileSize(tg.getMinZoom());
      return Array.isArray(tileSize) ? tileSize[1] : tileSize;
    }
    return 256;
  }

  /**
   * @inheritDoc
   */
  getTileCredits(x, y, level) {
    let text = '';
    let attributions = this.source_.getAttributions();
    if (typeof attributions === 'function') {
      attributions = attributions();
    }
    if (attributions) {
      attributions.forEach((htmlOrAttr) => {
        const html = typeof htmlOrAttr === 'string' ? htmlOrAttr : htmlOrAttr.getHTML();
        text += html;
      });
    }

    return text.length > 0 ? new Cesium.Credit(text, true) : null;
  }
}
