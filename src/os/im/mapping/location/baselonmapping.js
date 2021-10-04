goog.declareModuleId('os.im.mapping.location.BaseLonMapping');

import {parseLon} from '../../../geo/geo.js';
import AbstractBaseLatOrLonMapping from './abstractbaselatorlonmapping.js';


/**
 * @extends {AbstractBaseLatOrLonMapping<T, S>}
 * @template T, S
 */
export default class BaseLonMapping extends AbstractBaseLatOrLonMapping {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {string}
     * @protected
     */
    this.coordField = 'LON';

    /**
     * @type {string}
     * @protected
     */
    this.type = BaseLonMapping.ID;

    /**
     * @type {RegExp}
     * @protected
     */
    this.regex = BaseLonMapping.LON_REGEX;

    /**
     * @type {Function}
     * @protected
     */
    this.parseFn = parseLon;
  }
}

/**
 * @type {string}
 */
BaseLonMapping.ID = 'Longitude';

/**
 * @type {RegExp}
 */
BaseLonMapping.LON_REGEX = /lon(g(i(t(u(d(e)?)?)?)?)?)?\b/i;
