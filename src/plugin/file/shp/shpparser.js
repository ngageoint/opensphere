goog.declareModuleId('plugin.file.shp.SHPParser');

import Feature from 'ol/src/Feature.js';
import LineString from 'ol/src/geom/LineString.js';
import MultiLineString from 'ol/src/geom/MultiLineString.js';
import MultiPoint from 'ol/src/geom/MultiPoint.js';
import MultiPolygon from 'ol/src/geom/MultiPolygon.js';
import Point from 'ol/src/geom/Point.js';
import Polygon from 'ol/src/geom/Polygon.js';
import {getUid} from 'ol/src/util.js';
import ColumnDefinition from '../../../os/data/columndefinition.js';
import Fields from '../../../os/fields/fields.js';
import * as text from '../../../os/file/mime/text.js';
import * as mimeZip from '../../../os/file/mime/zip.js';
import * as geo from '../../../os/geo/geo.js';
import AsyncZipParser from '../../../os/parse/asynczipparser.js';
import DBFField from './data/dbffield.js';
import SHPHeader from './data/shpheader.js';
import {DBF_EXT_REGEXP, SHP_EXT_REGEXP} from './mime.js';
import * as shp from './shp.js';


const log = goog.require('goog.log');
const googString = goog.require('goog.string');



/**
 * A Shapefile parser
 *
 * @extends {AsyncZipParser<Feature>}
 */
export default class SHPParser extends AsyncZipParser {
  /**
   * Constructor.
   * @param {SHPParserConfig} config
   */
  constructor(config) {
    super();

    /**
     * @type {Array.<ColumnDefinition>}
     * @private
     */
    this.columns_ = [];

    /**
     * @type {SHPHeader}
     * @private
     */
    this.header_ = null;

    /**
     * @type {boolean}
     * @private
     */
    this.initialized_ = false;

    /**
     * @type {boolean}
     * @private
     */
    this.processingZip_ = false;

    /**
     * @type {Array.<ArrayBuffer>}
     * @private
     */
    this.source_ = [];
  }

  /**
   * @inheritDoc
   */
  cleanup() {
    this.header_ = null;
    this.initialized_ = false;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    this.cleanup();
    this.source_.length = 0;
  }

  /**
   * @return {Array.<ColumnDefinition>}
   */
  getColumns() {
    return this.columns_;
  }

  /**
   * @inheritDoc
   */
  hasNext() {
    return this.initialized_ && !!this.header_ && !!this.header_.data &&
        this.header_.position < this.header_.data.byteLength;
  }

  /**
   * @inheritDoc
   */
  parseNext() {
    var feature = null;

    try {
      /* Shape File Record Header (big endian)
       *                                                    Byte
       * Position  Field           Value           Type     Order
       * Byte 0    Record Number   Record Num      Integer  Big
       * Byte 4    Record Length   # 16-bit Words  Integer  Big
       * Byte 8    Start of Shape File Record
       */
      var dv = new DataView(this.header_.data.slice(this.header_.position, this.header_.position + 8));
      var recLen = dv.getUint32(4) * 2; // want bytes not words
      this.header_.curRecord = dv.getUint32(0);
      this.header_.position += 8;

      /* Shape File Record (little endian)
       *                                                      Byte
       * Position  Field           Value             Type     Order
       * Byte 0    Shape Type      0, *1, *3, *5     Integer  Little
       * Byte 4    Specific for each Shape Type
       */
      dv = new DataView(this.header_.data.slice(this.header_.position, this.header_.position + recLen));
      var shapeType = dv.getUint32(0, true);

      if (shapeType == shp.TYPE.POINT ||
          shapeType == shp.TYPE.POINTZ ||
          shapeType == shp.TYPE.POINTM) {
        feature = new Feature();

        /* Shape File Point Record (little endian)
         *                                          Byte
         * Position  Field       Value     Type     Order
         * Byte 0    Shape Type  *1        Integer  Little
         * Byte 4    Longitude   Degrees   Double   Little
         * Byte 12   Latitude    Degrees   Double   Little
         * Byte 20   End Record Normal Point
         *
         * The "M" adds:
         * Byte 20   M           M         Double   Little
         *
         * The "Z" adds:
         * Byte 20   Z           Z         Double   Little
         * Byte 28   M           M         Double   Little
         */
        var lon = dv.getFloat64(4, true);
        var lat = dv.getFloat64(12, true);
        var coords = [lon, lat];

        if (shapeType == shp.TYPE.POINTZ) {
          var alt = dv.getFloat64(20, true);
          coords.push(alt);
          feature.set(Fields.ALT, alt);
        }

        feature.set(Fields.LAT, lat);
        feature.set(Fields.LAT_DDM, geo.toDegreesDecimalMinutes(lat, false));
        feature.set(Fields.LAT_DMS, geo.toSexagesimal(lat, false));
        feature.set(Fields.LON, lon);
        feature.set(Fields.LON_DDM, geo.toDegreesDecimalMinutes(lon, true));
        feature.set(Fields.LON_DMS, geo.toSexagesimal(lon, true));

        // TODO: there should be a way to determine the projection from the SHP file rather than assuming EPSG:4326
        feature.setGeometry(new Point(coords).osTransform());
      } else if (shapeType === shp.TYPE.MULTIPOINT ||
          shapeType === shp.TYPE.MULTIPOINTM ||
          shapeType === shp.TYPE.MULTIPOINTZ) {
        feature = new Feature();

        /**
         * MultiPoint
         *                                                  Byte
         * Position   Field       Value     Type    Number    Order
         * Byte 0     Shape Type  8         Integer 1         Little
         * Byte 4     Box         Box       Double  4         Little
         * Byte 36    NumPoints   NumPoints Integer 1         Little
         * Byte 40    Points      Points    Point   NumPoints Little
         *
         * Byte X     Zmin        Zmin      Double  1         Little
         * Byte X+8   Zmax        Zmax      Double  1         Little
         * Byte X+16  Zarray      Zarray    Double  NumPoints Little
         * Byte Y*    Mmin        Mmin      Double  1         Little
         * Byte Y+8*  Mmax        Mmax      Double  1         Little
         * Byte Y+16* Marray      Marray    Double  NumPoints Little
         * Note: X = 40 + (16 * NumPoints); Y = X + 16 + (8 * NumPoints)
         */

        const numPoints = dv.getInt32(36, true);
        const pointsLen = numPoints * 16;

        const pointsStart = 40;
        const zStart = pointsStart + pointsLen + 16;

        const points = [];
        for (let i = 0; i < numPoints; i++) {
          const offset = i * 16;
          const lon = dv.getFloat64(pointsStart + offset, true);
          const lat = dv.getFloat64(pointsStart + offset + 8, true);
          const coordinate = [lon, lat];

          if (shapeType == shp.TYPE.MULTIPOINTZ) {
            const alt = dv.getFloat64(zStart + (i * 8), true);
            coordinate.push(alt);
          }

          points.push(coordinate);
        }

        const geom = new MultiPoint(points);
        feature.setGeometry(geom.osTransform());
      } else if (shapeType == shp.TYPE.POLYLINE ||
          shapeType == shp.TYPE.POLYGON ||
          shapeType == shp.TYPE.POLYLINEZ ||
          shapeType == shp.TYPE.POLYGONZ ||
          shapeType == shp.TYPE.POLYLINEM ||
          shapeType == shp.TYPE.POLYGONM) {
        feature = new Feature();

        /* Shape File Polyline/Polygon Record
         *                                                   Byte
         * Position  Field       Value            Type       Order
         * Byte 0    Shape Type  *3 or *5         Integer    Little
         * Byte 4    Min Lon     Degrees          Double     Little
         * Byte 12   Min Lat     Degrees          Double     Little
         * Byte 20   Max Lon     Degrees          Double     Little
         * Byte 28   Max Lat     Degrees          Double     Little
         * Byte 36   Num Parts   Num Parts        Integer    Little
         * Byte 40   Num Points  Num Points       Integer    Little
         * Byte 44   Parts[]     Start Indices    Integer    Little
         * Byte xx   Points[]    Lon & Lat Pairs  2 Doubles  Little
         *
         * The "Z" adds:
         * Byte Y    Zmin        Zmin             Double     Little
         * Byte Y+8  Zmax        Zmax             Double     Little
         * Byte Y+16 Z[]         Zarray           Doubles    Little
         *
         * The "M" adds:
         * Byte Y    Mmin        Mmin            Double      Little
         * Byte Y+8  Mmax        Mmax            Double      Little
         * Byte Y+16 M[]         Marray          Doubles     Little
         * Byte zz   End Record
         */
        var numParts = dv.getInt32(36, true);
        var numPoints = dv.getInt32(40, true);
        var partsLen = numParts * 4;
        var pointsLen = numPoints * 16;

        // read the start indices into the points array for each part
        var partIdx = [];
        for (var i = 0; i < numParts; i++) {
          var partStartIndex = dv.getInt32(44 + (i * 4), true);
          partIdx.push(partStartIndex);
        }

        if (partIdx.length == 0) {
          partIdx.push(0);
        }

        // TODO: this should be set up in the feature style config
        // feature.set('lineAlpha', this.config_['lineAlpha']);
        // feature.set('fillAlpha', this.config_['fillAlpha']);

        // parse the z components if available
        var zArray = null;
        if (shapeType == shp.TYPE.POLYLINEZ ||
            shapeType == shp.TYPE.POLYGONZ) {
          zArray = [];

          var zMinMax = 2 * 8;
          var zStart = 44 + partsLen + pointsLen + zMinMax;
          for (var i = 0; i < numPoints; i++) {
            var zVal = dv.getFloat64(zStart + (i * 8), true);
            zArray.push(zVal);
          }
        }

        // read parts for each polygon/polyline
        var parts = [];
        var pointsStart = 44 + partsLen;
        var zIdx = 0;
        for (var k = 0; k < partIdx.length; k++) {
          // read points for each part, ending at the next index or max points reached
          var points = [];
          var partEnd = k + 1 < partIdx.length ? partIdx[k + 1] : numPoints;
          for (var j = partIdx[k]; j < partEnd; j++, zIdx++) {
            // the start offset for each point is (index * 16), because each point is two doubles (lon/lat)
            var offset = j * 16;
            var lon = dv.getFloat64(pointsStart + offset, true);
            var lat = dv.getFloat64(pointsStart + offset + 8, true);
            if (!isNaN(lon) && !isNaN(lat)) {
              var coord = [lon, lat];
              if (zArray && zIdx < zArray.length && !isNaN(zArray[zIdx])) {
                coord.push(zArray[zIdx]);
              }

              points.push(coord);
            } else {
              this.logWarning_('Record #' + this.header_.curRecord + ' lat/lon could not be parsed!');
            }
          }

          parts.push(points);
        }

        var geom = null;
        if (shapeType == shp.TYPE.POLYGON || shapeType == shp.TYPE.POLYGONZ ||
            shapeType == shp.TYPE.POLYGONM) {
          if (parts.length > 1) {
            var rings = [];
            for (var i = 0; i < parts.length; i++) {
              // if the first ring is CCW, that's technically invalid but let's try to make it work...
              var p = parts[i];
              if (rings.length > 0 && geo.isCCW(p)) {
                rings[rings.length - 1].push(p);
              } else {
                rings.push([p]);
              }
            }

            geom = new MultiPolygon(rings);
          } else {
            geom = new Polygon(parts);
          }
        } else {
          geom = parts.length > 1 ? new MultiLineString(parts) : new LineString(parts[0]);
        }

        // TODO: there should be a way to determine the projection from the SHP file rather than assuming EPSG:4326
        // ^ There is, but it would require loading the .prj file. That's trivial from a zip but terrible when given the files one at a time.
        feature.setGeometry(geom.osTransform());
      } else if (shapeType != shp.TYPE.NULLRECORD) {
        // skip null records, but warn on unknown types
        this.logWarning_('Unsupported shape type (' + shapeType + ') encountered. ' +
            'Only POINT(1,11,21), MULTIPOINT(8,18,28), POLYLINE(3,13,23) & POLYGON(5,15,25) are supported');
      }

      if (feature && this.header_.dbf.data) {
        this.addFields_(feature);
      }

      this.header_.position += recLen;
    } catch (e) {
      throw e;
    }

    if (feature) {
      feature.setId(String(getUid(feature)));
    }

    if (!this.hasNext()) {
      this.closeZipReaders();
    }

    return feature;
  }

  /**
   * Adds metadata fields to a feature from the DBF file.
   *
   * @param {Feature} feature
   * @private
   */
  addFields_(feature) {
    var dbf = this.header_.dbf;
    var current = this.header_.curRecord;
    if (current <= dbf.numRecords) {
      var position = dbf.recordStart + (current - 1) * dbf.recordSize;
      for (var i = 0, n = dbf.fields.length; i < n; i++) {
        var field = dbf.fields[i];
        var fieldBuf = dbf.data.slice(position, position + field.length);
        var s = text.getText(fieldBuf);

        if (s) {
          var value = googString.trim(s);

          if (field.type == 'N') {
            value = Number(value);
            if (isNaN(value)) {
              value = null;
            }
          } else if (field.type == 'L') {
            value = Boolean(value);
          }

          feature.set(field.name, value);
        }

        position += field.length;
      }
    }
  }

  /**
   * Parses columns from the shapefile.
   *
   * @return {Array.<Feature>}
   */
  parsePreview() {
    var features = [];
    if (this.initialized_) {
      while (this.hasNext() && features.length < 50) {
        var feature = this.parseNext();
        if (feature) {
          features.push(feature);
        }
      }

      this.cleanup();
    }

    return features;
  }

  /**
   * @inheritDoc
   */
  setSource(source) {
    // reset necessary values
    this.initialized_ = false;
    this.processingZip_ = false;
    this.source_.length = 0;

    if (!source) {
      return;
    }

    if (Array.isArray(source)) {
      var i = source.length;
      while (i--) {
        if (source[i] instanceof ArrayBuffer) {
          this.source_.push(/** @type {ArrayBuffer} */ (source[i]));
        } else {
          this.logError_('Invalid SHP source!');
        }
      }
    } else if (source instanceof ArrayBuffer) {
      this.source_.push(/** @type {ArrayBuffer} */ (source));
    } else {
      this.logError_('Invalid SHP source!');
    }

    if (this.source_.length > 0) {
      this.initialize_();
    }
  }

  /**
   * Configures the parser using the provided file(s).
   *
   * @private
   */
  initialize_() {
    this.header_ = new SHPHeader();

    var i = this.source_.length;
    while (i--) {
      var source = this.source_[i];
      if (mimeZip.isZip(source)) {
        this.createZipReader(source);
      } else if (shp.isSHPFileType(source)) {
        if (!this.header_.data) {
          this.setupSHPFile_(source);
        } else {
          this.logWarning_('Ignoring extra SHP file while trying to parse a SHP/ZIP file.');
        }
      } else if (shp.isDBFFileType(source)) {
        if (!this.header_.dbf.data) {
          this.setupDBFFile_(source);
          this.updateColumns_();
        } else {
          this.logWarning_('Ignoring extra DBF file while parsing a SHP/ZIP file.');
        }
      }
    }

    if (!this.processingZip_) {
      if (!this.header_.data) {
        this.logError_('No valid SHP file found!');
        this.onError();
      } else if (!this.header_.dbf.data) {
        this.logError_('No valid DBF file found!');
        this.onError();
      } else {
        this.onReady();
      }
    }
  }

  /**
   * @inheritDoc
   */
  onError() {
    this.initialized_ = true;
    this.processingZip_ = false;
    super.onError();
  }

  /**
   * @inheritDoc
   */
  onReady() {
    this.initialized_ = true;
    this.processingZip_ = false;
    super.onReady();
  }

  /**
   * @param {string} msg
   * @private
   */
  logWarning_(msg) {
    log.warning(logger, msg);
  }

  /**
   * @param {string} msg
   * @private
   */
  logError_(msg) {
    log.error(logger, msg);
  }

  /**
   * @private
   */
  updateColumns_() {
    this.columns_.length = 0;

    if (this.header_ && this.header_.dbf) {
      var fields = this.header_.dbf.fields;
      for (var i = 0, n = fields.length; i < n; i++) {
        var col = new ColumnDefinition(fields[i].name);
        col['selectable'] = false;
        col['sortable'] = false;
        this.columns_.push(col);
      }
    }
  }

  /**
   * @inheritDoc
   */
  createZipReader(source) {
    this.processingZip_ = true;
    super.createZipReader(source);
  }

  /**
   * @inheritDoc
   */
  handleZipEntries(entries) {
    var foundSHP = false;
    var foundDBF = false;
    for (var i = 0, n = entries.length; i < n; i++) {
      // if the entry is a shp or dbf, load the content and process it. only use the first file encountered, which means
      // archives with multiple shapefiles will only load the first
      var entry = entries[i];
      if (!foundSHP && SHP_EXT_REGEXP.test(entry.filename)) {
        foundSHP = true;
        entry.getData(new zip.ArrayBufferWriter(), this.processZIPEntry_.bind(this, entry));
      } else if (!foundDBF && DBF_EXT_REGEXP.test(entry.filename)) {
        foundDBF = true;
        entry.getData(new zip.ArrayBufferWriter(), this.processZIPEntry_.bind(this, entry));
      }
    }

    if (!foundSHP) {
      this.logError_('No valid SHP file found!');
      this.onError();
    } else if (!foundDBF) {
      this.logError_('No valid DBF file found!');
      this.onError();
    }
  }

  /**
   * @param {zip.Entry} entry
   * @param {*} content
   * @private
   */
  processZIPEntry_(entry, content) {
    if (content instanceof ArrayBuffer) {
      content = /** @type {!ArrayBuffer} */ (content);
      if (SHP_EXT_REGEXP.test(entry.filename)) {
        this.setupSHPFile_(content);
      } else if (DBF_EXT_REGEXP.test(entry.filename)) {
        this.setupDBFFile_(content);
        this.updateColumns_();
      }
    }

    if (!this.initialized_ && this.header_ && this.header_.data && this.header_.dbf.data) {
      this.onReady();
    }
  }

  /**
   * @param {ArrayBuffer} source
   * @private
   */
  setupSHPFile_(source) {
    /* Shape File Header
     *                                                    Byte
     * Position  Field           Value           Type     Order
     * Byte 0    File Type       9994            Integer  Big
     * Byte 4    Unused?
     * Byte 24   File Length     # 16bit Words   Integer  Big
     * Byte 28   Version         1000            Integer  Little
     * Byte 32   Shape Type      0, *1, *3, *5   Integer  Little
     * Byte 36   Min Lon         Degrees         Double   Little
     * Byte 44   Min Lat         Degrees         Double   Little
     * Byte 52   Max Lon         Degrees         Double   Little
     * Byte 60   Max Lat         Degrees         Double   Little
     * Byte 68   Unused                          Double   Little
     * Byte 76   Unused                          Double   Little
     * Byte 84   Unused                          Double   Little
     * Byte 92   Unused                          Double   Little
     * Byte 100  End Of Header
     */
    var dv = new DataView(source);
    var version = dv.getUint32(28, true);
    if (version != 1000) {
      // not the correct version, bail!
      return;
    }

    if (this.header_) {
      this.header_.data = source;
      this.header_.position = 100;
    }
  }

  /**
   * @param {ArrayBuffer} source
   * @private
   */
  setupDBFFile_(source) {
    /**
     * The following is for dBASE Versions III Plus, IV, and 5.
     * @see https://www.loc.gov/preservation/digital/formats/fdd/fdd000325.shtml
     *
     *                                                                   Byte
     * Position   Field                          Units         Type      Order
     * Byte 0     Version                        Version       Byte      n/a
     * Byte 1     Year                           Year+1900     Byte      n/a
     * Byte 2     Month                          Month (1-12)  Byte      n/a
     * Byte 3     Date                           Date of Month Byte      n/a
     * Byte 4     NumRecords                     Count         Integer   Little
     * Byte 8     HeaderSize                     Bytes         Short     Little
     * Byte 10    RecordSize                     Bytes         Short     Little
     * Byte 12    reserved                                     Byte[2]   n/a
     * Byte 14    Incomplete transaction flag                  Byte      n/a
     * Byte 15    Encryption Flag                              Byte      n/a
     * Byte 16    Free record thread (reserved)                Byte[4]   n/a
     * Byte 20    Reserved for multi-user                      Byte[8]   n/a
     * Byte 28    MDX Flag (reserved)                          Byte      n/a
     * Byte 29    Language driver (reserved)                   Byte      n/a
     * Byte 30    Reserved                                     Byte[2]   n/a
     * Byte 32    Table Field descriptor Array                 Byte[32]  n/a
     * Byte 64-n  repeated for each field                      Byte[32]  n/a
     * Byte n     Terminator                     '0Dh'         Byte      n/a
     * Byte n+1   ASCII Records separated by a 'space' (20h)
     *
     * Within Fields
     * Byte 0    Field Name                                    Byte[11]  n/a
     * Byte 11   Field Type                                    Byte      n/a
     * Byte 16   Field Length                                  Byte      n/a
     */
    var dbf = this.header_ ? this.header_.dbf : null;
    if (!dbf) {
      return;
    }

    var dv = new DataView(source);
    dbf.numRecords = dv.getUint32(4, true);
    dbf.recordStart = dv.getUint16(8, true) + 1;
    dbf.recordSize = dv.getUint16(10, true);
    dbf.fields.length = 0;

    var position = 32;
    while (position < dbf.recordStart) {
      var name = text.getText(source.slice(position, position + 10));
      if (name.charCodeAt(0) == 0x0D) {
        break;
      }

      var type = String.fromCharCode(dv.getUint8(position + 11));
      var length = dv.getUint8(position + 16);
      name = googString.trim(name);
      dbf.fields.push(new DBFField(name, type, length));

      position += 32;
    }

    dbf.data = source;
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('plugin.file.shp.SHPParser');
