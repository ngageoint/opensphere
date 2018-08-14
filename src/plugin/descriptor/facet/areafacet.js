goog.provide('plugin.descriptor.facet.Area');

goog.require('os.data.IAreaTest');
goog.require('plugin.descriptor.facet.BaseFacet');



/**
 * @constructor
 * @extends {plugin.descriptor.facet.BaseFacet}
 */
plugin.descriptor.facet.Area = function() {
  plugin.descriptor.facet.Area.base(this, 'constructor');
};
goog.inherits(plugin.descriptor.facet.Area, plugin.descriptor.facet.BaseFacet);


/**
 * @type {Object<string, (boolean|null)>}
 * @private
 */
plugin.descriptor.facet.Area.cache_ = {};


/**
 * @inheritDoc
 */
plugin.descriptor.facet.Area.prototype.transformsValue = function(category) {
  return category === 'Area';
};


/**
 * @inheritDoc
 */
plugin.descriptor.facet.Area.prototype.valueToLabel = function(value) {
  var area = os.query.AreaManager.getInstance().get(value);

  if (area) {
    return /** @type {string} */ (area.get('title'));
  }

  return value;
};


/**
 * @inheritDoc
 */
plugin.descriptor.facet.Area.prototype.load = function(descriptor, facets) {
  return this.updateCache_(
      descriptor,
      os.query.AreaManager.getInstance().getAll(),
      function(areaId) {
        plugin.descriptor.facet.BaseFacet.update('Area', areaId, facets);
      });
};


/**
 * @inheritDoc
 */
plugin.descriptor.facet.Area.prototype.test = function(descriptor, facets, results) {
  var areaIds = facets['Area'];

  if (areaIds) {
    plugin.descriptor.facet.BaseFacet.updateResults('Area', results);

    var areas = os.query.AreaManager.getInstance().getAll();
    if (areas) {
      areas = areas.filter(function(area) {
        return areaIds.indexOf(/** @type {string} */ (area.getId())) > -1;
      });
    }

    return this.updateCache_(
        descriptor,
        areas,
        function(areaId) {
          plugin.descriptor.facet.BaseFacet.updateResults('Area', results, 1);
        });
  }
};


/**
 * This is where the magic happens.
 * @param {os.data.IDataDescriptor} descriptor
 * @param {Array<!ol.Feature>} areas
 * @param {Function} updateFunc
 * @return {goog.Promise|undefined}
 * @private
 */
plugin.descriptor.facet.Area.prototype.updateCache_ = function(descriptor, areas, updateFunc) {
  var promises = [];
  if (areas) {
    if (os.implements(descriptor, os.data.IAreaTest.ID)) {
      var cache = plugin.descriptor.facet.Area.cache_;
      var item = /** @type {os.data.IAreaTest} */ (descriptor);

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
                  var cache = plugin.descriptor.facet.Area.cache_;
                  cache[key] = value;

                  if (cache[key]) {
                    updateFunc(area.getId());
                  }
                };

            var result = item.testArea(area);

            if (result instanceof goog.Promise) {
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

  return promises.length ? goog.Promise.all(promises) : undefined;
};
