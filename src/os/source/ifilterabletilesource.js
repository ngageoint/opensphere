goog.module('os.source.IFilterableTileSource');
goog.module.declareLegacyNamespace();

const {TileFilterFn} = goog.requireType('os.tile');


/**
 * Interface for tile layers that support applying filters to their image tiles.
 *
 * @interface
 */
class IFilterableTileSource {
  /**
   * Adds a tile filter function to the source.
   * @param {TileFilterFn} fn
   */
  addTileFilter(fn) {}

  /**
   * Removes a tile filter function from the source.
   * @param {TileFilterFn} fn
   */
  removeTileFilter(fn) {}

  /**
   * Gets the set of tile filters.
   * @return {Array<TileFilterFn>}
   */
  getTileFilters() {}

  /**
   * Resets the tile filter on every cached tile in the source. Then forces a rerender of the map to reapply the filters.
   */
  applyTileFilters() {}
}

/**
 * ID for {@see os.implements}
 * @const {string}
 */
IFilterableTileSource.ID = 'os.source.IFilterableTileSource';

exports = IFilterableTileSource;
