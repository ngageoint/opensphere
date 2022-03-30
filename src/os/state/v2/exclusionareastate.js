goog.declareModuleId('os.state.v2.ExclusionArea');

import Feature from 'ol/src/Feature.js';

import '../../mixin/geometrymixin.js';
import RecordField from '../../data/recordfield.js';
import Format from '../../ogc/format.js';
import {formatPolygon, readKMLGeometry} from '../../ogc/spatial.js';
import {getAreaManager, getQueryManager} from '../../query/queryinstance.js';
import {appendElement, createElement} from '../../xml.js';
import AbstractState from '../abstractstate.js';
import XMLState from '../xmlstate.js';
import ExclusionTag from './exclusiontag.js';

const {getFirstElementChild} = goog.require('goog.dom');
const {loadXml} = goog.require('goog.dom.xml');
const log = goog.require('goog.log');
const {getRandomString} = goog.require('goog.string');

const Logger = goog.requireType('goog.log.Logger');


/**
 */
export default class ExclusionArea extends XMLState {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.description = 'Saves the current exclusion areas';
    this.priority = 80;
    this.rootName = 'exclusionAreas';
    this.title = 'Exclusion Areas';
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
      var exclusions = obj.querySelectorAll('exclusionArea');
      var isLegacy = false;
      if (!exclusions.length) {
        // 2D used to write out states with just the polygons, so try that
        exclusions = obj.querySelectorAll('Polygon');
        isLegacy = true;
      }

      if (exclusions.length > 0) {
        addedAreas[id] = [];

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
            exclusionEl = createElement('exclusionArea');
            exclusionEl.appendChild(exclusions[i]);
          } else {
            // new structure is exclusionAreas > exclusionArea > geometry
            exclusionEl = exclusions[i];
          }

          var geom = readKMLGeometry(exclusionEl);
          if (geom) {
            // KML is always in lon, lat
            geom.osTransform();
            var feature = new Feature(geom);
            var areaId = exclusions[i].getAttribute('id') || getRandomString();
            var featTitle = exclusions[i].getAttribute('title');

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
              var layers = exclusions[i].querySelectorAll('layer');
              areaId = /** @type {string} */ (feature.getId());

              if (layers && layers.length) {
                for (var j = 0, m = layers.length; j < m; j++) {
                  var layerId = AbstractState.createId(id, layers[j].textContent);
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
        getAreaManager().bulkAdd(areasToAdd, true);
        getQueryManager().addEntries(entriesToAdd);
      }
    } catch (e) {
      // que pasa, hombre?
      log.error(logger, 'There was an error loading a query area from state file ' +
          id, e);
    }
  }

  /**
   * @inheritDoc
   */
  remove(id) {
    if (id in addedAreas) {
      var added = addedAreas[id];
      for (var i = 0, n = added.length; i < n; i++) {
        var feature = added[i];

        if (feature.get('temp')) {
          getQueryManager().removeEntries(null, /** @type {string} */ (feature.getId()));
          getAreaManager().remove(feature);
        }
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
            var kmlPoly = formatPolygon(geom, Format.KML);
            if (kmlPoly) {
              var kmlDoc = loadXml(kmlPoly);
              var exclusionArea = appendElement(ExclusionTag.AREA, rootObj, undefined, {
                'id': /** @type {string} */ (area.getId()),
                'title': /** @type {string} */ (area.get('title'))
              });

              exclusionArea.appendChild(getFirstElementChild(kmlDoc));
              var layerIds = set[areaId];

              if (layerIds) {
                for (layerId in layerIds) {
                  appendElement(ExclusionTag.LAYER, exclusionArea, layerId);
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
const logger = log.getLogger('os.state.v2.ExclusionArea');

/**
 * Exclusion areas added by this state type
 * @type {Object<string, !Array<!Feature>>}
 */
const addedAreas = {};
