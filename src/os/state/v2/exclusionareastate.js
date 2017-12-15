goog.provide('os.state.v2.ExclusionArea');
goog.provide('os.state.v2.ExclusionTag');
goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('ol.Feature');
goog.require('os.mixin.geometry');
goog.require('os.ogc.spatial');
goog.require('os.ogc.spatial.Format');
goog.require('os.state.XMLState');
goog.require('os.xml');


/**
 * XML tags for exclusion area state
 * @enum {string}
 */
os.state.v2.ExclusionTag = {
  AREA: 'exclusionArea',
  LAYER: 'layer'
};



/**
 * @extends {os.state.XMLState}
 * @constructor
 */
os.state.v2.ExclusionArea = function() {
  os.state.v2.ExclusionArea.base(this, 'constructor');

  this.description = 'Saves the current exclusion areas';
  this.priority = 80;
  this.rootName = 'exclusionAreas';
  this.title = 'Exclusion Areas';
};
goog.inherits(os.state.v2.ExclusionArea, os.state.XMLState);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.state.v2.ExclusionArea.LOGGER_ = goog.log.getLogger('os.state.v2.ExclusionArea');


/**
 * Exclusion areas added by this state type
 * @type {Object.<string, !Array.<!ol.Feature>>}
 * @private
 */
os.state.v2.ExclusionArea.ADDED_ = {};


/**
 * @inheritDoc
 */
os.state.v2.ExclusionArea.prototype.load = function(obj, id, opt_title) {
  obj = os.state.XMLState.ensureXML(obj);

  if (!(obj instanceof Element)) {
    goog.log.error(os.state.v2.ExclusionArea.LOGGER_, 'Unable to load state content!');
    return;
  }

  try {
    var exclusions = obj.querySelectorAll('exclusionArea');
    var isLegacy = false;
    if (!exclusions.length) {
      // 2D used to write out states with just the polygons, so try that
      exclusions = obj.querySelectorAll('Polygon');
      isLegacy = true;
    }

    if (exclusions.length > 0) {
      os.state.v2.ExclusionArea.ADDED_[id] = [];

      // here we check for the parent element
      var p = obj.parentNode;
      // and then the existence of the <queryEntries> tag
      var queryEntries = p ? p.querySelector('queryEntries') : null;
      var areasToAdd = [];
      var entriesToAdd = [];

      for (var i = 0, n = exclusions.length; i < n; i++) {
        var exclusionEl;
        if (isLegacy) {
          // old structure was exclusionAreas > geometry
          exclusionEl = os.xml.createElement('exclusionArea');
          exclusionEl.appendChild(exclusions[i]);
        } else {
          // new structure is exclusionAreas > exclusionArea > geometry
          exclusionEl = exclusions[i];
        }

        var geom = os.ogc.spatial.readKMLGeometry(exclusionEl);
        if (geom) {
          // KML is always in lon, lat
          geom.osTransform();
          var feature = new ol.Feature(geom);
          var areaId = exclusions[i].getAttribute('id') || goog.string.getRandomString();
          var featTitle = exclusions[i].getAttribute('title');

          if (areaId) {
            feature.setId(os.state.AbstractState.createId(id, areaId));
            feature.set('temp', true);
            feature.set('title', featTitle ? featTitle : 'Area ' + (i + 1));
            feature.set('tags', opt_title);
            feature.set(os.data.RecordField.SOURCE_NAME, opt_title);
          }

          os.state.v2.ExclusionArea.ADDED_[id].push(feature);
          areasToAdd.push(feature);

          // if there are no query entries, apply the area as an inclusion to all layers in the state (or as a wildcard)
          // if there are query entries, but the current area is not one of them, do the same
          if (!queryEntries || !queryEntries.querySelector('queryEntry[areaId="' + areaId + '"]')) {
            var layers = exclusions[i].querySelectorAll('layer');
            areaId = /** @type {string} */ (feature.getId());

            if (layers && layers.length) {
              for (var j = 0, m = layers.length; j < m; j++) {
                var layerId = os.state.AbstractState.createId(id, layers[j].textContent);
                var entry = {
                  'layerId': layerId,
                  'areaId': areaId,
                  'filterId': '*',
                  'includeArea': false,
                  'filterGroup': true,
                  'temp': true
                };

                entriesToAdd.push(entry);
              }
            } else {
              var entry = {
                'layerId': '*',
                'areaId': areaId,
                'filterId': '*',
                'includeArea': false,
                'filterGroup': true,
                'temp': true
              };

              entriesToAdd.push(entry);
            }
          }
        }
      }

      // do these as bulk adds to reduce manager eventing overhead
      os.ui.areaManager.bulkAdd(areasToAdd, true);
      os.ui.queryManager.addEntries(entriesToAdd);
    }
  } catch (e) {
    // que pasa, hombre?
    goog.log.error(os.state.v2.ExclusionArea.LOGGER_, 'There was an error loading a query area from state file ' +
        id, e);
  }
};


/**
 * @inheritDoc
 */
os.state.v2.ExclusionArea.prototype.remove = function(id) {
  if (id in os.state.v2.ExclusionArea.ADDED_) {
    var added = os.state.v2.ExclusionArea.ADDED_[id];
    for (var i = 0, n = added.length; i < n; i++) {
      var feature = added[i];

      if (feature.get('temp')) {
        os.ui.queryManager.removeEntries(null, /** @type {string} */ (feature.getId()));
        os.ui.areaManager.remove(feature);
      }
    }

    delete os.state.v2.ExclusionArea.ADDED_[id];
  }
};


/**
 * @inheritDoc
 */
os.state.v2.ExclusionArea.prototype.saveInternal = function(options, rootObj) {
  try {
    var am = os.ui.areaManager;
    var qm = os.ui.queryManager;
    var queries = qm.getActiveEntries();

    // take the flat list of queries and turn it into something more useful for generating XML
    var set = {};
    for (var i = 0, n = queries.length; i < n; i++) {
      var item = queries[i];
      var areaId = /** @type {string} */ (item['areaId']);

      if (areaId && areaId !== '*' && !item['includeArea']) {
        var layerId = /** @type {string} */ (item['layerId']);

        if (!(areaId in set)) {
          set[areaId] = {};
        }

        if (layerId !== '*') {
          set[areaId][layerId] = true;
        }
      }
    }

    for (areaId in set) {
      var area = am.get(/** @type {string} */ (areaId));

      if (area) {
        var geom = area.getGeometry();
        if (geom) {
          // KML is always in lon, lat
          geom = geom.clone().toLonLat();
          var kmlPoly = os.ogc.spatial.formatPolygon(geom, os.ogc.spatial.Format.KML);
          if (kmlPoly) {
            var kmlDoc = goog.dom.xml.loadXml(kmlPoly);
            var exclusionArea = os.xml.appendElement(os.state.v2.ExclusionTag.AREA, rootObj, undefined, {
              'id': /** @type {string} */ (area.getId()),
              'title': /** @type {string} */ (area.get('title'))
            });

            exclusionArea.appendChild(goog.dom.getFirstElementChild(kmlDoc));
            var layerIds = set[areaId];

            if (layerIds) {
              for (layerId in layerIds) {
                os.xml.appendElement(os.state.v2.ExclusionTag.LAYER, exclusionArea, layerId);
              }
            }
          }
        }
      }
    }

    this.saveComplete(options, rootObj);
  } catch (e) {
    this.saveFailed(e.message || 'Unspecified error.');
  }
};
