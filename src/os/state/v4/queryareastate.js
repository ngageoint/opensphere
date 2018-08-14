goog.provide('os.state.v4.QueryArea');
goog.provide('os.state.v4.QueryTag');
goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('ol.Feature');
goog.require('os.ogc.spatial');
goog.require('os.ogc.spatial.Format');
goog.require('os.state.XMLState');
goog.require('os.xml');


/**
 * XML tags for query area state
 * @enum {string}
 */
os.state.v4.QueryTag = {
  AREA: 'queryArea',
  LAYER: 'layer',
  TAGS: 'tags',
  DESCRIPTION: 'description'
};



/**
 * @extends {os.state.XMLState}
 * @constructor
 *
 * @todo Query areas added via state file should only apply to the layers specified in the file.
 */
os.state.v4.QueryArea = function() {
  os.state.v4.QueryArea.base(this, 'constructor');

  this.description = 'Saves the current query areas';
  this.priority = 80;
  this.rootName = 'queryAreas';
  this.title = 'Query Areas';
};
goog.inherits(os.state.v4.QueryArea, os.state.XMLState);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.state.v4.QueryArea.LOGGER_ = goog.log.getLogger('os.state.v4.QueryArea');


/**
 * Query areas added by this state type
 * @type {Object.<string, !Array.<!ol.Feature>>}
 * @private
 */
os.state.v4.QueryArea.ADDED_ = {};


/**
 * @inheritDoc
 */
os.state.v4.QueryArea.prototype.load = function(obj, id, opt_title) {
  obj = os.state.XMLState.ensureXML(obj);

  if (!(obj instanceof Element)) {
    goog.log.error(os.state.v4.QueryArea.LOGGER_, 'Unable to load state content!');
    return;
  }

  try {
    var areas = obj.querySelectorAll('queryArea');
    if (areas) {
      os.state.v4.QueryArea.ADDED_[id] = [];
      var areasToAdd = [];
      var entriesToAdd = [];

      // here we check for the parent element
      var p = obj.parentNode;
      // and then the existence of the <queryEntries> tag
      var queryEntries = p ? p.querySelector('queryEntries') : null;

      for (var i = 0, n = areas.length; i < n; i++) {
        var geom = os.ogc.spatial.readKMLGeometry(areas[i]);
        if (geom) {
          // KML is always in lon, lat
          geom.osTransform();
          var feature = new ol.Feature(geom);
          var areaId = areas[i].getAttribute('id') || goog.string.getRandomString();
          var featTitle = areas[i].getAttribute('title');
          var featDesc = os.xml.getElementValueOrDefault(
              areas[i].querySelector(os.state.v4.QueryTag.DESCRIPTION), '');
          var featTags = os.xml.getElementValueOrDefault(
              areas[i].querySelector(os.state.v4.QueryTag.TAGS), '');

          if (areaId) {
            feature.setId(os.state.AbstractState.createId(id, areaId));
            feature.set('temp', true);
            feature.set('title', featTitle ? featTitle : 'Area ' + (i + 1));
            feature.set('tags', featTags);
            feature.set('description', featDesc);
            feature.set(os.data.RecordField.SOURCE_NAME, opt_title);
          }

          os.state.v4.QueryArea.ADDED_[id].push(feature);
          areasToAdd.push(feature);

          // if there are no query entries, apply the area as an inclusion to all layers in the state (or as a wildcard)
          // if there are query entries, but the current area is not one of them, do the same
          if (!queryEntries || !queryEntries.querySelector('queryEntry[areaId="' + areaId + '"]')) {
            var layers = areas[i].querySelectorAll('layer');
            areaId = /** @type {string} */ (feature.getId());

            if (layers && layers.length) {
              for (var j = 0, m = layers.length; j < m; j++) {
                var layerId = os.state.AbstractState.createId(id, layers[j].textContent);
                var entry = {
                  'layerId': layerId,
                  'areaId': areaId,
                  'filterId': '*',
                  'includeArea': true,
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
                'includeArea': true,
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
    goog.log.error(os.state.v4.QueryArea.LOGGER_, 'There was an error loading a query area from state file ' + id, e);
  }
};


/**
 * @inheritDoc
 */
os.state.v4.QueryArea.prototype.remove = function(id) {
  var qm = os.ui.queryManager;
  var am = os.ui.areaManager;

  if (id in os.state.v4.QueryArea.ADDED_) {
    var added = os.state.v4.QueryArea.ADDED_[id];
    var removeFeatures = [];
    var removeEntries = [];

    for (var i = 0, n = added.length; i < n; i++) {
      var feature = added[i];
      var entries = qm.getEntries(null, /** @type {string} */ (feature.getId()));

      for (var j = 0, m = entries.length; j < m; j++) {
        if (entries[j]['temp']) {
          removeEntries.push(entries[j]);
        }
      }

      if (feature.get('temp')) {
        removeFeatures.push(feature);
      }
    }

    // the query entry remove must come before removing the area from the AreaManager
    if (removeEntries.length) {
      qm.removeEntriesArr(removeEntries);
    }

    goog.array.forEach(removeFeatures, am.remove, am);
    delete os.state.v4.QueryArea.ADDED_[id];
  }
};


/**
 * @inheritDoc
 */
os.state.v4.QueryArea.prototype.saveInternal = function(options, rootObj) {
  try {
    var am = os.ui.areaManager;
    var qm = os.ui.queryManager;
    var queries = qm.getActiveEntries();

    // take the flat list of queries and turn it into something more useful for generating XML
    var set = {};
    for (var i = 0, n = queries.length; i < n; i++) {
      var item = queries[i];
      var areaId = /** @type {string} */ (item['areaId']);

      if (areaId && areaId !== '*' && item['includeArea']) {
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
          // KML must be in lon, lat
          geom = geom.clone().toLonLat();
          var kmlPoly = os.ogc.spatial.formatPolygon(geom, os.ogc.spatial.Format.KML);
          if (kmlPoly) {
            var kmlDoc = goog.dom.xml.loadXml(kmlPoly);
            var queryArea = os.xml.appendElement(os.state.v4.QueryTag.AREA, rootObj, undefined, {
              'id': /** @type {string} */ (area.getId()),
              'title': /** @type {string} */ (area.get('title'))
            });

            os.xml.appendElement(os.state.v4.QueryTag.DESCRIPTION, queryArea,
                /** @type {string} */ (area.get('description')));
            os.xml.appendElement(os.state.v4.QueryTag.TAGS, queryArea,
                /** @type {string} */ (area.get('tags')));

            queryArea.appendChild(goog.dom.getFirstElementChild(kmlDoc));
            var layerIds = set[areaId];

            if (layerIds) {
              for (layerId in layerIds) {
                os.xml.appendElement(os.state.v4.QueryTag.LAYER, queryArea, layerId);
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
