goog.declareModuleId('plugin.basemap.BaseMapDescriptor');

import LayerSyncDescriptor from '../../os/data/layersyncdescriptor.js';
import {PROJECTION} from '../../os/map/map.js';
import Icons from '../../os/ui/icons.js';
import {ID, LAYER_TYPE} from './basemap.js';

const googObject = goog.require('goog.object');


/**
 * A descriptor for a base map (or "Map Layer")
 *
 * @see {@link BaseMapPlugin} for configuration instructions
 */
export default class BaseMapDescriptor extends LayerSyncDescriptor {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {boolean}
     * @private
     */
    this.canDelete_ = true;

    /**
     * @type {Object.<string, *>}
     * @private
     */
    this.origConf_ = null;

    this.setTags(['GEOINT']);
    this.setType(LAYER_TYPE);
    this.descriptorType = ID;
  }

  /**
   * @param {!Object.<string, *>} value
   */
  setConfig(value) {
    this.origConf_ = value;

    // Layer type override from the base map config
    if (value['layerType']) {
      this.setType(/** @type {string} */ (value['layerType']));
    }
  }

  /**
   * @inheritDoc
   */
  getIcons() {
    return Icons.TILES;
  }

  /**
   * Whether or not this map layer descriptor can be deleted by the user
   *
   * @return {boolean}
   */
  canDelete() {
    return this.canDelete_;
  }

  /**
   * Sets whether the user can delete this map layer or not
   *
   * @param {boolean} value The value
   */
  setCanDelete(value) {
    this.canDelete_ = value;
  }

  /**
   * @inheritDoc
   */
  getSearchType() {
    return 'Map Layer';
  }

  /**
   * @inheritDoc
   */
  getLayerOptions() {
    var options = googObject.clone(this.origConf_);

    options['id'] = this.getId();
    options['provider'] = this.getProvider();
    options['animate'] = false;
    options['title'] = this.getTitle();
    options['layerType'] = this.getType();
    options['tags'] = this.getTags();
    options['noClear'] = true;
    options['cacheSize'] = 100;

    return options;
  }

  /**
   * @inheritDoc
   */
  getProvider() {
    if (this.origConf_ && 'provider' in this.origConf_) {
      return /** @type {?string} */ (this.origConf_['provider']);
    }

    return super.getProvider();
  }

  /**
   * Basemaps need to be more careful about their initial restoration. It's possible for a basemap to have been active in
   * a different projection from the one the application is currently in, causing the application to  immediately
   * try to switch projections upon loading. This works around that problem.
   *
   * @override
   */
  updateActiveFromTemp() {
    if (this.getLayerOptions()['projection'] === PROJECTION.getCode() && this.tempActive === true) {
      this.setActive(this.tempActive);
    }

    // unset temp active. It should only run once at load.
    this.tempActive = undefined;
  }

  /**
   * @inheritDoc
   */
  persist(opt_obj) {
    if (!opt_obj) {
      opt_obj = {};
    }

    opt_obj['canDelete'] = this.canDelete();
    opt_obj['origConf'] = this.origConf_;

    return super.persist(opt_obj);
  }

  /**
   * @inheritDoc
   */
  restore(from) {
    super.restore(from);

    this.origConf_ = from['origConf'];
    this.setCanDelete(from['canDelete']);

    if (!this.canDelete_ && isNaN(this.getDeleteTime())) {
      this.setDeleteTime(Date.now() + 24 * 60 * 60 * 1000);
    }
  }
}
