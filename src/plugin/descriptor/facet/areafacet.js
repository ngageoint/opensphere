goog.declareModuleId('plugin.descriptor.facet.Area');

import IAreaTest from '../../../os/data/iareatest.js';
import osImplements from '../../../os/implements.js';
import {getAreaManager} from '../../../os/query/queryinstance.js';
import BaseFacet from '../../../os/search/basefacet.js';

const Promise = goog.require('goog.Promise');

/**
 * @extends {BaseFacet<!IDataDescriptor>}
 */
export default class Area extends BaseFacet {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  transformsValue(category) {
    return category === 'Area';
  }

  /**
   * @inheritDoc
   */
  valueToLabel(value) {
    var area = getAreaManager().get(value);

    if (area) {
      return /** @type {string} */ (area.get('title'));
    }

    return value;
  }

  /**
   * @inheritDoc
   */
  load(item, facets) {
    return this.updateCache_(
        item,
        getAreaManager().getAll(),
        function(areaId) {
          BaseFacet.update('Area', areaId, facets);
        });
  }

  /**
   * @inheritDoc
   */
  test(item, facets, results) {
    var areaIds = facets['Area'];

    if (areaIds) {
      BaseFacet.updateResults('Area', results);

      var areas = getAreaManager().getAll();
      if (areas) {
        areas = areas.filter(function(area) {
          return areaIds.indexOf(/** @type {string} */ (area.getId())) > -1;
        });
      }

      return this.updateCache_(
          item,
          areas,
          function(areaId) {
            BaseFacet.updateResults('Area', results, 1);
          });
    }
  }

  /**
   * This is where the magic happens.
   *
   * @param {IDataDescriptor} descriptor
   * @param {Array<!ol.Feature>} areas
   * @param {Function} updateFunc
   * @return {goog.Promise|undefined}
   * @private
   */
  updateCache_(descriptor, areas, updateFunc) {
    var promises = [];
    if (areas) {
      if (osImplements(descriptor, IAreaTest.ID)) {
        var cache = Area.cache_;
        var item = /** @type {IAreaTest} */ (descriptor);

        for (var i = 0, n = areas.length; i < n; i++) {
          var area = areas[i];
          if (area.get('shown')) {
            var key = item.getTestAreaKey(area);

            if (key in cache) {
              if (cache[key]) {
                updateFunc(area.getId());
              }
            } else {
              var onResult =
                  /**
                   * @param {boolean} value
                   */
                  function(value) {
                    var cache = Area.cache_;
                    cache[key] = value;

                    if (cache[key]) {
                      updateFunc(area.getId());
                    }
                  };

              var result = item.testArea(area);

              if (result instanceof Promise) {
                result.then(onResult);
                promises.push(result);
              } else {
                onResult(result);
              }
            }
          }
        }
      }
    }

    return promises.length ? Promise.all(promises) : undefined;
  }
}


/**
 * @type {Object<string, (boolean|null)>}
 * @private
 */
Area.cache_ = {};
