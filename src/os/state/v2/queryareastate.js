goog.declareModuleId('os.state.v2.QueryArea');

import Feature from 'ol/src/Feature.js';

import '../../mixin/geometrymixin.js';
import RecordField from '../../data/recordfield.js';
import Format from '../../ogc/format.js';
import {formatPolygon, readKMLGeometry} from '../../ogc/spatial.js';
import {getAreaManager, getQueryManager} from '../../query/queryinstance.js';
import {appendElement} from '../../xml.js';
import AbstractState from '../abstractstate.js';
import XMLState from '../xmlstate.js';
import QueryTag from './querytag.js';

const {getFirstElementChild} = goog.require('goog.dom');
const {loadXml} = goog.require('goog.dom.xml');
const log = goog.require('goog.log');
const {getRandomString} = goog.require('goog.string');

const Logger = goog.requireType('goog.log.Logger');


/**
 * @todo Query areas added via state file should only apply to the layers specified in the file.
 */
export default class QueryArea extends XMLState {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.description = 'Saves the current query areas';
    this.priority = 80;
    this.rootName = 'queryAreas';
    this.title = 'Query Areas';
  }

  /**
   * @inheritDoc
   */
  load(obj, id, opt_title) {
    obj = XMLState.ensureXML(obj);

    if (!(obj instanceof Element)) {
      log.error(logger, 'Unable to load state content!');
      return;
    }

    try {
      var areas = obj.querySelectorAll('queryArea');
      if (areas) {
        addedAreas[id] = [];
        var areasToAdd = [];
        var entriesToAdd = [];

        // here we check for the parent element
        var p = obj.parentNode;
        // and then the existence of the <queryEntries> tag
        var queryEntries = p ? p.querySelector('queryEntries') : null;

        for (var i = 0, n = areas.length; i < n; i++) {
          var geom = readKMLGeometry(areas[i]);
          if (geom) {
            // KML is always in lon, lat
            geom.osTransform();
            var feature = new Feature(geom);
            var areaId = areas[i].getAttribute('id') || getRandomString();
            var featTitle = areas[i].getAttribute('title');

            if (areaId) {
              feature.setId(AbstractState.createId(id, areaId));
              feature.set('temp', true);
              feature.set('title', featTitle ? featTitle : 'Area ' + (i + 1));
              feature.set('tags', opt_title);
              feature.set(RecordField.SOURCE_NAME, opt_title);
            }

            addedAreas[id].push(feature);
            areasToAdd.push(feature);

            // if there are no query entries, apply the area as an inclusion to all layers in the state (or as a wildcard)
            // if there are query entries, but the current area is not one of them, do the same
            if (!queryEntries || !queryEntries.querySelector('queryEntry[areaId="' + areaId + '"]')) {
              var layers = areas[i].querySelectorAll('layer');
              areaId = /** @type {string} */ (feature.getId());

              if (layers && layers.length) {
                for (var j = 0, m = layers.length; j < m; j++) {
                  var layerId = AbstractState.createId(id, layers[j].textContent);
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
        getAreaManager().bulkAdd(areasToAdd, true);
        getQueryManager().addEntries(entriesToAdd);
      }
    } catch (e) {
      // que pasa, hombre?
      log.error(logger, 'There was an error loading a query area from state file ' + id, e);
    }
  }

  /**
   * @inheritDoc
   */
  remove(id) {
    var qm = getQueryManager();
    var am = getAreaManager();

    if (id in addedAreas) {
      var added = addedAreas[id];
      var toRemove = [];

      for (var i = 0, n = added.length; i < n; i++) {
        var feature = added[i];
        var entries = qm.getEntries(null, /** @type {string} */ (feature.getId()));

        for (var j = 0, m = entries.length; j < m; j++) {
          if (entries[j]['temp']) {
            toRemove.push(entries[j]);
          }
        }

        if (feature.get('temp')) {
          am.remove(feature);
        }
      }

      if (toRemove.length) {
        qm.removeEntriesArr(toRemove);
      }

      delete addedAreas[id];
    }
  }

  /**
   * @inheritDoc
   */
  saveInternal(options, rootObj) {
    try {
      var am = getAreaManager();
      var qm = getQueryManager();
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
            geom = geom.clone().toLonLat();
            var kmlPoly = formatPolygon(geom, Format.KML);
            if (kmlPoly) {
              var kmlDoc = loadXml(kmlPoly);
              var queryArea = appendElement(QueryTag.AREA, rootObj, undefined, {
                'id': /** @type {string} */ (area.getId()),
                'title': /** @type {string} */ (area.get('title'))
              });

              queryArea.appendChild(getFirstElementChild(kmlDoc));
              var layerIds = set[areaId];

              if (layerIds) {
                for (layerId in layerIds) {
                  appendElement(QueryTag.LAYER, queryArea, layerId);
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
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.state.v2.QueryArea');

/**
 * Query areas added by this state type
 * @type {Object<string, !Array<!Feature>>}
 */
const addedAreas = {};
