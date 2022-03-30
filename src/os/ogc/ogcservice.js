goog.declareModuleId('os.ogc.OGCService');

import GeoJSON from 'ol/src/format/GeoJSON.js';

import OSSettings from '../config/settings.js';
import * as geo2 from '../geo/geo2.js';
import Request from '../net/request.js';
import * as OSFeature from '../ol/feature.js';
import AbstractService from '../ui/abstractservice.js';
import GMLParser from '../ui/file/gml/gmlparser.js';
import {loadXml} from '../xml.js';
import OGCFilterModifier from './filter/ogcfiltermodifier.js';
import OGCFilterOverride from './filter/ogcfilteroverride.js';
import Format from './format.js';
import {getDefaultWfsParams, getException} from './ogc.js';
import OGCQuery from './query/ogcquery.js';
import {formatPolygon, readKMLGeometry} from './spatial.js';
import WFSFormatter from './wfs/wfsformatter.js';

const GoogPromise = goog.require('goog.Promise');
const Uri = goog.require('goog.Uri');

/**
 * Opensphere's Settings Manager
 */
const Settings = OSSettings.getInstance();

/**
 * The field to look for label, etc
 * @type {string}
 */
const DEFAULT_ID_FIELD = 'NAME';

/**
 * Provides a service to get a data from a WFS layer.
 * @template T
 */
export default class OGCService extends AbstractService {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * Promise used to request all countries.
     * @type {GoogPromise}
     * @protected
     */
    this.allPromise_ = null;

    /**
     * @type {!string}
     * @protected
     */
    this.nameProperty_ = '';

    /**
     * @type {?string}
     * @protected
     */
    this.namespace_;

    /**
     * @type {OGCQuery}
     * @protected
     */
    this.query_;

    /**
     * @type {!string}
     * @protected
     */
    this.serviceId_ = '';

    /**
     * @type {?string}
     * @protected
     */
    this.typename_;

    /**
     * @type {?string}
     * @protected
     */
    this.url_;

    /**
     * @type {?string}
     * @protected
     */
    this.properties_;
  }

  /**
   * Initializes the required properties for the OGC Service
   * @param {osx.ogc.OGCSettings=} opt_settings
   */
  init(opt_settings) {
    this.url_ = opt_settings && opt_settings.url ? opt_settings.url : null;
    this.typename_ = opt_settings && opt_settings.typename ? opt_settings.typename : null;
    this.nameProperty_ = opt_settings && opt_settings.nameProperty ? opt_settings.nameProperty : DEFAULT_ID_FIELD;
    this.namespace_ = opt_settings && opt_settings.namespace ? opt_settings.namespace : null;
    this.properties_ = opt_settings && opt_settings.properties ? opt_settings.properties : null;
  }

  /**
   * Since this request will be the same every time, just store the promise and return that.
   * @return {boolean}
   */
  isConfigured() {
    return !!this.url_ && !!this.typename_ && !!this.nameProperty_;
  }

  /**
   * Request all available data on the URL.
   * @return {!GoogPromise}
   */
  getAll() {
    return this.allPromise_ || (this.allPromise_ = new GoogPromise(this.loadAll_, this));
  }

  /**
   * Requests the border for a single datum.
   * @param {!T} datum
   * @return {!GoogPromise}
   * @template T
   */
  get(datum) {
    return new GoogPromise((resolve, reject) => {
      this.load_(resolve, reject, datum);
    }, this);
  }

  /**
   * Get the identifying value out of this object for queries, etc
   * @param {!T} datum
   * @return {string|undefined|null}
   * @template T
   */
  getId(datum) {
    const id = datum.get(this.nameProperty_);
    return id || datum.get(DEFAULT_ID_FIELD);
  }

  /**
   * Get the identifying value out of this object for queries, etc
   * @param {!T} datum
   * @return {string|undefined|null}
   * @template T
   */
  getLabel(datum) {
    const label = datum.get(this.nameProperty_);
    return label || datum.get(DEFAULT_ID_FIELD);
  }

  /**
   * Get the UI
   * @return {OGCQuery}
   */
  getQuery() {
    if (!this.query_) {
      this.query_ = new OGCQuery(this);
    }
    return this.query_;
  }

  /**
   * Get the UI
   * @return {string}
   */
  getServiceId() {
    return this.serviceId_;
  }

  /**
   * Get the desired tags out of the Feature
   * @param {!Feature} feature
   * @return {undefined|string}
   */
  getTags(feature) {
    let tags;
    const props = this.properties_ ? Settings.get(this.properties_) : null;
    if (props) {
      const values = [];
      for (let i = 0; i < props.length; i++) {
        const value = feature.get(props[i]);
        if (value) {
          values.push(value);
        }
      }

      tags = values.join(', ');
    }
    return tags;
  }

  /**
   * Handle area being loaded from the server.
   * @param {!Feature} feature The area border feature
   * @return {!Feature}
   * @template T
   */
  populateFeature(feature) {
    const tags = this.getTags(feature);

    feature.set('title', this.getLabel(feature));
    feature.set(this.nameProperty_, undefined);
    feature.set('tags', 'Borders' + (tags ? (', ' + tags) : ''));

    this.fix_(feature);

    return feature;
  }

  /**
   * @param {!string} id
   */
  setServiceId(id) {
    this.serviceId_ = id;
  }

  /**
   * @param {function(!Array<!Feature>): ?} resolve The GoogPromise resolve function
   * @param {function(*): ?} reject The GoogPromise reject function
   * @private
   */
  loadAll_(resolve, reject) {
    if (this.isConfigured()) {
      const qd = getDefaultWfsParams();
      qd.set('typename', this.typename_);
      qd.set('propertyname', 'ID,' + this.nameProperty_);
      qd.set('outputformat', 'text/xml; subtype=gml/3.1.1');

      const uri = new Uri(this.url_);
      uri.setQueryData(qd);

      const request = new Request(uri);
      request.setHeader('Accept', 'application/xml');
      request.setValidator(getException);
      request.setDataFormatter(new WFSFormatter());

      request.getPromise().then(
          this.onAllLoaded_.bind(this, resolve, reject),
          function(reject, response) {
            this.reportError(['Failed to load data list.', response].join('\n'), false, reject);
          }.bind(this, reject),
          this
      );
      request.load();
    } else {
      reject('Service is not configured.');
    }
  }

  /**
   * Handle data being loaded from the server.
   * @param {function(!Array<!T>)} resolve GoogPromise resolution function
   * @param {function(*)} reject GoogPromise rejection function
   * @param {string|undefined} response
   * @template T
   * @private
   */
  onAllLoaded_(resolve, reject, response) {
    const list = [];
    if (response) {
      const parser = new GMLParser();
      parser.setSource(response);

      while (parser.hasNext()) {
        const feature = parser.parseNext();
        if (feature) {
          list.push(feature);
        }
      }
    }

    if (list && list.length > 0) {
      list.sort(OSFeature.fieldSort.bind(undefined, this.nameProperty_));
      resolve(list);
    } else {
      this.reportError(['Unable to load data list.', response].join('\n'), false, reject);
    }
  }

  /**
   * Handle a specific datum being chosen in an import dialog.
   * @param {function(Feature): ?} resolve GoogPromise resolution function
   * @param {function(*): ?} reject GoogPromise rejection function
   * @param {!T} datum
   * @template T
   * @private
   */
  load_(resolve, reject, datum) {
    const name = this.getId(datum);

    if (name) {
      if (this.isConfigured()) {
        const qd = getDefaultWfsParams();
        qd.set('typename', this.typename_);
        qd.set('maxfeatures', 1);

        if (this.namespace_) {
          qd.set('namespace', this.namespace_);
        }

        const uri = new Uri(this.url_);
        uri.setQueryData(qd);

        const request = new Request(uri);
        request.setMethod(Request.METHOD_POST);
        request.setHeader('Accept', 'application/json, text/plain, */*');
        request.setValidator(getException);
        request.setDataFormatter(new WFSFormatter());
        request.addModifier(new OGCFilterModifier({
          filter: true
        }));

        const props = {};
        props[this.nameProperty_] = [name];
        request.addModifier(new OGCFilterOverride(props));

        request.getPromise().then(
            this.onLoaded_.bind(this, resolve, reject, datum),
            function(reject, response) {
              this.reportError(['Failed to load datum.', response].join('\n'), false, reject);
            }.bind(this, reject),
            this
        );
        request.load();
      } else {
        reject('Service is not configured.');
      }
    } else {
      reject('No datum provided.');
    }
  }

  /**
   * Handle specific datum being loaded from the server.
   * @param {function(!Feature)} resolve GoogPromise resolution function
   * @param {function(*)} reject GoogPromise rejection function
   * @param {!T} datum
   * @param {string|undefined} response
   * @template T
   * @private
   */
  onLoaded_(resolve, reject, datum, response) {
    let feature;
    if (response) {
      const fmt = new GeoJSON();
      const features = fmt.readFeatures(response);
      if (features && features.length > 0) {
        feature = features[0];
      }
    }

    if (feature) {
      if (this.nameProperty_ != DEFAULT_ID_FIELD) {
        // if the name property key is not our internal value, swap them
        feature.set(DEFAULT_ID_FIELD, feature.get(this.nameProperty_));
        feature.set(this.nameProperty_, undefined);
      }

      resolve(feature);
    } else {
      const name = this.getId(datum) || '<undefined>';
      const error = `Unable to load ${name}.`;

      this.reportError([error, response].join('\n'), false, reject);
    }
  }

  /**
   * Apply any universal adjustments to the final result
   * @param {!Feature} feature
   * @private
   */
  fix_(feature) {
    // HACK ALERT! Write into KML MultiGeometry and read it back to fix certain broken Geometries.
    const geom = feature.getGeometry();
    if (geom) {
      geo2.normalizeGeometryCoordinates(feature.getGeometry());
      geom.toLonLat();
      const kml = formatPolygon(geom, Format.KML);

      if (kml) {
        const doc = loadXml(kml);
        const readGeometry = readKMLGeometry(doc);
        readGeometry.osTransform();

        feature.setGeometry(readGeometry);
      }
    }
  }
}
