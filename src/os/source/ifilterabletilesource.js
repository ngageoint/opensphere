goog.provide('os.source.IFilterableTileSource');
goog.require('os.tile');



/**
 * Interface for tile layers that support applying filters to their image tiles.
 * @interface
 */
os.source.IFilterableTileSource = function() {};


/**
 * ID for {@see os.implements}
 * @const {string}
 */
os.source.IFilterableTileSource.ID = 'os.source.IFilterableTileSource';


/**
 * Adds a tile filter function to the source.
 * @param {os.tile.TileFilterFn} fn
 */
os.source.IFilterableTileSource.prototype.addTileFilter;


/**
 * Removes a tile filter function from the source.
 * @param {os.tile.TileFilterFn} fn
 */
os.source.IFilterableTileSource.prototype.removeTileFilter;


/**
 * Gets the set of tile filters.
 * @return {Array<os.tile.TileFilterFn>}
 */
os.source.IFilterableTileSource.prototype.getTileFilters;


/**
 * Resets the tile filter on every cached tile in the source. Then forces a rerender of the map to reapply the filters.
 */
os.source.IFilterableTileSource.prototype.applyTileFilters;
