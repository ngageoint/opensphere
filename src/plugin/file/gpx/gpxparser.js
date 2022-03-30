/**
 * @fileoverview Parser
 * @suppress {accessControls|duplicate|unusedPrivateMembers}
 */
goog.declareModuleId('plugin.file.gpx.GPXParser');


import Feature from 'ol/src/Feature.js';
import LineString from 'ol/src/geom/LineString.js';
import MultiLineString from 'ol/src/geom/MultiLineString.js';
import Point from 'ol/src/geom/Point.js';
import SimpleGeometry from 'ol/src/geom/SimpleGeometry.js';
import {isDocument, parse} from 'ol/src/xml.js';
import * as text from '../../../os/file/mime/text.js';
import * as osMap from '../../../os/map/map.js';
import GPX from '../../../os/ol/format/GPX.js';

const dom = goog.require('goog.dom');


/**
 * Simple GPX parser that extracts features from a GPX file.
 *
 * @implements {IParser<Feature>}
 * @template T
 */
export default class GPXParser {
  /**
   * Constructor.
   * @param {Object<string, *>} options Layer configuration options.
   */
  constructor(options) {
    /**
     * @type {GPX}
     * @private
     */
    this.format_ = new GPX();

    /**
     * @type {?Document}
     * @private
     */
    this.document_ = null;

    /**
     * @type {number}
     * @private
     */
    this.trackId_ = 0;
  }

  /**
   * @inheritDoc
   */
  setSource(source) {
    if (source instanceof ArrayBuffer) {
      source = text.getText(source) || null;
    }

    if (isDocument(source)) {
      this.document_ = /** @type {Document} */ (source);
    } else if (typeof source === 'string') {
      this.document_ = parse(source);
    }
  }

  /**
   * @inheritDoc
   */
  cleanup() {
    this.document_ = null;
  }

  /**
   * @inheritDoc
   */
  hasNext() {
    return this.document_ != null;
  }

  /**
   * @inheritDoc
   */
  parseNext() {
    var features = null;
    if (this.document_) {
      // make sure the document reference is cleared so errors don't result in hasNext continuing to return true. the
      // importer will catch and report the error so we don't do it here.
      var doc = this.document_;
      this.document_ = null;

      // let OL3 do the bulk of the parsing
      features = this.format_.readFeatures(doc, {
        featureProjection: osMap.PROJECTION
      });

      if (features) {
        // we have results, so go through each feature and expand out any LineString or MultiLineString geometries
        var trackFeatures = [];
        for (var i = features.length - 1; i >= 0; i--) {
          var feature = features[i];
          var geometry = feature.getGeometry();
          if (geometry instanceof SimpleGeometry) {
            var coordinates = geometry.getCoordinates();
            if (coordinates) {
              if (geometry instanceof LineString || geometry instanceof MultiLineString) {
                // take the original feature out, we're expanding it into a feature per coordinate
                features.splice(i, 1);

                // wrap a lineString in an array then loop over the lineStrings, this handles multiple trksegs
                var lineStrings = geometry instanceof LineString ? [coordinates] : coordinates;

                lineStrings.forEach(function(lineString) {
                  this.trackId_++;
                  lineString.forEach(function(coordinate) {
                    var f = new Feature();

                    // parse metadata and set a trackId on each feature to allow for easy track recreation
                    this.parseMetadata(f, coordinate);
                    f.set('TRACK_ID', this.trackId_);

                    trackFeatures.push(f);
                  }, this);
                }, this);
              } else if (geometry instanceof Point) {
                // simply modify the feature in place to add its metadata
                this.parseMetadata(feature, coordinates);
              }
            }
          }
        }

        features = features.concat(trackFeatures);
      }
    }

    return features;
  }

  /**
   * Extracts metadata from a features' coordinates and sets them as properties.
   *
   * @param {Feature} feature
   * @param {ol.Coordinate} coordinate
   */
  parseMetadata(feature, coordinate) {
    var m = coordinate[3];
    var geometry = new Point(coordinate.slice(0, 3));
    feature.setGeometry(geometry);

    if (m) {
      // extensions contain metadata, so pull it off and add it to the feature
      var extensions = /** @type {Element} */ (m['extensions']);
      if (extensions) {
        var items = dom.getChildren(extensions);
        for (var i = 0, ii = items.length; i < ii; i++) {
          var item = items[i];
          feature.set(item.localName, item.textContent);
        }
      }

      // set the time. GPX time uses seconds from epoch, so convert to milliseconds.
      var time = /** @type {number} */ (m['time']);
      if (time != null) {
        feature.set('time', (new Date(1000 * time)).toISOString());
      }
    }
  }
}

/**
 * This overrides the OL3 parsing to utilize the M part of the XYZM coordinate format they use. The 4th coordinate in
 * each set is replaced with an object that has our time and metadata information on it. This is then parsed out later
 * to be put on each feature from a track.
 *
 * @param {Array} flatCoordinates Flat coordinates.
 * @param {ol.LayoutOptions} layoutOptions Layout options.
 * @param {Node} node Node.
 * @param {Object} values Values.
 * @return {Array} Flat coordinates.
 * @private
 */
GPX.appendCoordinate_ = function(flatCoordinates, layoutOptions, node, values) {
  // always include altitude, defaulting to 0
  var altitude = 0;
  layoutOptions.hasZ = true;

  // use altitude from the file if available, and delete the key so it isn't added to the feature by OL
  if (values['ele'] != null) {
    altitude = /** @type {number} */ (values['ele']);
    delete values['ele'];
  }

  // create the base coordinate as [lon, lat, alt]
  flatCoordinates.push(parseFloat(node.getAttribute('lon')), parseFloat(node.getAttribute('lat')), altitude);

  // if time is available, add it to the coordinate and delete the key(s) so they aren't added to the feature by OL
  if ('time' in values || 'extensionsNode_' in values) {
    flatCoordinates.push({
      'extensions': values['extensionsNode_'],
      'time': values['time']
    });
    delete values['extensionsNode_'];
    delete values['time'];
    layoutOptions.hasM = true;
  } else {
    // GPX.applyLayoutOptions_ assumes coordinates are parsed as XYZM and adjusts accordingly, so always
    // add a time component to the coordinates
    flatCoordinates.push(0);
  }

  return flatCoordinates;
};
