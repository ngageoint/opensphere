goog.declareModuleId('plugin.file.shp.SHPExporter');

import {clone, extend} from 'ol/src/extent.js';
import GeometryCollection from 'ol/src/geom/GeometryCollection.js';
import GeometryType from 'ol/src/geom/GeometryType.js';
import Point from 'ol/src/geom/Point.js';
import AlertEventSeverity from '../../../os/alert/alerteventseverity.js';
import AlertManager from '../../../os/alert/alertmanager.js';
import * as osArray from '../../../os/array/array.js';
import DataManager from '../../../os/data/datamanager.js';
import RecordField from '../../../os/data/recordfield.js';
import ZipExporter from '../../../os/ex/zipexporter.js';
import * as osFeature from '../../../os/feature/feature.js';
import OSFile from '../../../os/file/file.js';
import osImplements from '../../../os/implements.js';
import ITime from '../../../os/time/itime.js';
import SHPHeader from './data/shpheader.js';
import * as mime from './mime.js';
import {getFlatGroupCoordinates, getPartCoordinatesFromGeometry, getShapeTypeFromGeometry, TYPE} from './shp.js';
import {directiveTag as shpExportUi} from './ui/shpexportui.js';


const crypt = goog.require('goog.crypt');
const log = goog.require('goog.log');
const googObject = goog.require('goog.object');
const googString = goog.require('goog.string');



/**
 * A SHP exporter
 *
 * @extends {ZipExporter.<T>}
 * @template T
 */
export default class SHPExporter extends ZipExporter {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.log = logger;

    /**
     * Tell the abstract zipper to zip the files
     * @type {boolean}
     */
    this.compress = true;

    /**
     * Keep track of the column names because we can get dupes due to the 10 character name limitation.
     * @type {Object}
     * @private
     */
    this.columnName_ = {};

    /**
     * unique name counter
     * @type {Object}
     * @private
     */
    this.columnNameCounter_ = {};

    /**
     * @type {Object}
     * @private
     */
    this.columnTypes_ = {};
    /**
     * @type {Object}
     * @private
     */
    this.columnLengths_ = {};

    /**
     * @type {Object}
     * @private
     */
    this.columnPrecisions_ = {};

    /**
     * @type {Array}
     * @private
     */
    this.columns_ = [];

    /**
     * @type {SHPHeader}
     * @private
     */
    this.header_ = new SHPHeader();

    /**
     * @type {number}
     * @private
     */
    this.recNum_ = 0;

    /**
     * The global shape type for the shape file
     * @type {number}
     * @private
     */
    this.shpType_ = -1;

    /**
     * Export the ellipses
     * @type {boolean}
     * @private
     */
    this.exportEllipses_ = false;

    /**
     * The global extent that contains all extents
     * @type {ol.Extent}
     * @private
     */
    this.extent_ = null;

    /**
     * @type {DataView}
     * @private
     */
    this.dvShp_ = null;

    /**
     * @type {DataView}
     * @private
     */
    this.dvDbf_ = null;

    /**
     * @type {DataView}
     * @private
     */
    this.dvShx_ = null;
  }

  /**
   * @inheritDoc
   */
  getExtension() {
    return 'zip';
  }

  /**
   * @inheritDoc
   */
  getLabel() {
    return 'SHP';
  }

  /**
   * @inheritDoc
   */
  getMimeType() {
    return mime.ZIP_TYPE;
  }

  /**
   * @inheritDoc
   */
  cancel() {}

  /**
   * Get the feature's source.
   *
   * @param {Feature} feature The feature
   * @return {VectorSource} The source
   * @private
   */
  getSource_(feature) {
    var source = null;
    if (feature) {
      var sourceId = feature.get(RecordField.SOURCE_ID);
      if (typeof sourceId === 'string') {
        source = /** @type {VectorSource} */ (DataManager.getInstance().getSource(sourceId));
      }
    }

    return source;
  }

  /**
   * Parse the column
   *
   * @param {T} item
   * @param {Object} col
   * @private
   * @template T
   */
  parseColumn_(item, col) {
    var name = col['name'];
    var field = col['field'];
    var value = item.get(field);
    var valueType = typeof value;

    // columns starting with '_' are considered private and will be ignored
    if (field.indexOf('_') != 0 && field != 'geometry') {
      // convert the value to a string
      if (value instanceof Date) {
        // ITime implementations override toString, so the else block will handle it
        value = value.toISOString();
      } else {
        value = googString.makeSafe(value);
        value = googString.trim(value);
      }

      // determine the column name to use in the shapefile
      if (!(name in this.columnName_)) {
        // can only be 10 characters with terminating null
        // so pad with null characters and truncate to 10 characters
        var fieldName = (name.replace(' ', '_') +
            '\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000').substr(0, 10);

        if (googObject.containsValue(this.columnName_, fieldName)) {
          if (!(fieldName in this.columnNameCounter_)) {
            this.columnNameCounter_[fieldName] = 0;
          }
          this.columnNameCounter_[fieldName]++;

          // Since the 10char name is the same. attempt to make it unique
          fieldName = (fieldName.substr(0, 9) + String(this.columnNameCounter_[fieldName])).substr(0, 10);
        }

        this.columnName_[name] = fieldName;
      }
      var valueAsByteArrayLength = crypt.stringToUtf8ByteArray(value).length;

      // determine the maximum length for column values
      if (name in this.columnTypes_) {
        this.columnLengths_[name] = Math.min(Math.max(this.columnLengths_[name], valueAsByteArrayLength), 255);
      } else {
        this.columnLengths_[name] = Math.min(valueAsByteArrayLength, 255);
        this.columns_.push(col);
      }

      // determine the value type
      if (!(name in this.columnTypes_)) {
        if (valueType == 'boolean') {
          this.columnTypes_[name] = 'L';
        } else if (valueType == 'number') {
          this.columnTypes_[name] = 'N';
        } else {
          this.columnTypes_[name] = 'C';
        }
      } else if (this.columnTypes_[name] == 'L' && valueType != 'boolean') {
        this.columnTypes_[name] = 'C';
      } else if (this.columnTypes_[name] == 'N' && valueType != 'number') {
        this.columnTypes_[name] = 'C';
      }

      // determine the precision for numeric columns
      if (this.columnTypes_[name] == 'N' && value.match(/^[+-]?\d*\.\d+$/)) {
        var currentPrecision = this.columnPrecisions_[name] || 0;
        this.columnPrecisions_[name] = Math.min(Math.max(currentPrecision, value.replace(/^[+-]?\d*\./, '').length), 255);
      } else {
        this.columnPrecisions_[name] = 0;
      }
    }
  }

  /**
   * @inheritDoc
   */
  setItems(items) {
    super.setItems(items);

    // parse columns from the new items
    this.parseColumns();

    // reset the exporter
    this.extent_ = null;
    this.recNum_ = 0;
    this.shpType_ = -1;
    this.dvShp_ = null;
    this.dvDbf_ = null;
    this.dvShx_ = null;
  }

  /**
   * Parse the columns to include in the shapefile.
   *
   * @protected
   */
  parseColumns() {
    this.columns_ = [];
    this.columnLengths_ = {};
    this.columnPrecisions_ = {};
    this.columnTypes_ = {};
    this.columnName_ = {};
    this.columnNameCounter_ = {};

    if (this.items && this.items.length > 0) {
      var item = this.items[0];
      var source = this.getSource_(item);
      var columns = source && source.getColumnsArray() || googObject.getKeys(item.getProperties());

      for (var i = 0; i < this.items.length; i++) {
        item = this.items[i];

        if (source) {
          // Layer
          for (var j = 0; j < columns.length; j++) {
            var column = columns[j];
            var colNameField = {
              'name': column['name'],
              'field': column['field']
            };
            if (columns[j]['visible'] && !googString.isEmptyOrWhitespace(googString.makeSafe(colNameField['name']))) {
              this.parseColumn_(item, colNameField);
            }
          }
        } else {
          // Areas, other
          for (var j = 0; j < columns.length; j++) {
            var column = columns[j];
            var colNameField = {
              'name': column,
              'field': column
            };
            if (!googString.isEmptyOrWhitespace(googString.makeSafe(colNameField['name']))) {
              this.parseColumn_(item, colNameField);
            }
          }
        }
      }
    }
  }

  /**
   * Add the shapefile header
   */
  appendHeader() {
    // Dumb... better way?
    this.allocateArrays_();

    // With Array Buffers, we need to allocate all the space for the array before we set anything.
    this.header_.data = new ArrayBuffer(this.header_.allocation);
    this.header_.dbf.data = new ArrayBuffer(this.header_.dbf.allocation);
    this.header_.shx.data = new ArrayBuffer(this.header_.shx.allocation);

    this.dvShp_ = new DataView(this.header_.data);
    this.dvDbf_ = new DataView(this.header_.dbf.data);
    this.dvShx_ = new DataView(this.header_.shx.data);

    this.appendSHPHeader();
    this.appendDBFHeader();
    this.appendSHXHeader();
  }

  /**
   * Allocate space for headers
   *
   * @private
   */
  allocateArrays_() {
    // SHP
    this.header_.allocation = 100;

    // DBF
    var headerSize = 32 + (this.columns_.length * 32);
    this.header_.dbf.allocation = headerSize + 1;

    // SHX
    this.header_.shx.allocation = 100;

    // Items
    for (var i = 0, n = this.items.length; i < n; i++) {
      var item = this.items[i];
      var geom = this.getGeometry_(item);
      if (geom != null) {
        if (geom instanceof GeometryCollection) {
          osArray.forEach(geom.getGeometries(), function(geometry) {
            this.allocateItemForGeom_(item, /** @type {SimpleGeometry} */ (geometry));
          }, this);
        } else {
          this.allocateItemForGeom_(item, geom);
        }
      }
    }
  }

  /**
   * Allocate space for this item
   *
   * @param {T} item The item
   * @param {SimpleGeometry} geom
   * @private
   * @template T
   */
  allocateItemForGeom_(item, geom) {
    const geomType = geom.getType();
    this.isSupportedType_(geomType);

    this.header_.shx.allocation += 8;
    this.header_.allocation += 8;

    let recLength = 0;
    const shapeType = getShapeTypeFromGeometry(geom);
    if (geomType == GeometryType.POINT) {
      recLength = shapeType === TYPE.POINT ? 20 : 36;
    } else if (geomType == GeometryType.MULTI_POINT) {
      const coords = geom.getCoordinates();
      const numPoints = coords.length;
      const pointsLen = numPoints * 16;

      recLength = 40 + pointsLen;

      if (shapeType === TYPE.MULTIPOINTZ) {
        // 4 min max's (z & m) + 2x8xlength (z points, m points)
        recLength += (8 * 4) + (numPoints * 16);
      }
    } else if (geomType == GeometryType.LINE_STRING ||
        geomType == GeometryType.MULTI_LINE_STRING ||
        geomType == GeometryType.POLYGON ||
        geomType == GeometryType.MULTI_POLYGON) {
      const partCoordinates = getPartCoordinatesFromGeometry(geom);
      const numParts = partCoordinates.length;
      const flatGroupCoords = getFlatGroupCoordinates(partCoordinates);
      const numPoints = flatGroupCoords.length;
      const partsLen = numParts * 4;
      const pointsLen = numPoints * 16;

      recLength = 44 + partsLen + pointsLen;

      // add the z components if available
      if (shapeType === TYPE.POLYLINEZ || shapeType === TYPE.POLYGONZ) {
        // 4 min max's (z & m) + 2x8xlength (z points, m points)
        recLength += (8 * 4) + (numPoints * 16);
      }
    }

    this.header_.allocation += recLength;

    // Add the DBF Metadata for this geometry
    osArray.forEach(this.columns_, function(col) {
      var name = col['name'];
      this.header_.dbf.allocation += this.columnLengths_[name];
    }, this);
    this.header_.dbf.allocation++;
  }

  /**
   * Append the SHP Header
   */
  appendSHPHeader() {
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
    // file type
    this.dvShp_.setUint32(0, 9994);
    // file version
    this.dvShp_.setUint32(28, 1000, true);

    this.header_.position = 100;
  }

  /**
   * Append the DBF Header
   */
  appendDBFHeader() {
    /*                                                                  Byte
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
     * Byte 12   Field Type                                    Byte      n/a
     * Byte 16   Field Length                                  Byte      n/a
     */
    var headerSize = 32 + (this.columns_.length * 32);

    // version
    this.dvDbf_.setUint8(0, 3);

    var date = new Date();
    // Year
    this.dvDbf_.setUint8(1, date.getUTCFullYear() - 1900);
    // Month
    this.dvDbf_.setUint8(2, date.getUTCMonth() + 1);
    // Date
    this.dvDbf_.setUint8(3, date.getUTCDate());

    // write header size
    this.dvDbf_.setUint16(8, headerSize, true);

    // determine record size
    var recordSize = 0;
    googObject.forEach(this.columnLengths_, function(len) {
      recordSize += len;
    });

    // write record size
    this.dvDbf_.setUint16(10, recordSize + 1, true);

    // language driver ID (ANSI)
    this.dvDbf_.setUint16(29, 0x57, true);

    // write header (column info)
    osArray.forEach(this.columns_, function(col, index) {
      var startPos = 32 + index * 32;
      var name = col['name'];

      // Field Name
      this.writeMultiByte(this.dvDbf_, startPos, this.columnName_[name]);

      // Field Type
      this.writeMultiByte(this.dvDbf_, startPos + 11, this.columnTypes_[name]);
      // Field Length
      this.dvDbf_.setUint8(startPos + 16, this.columnLengths_[name]);
      // Field Precision
      this.dvDbf_.setUint8(startPos + 17, this.columnPrecisions_[name]);
    }, this);

    // position at end of header
    this.dvDbf_.setUint8(headerSize, 0x0D);
    // done with header, setup for records
    this.header_.dbf.position = headerSize + 1;
  }

  /**
   * Append the SHX Header
   */
  appendSHXHeader() {
    // file type
    this.dvShx_.setUint32(0, 9994);
    // file version
    this.dvShx_.setUint32(28, 1000, true);
    this.header_.shx.position = 100;
  }

  /**
   * Convert string to byte
   *
   * @param {DataView} dv
   * @param {number} pos - the position
   * @param {string} str - the string to convert to bytes
   * @return {number} the number of bytes written
   */
  writeMultiByte(dv, pos, str) {
    var ba = crypt.stringToUtf8ByteArray(str);
    for (var i = 0; ba && i < ba.length; ++i) {
      dv.setUint8(pos, ba[i]);
      pos++;
    }
    return ba.length;
  }

  /**
   * @inheritDoc
   */
  processItems() {
    this.appendHeader();

    var skipped = 0;
    for (var i = 0, n = this.items.length; i < n; i++) {
      if (!this.processItem(this.items[i])) {
        skipped++;
      }
    }

    // notify the user if any features were not included in the shapefile
    if (skipped > 0) {
      var skipMsg = 'Skipped ' + skipped + ' feature' + (skipped > 1 ? 's' : '') + ' that did not have a geometry.';
      AlertManager.getInstance().sendAlert(skipMsg, AlertEventSeverity.WARNING, this.log);
    }

    // only add the footer if one or more items were added, otherwise exporting the SHP will fail.
    if (skipped < this.items.length) {
      this.appendFooter();
    }
  }

  /**
   * Process a single item, returning a Placemark element to add to the SHP.
   *
   * @param {T} item The item
   * @return {boolean} If the item was added
   * @protected
   * @template T
   */
  processItem(item) {
    var geom = this.getGeometry_(item);
    if (geom != null) {
      if (geom instanceof GeometryCollection) {
        osArray.forEach(geom.getGeometries(), function(geometry) {
          this.appendItemForGeom_(item, /** @type {SimpleGeometry} */ (geometry));
        }, this);
      } else {
        this.appendItemForGeom_(item, geom);
      }

      return true;
    }

    return false;
  }

  /**
   * Get the geometry for a feature.
   *
   * @param {Feature} feature The feature
   * @return {GeometryCollection|SimpleGeometry|undefined}
   * @private
   */
  getGeometry_(feature) {
    var geometry;
    if (feature) {
      geometry = /** @type {(SimpleGeometry|undefined)} */ (feature.get(RecordField.GEOM));

      if (geometry) {
        geometry = /** @type {(SimpleGeometry|undefined)} */ (geometry.clone().toLonLat());

        if (this.exportEllipses_) {
          var ellipse = osFeature.createEllipse(feature);
          if (ellipse && !(ellipse instanceof Point)) {
            geometry = /** @type {(SimpleGeometry|undefined)} */ (ellipse);
          }
        }
      }
    }

    return geometry;
  }

  /**
   * Only put entries in if they are supported
   *
   * @param {GeometryType} type
   * @private
   */
  isSupportedType_(type) {
    if (type != GeometryType.POINT &&
        type != GeometryType.MULTI_POINT &&
        type != GeometryType.LINE_STRING &&
        type != GeometryType.MULTI_LINE_STRING &&
        type != GeometryType.MULTI_POLYGON &&
        type != GeometryType.POLYGON) {
      throw new Error(type + ' is not supported');
    }
  }

  /**
   * Add this geometry to the shape file
   *
   * @param {T} item The item
   * @param {SimpleGeometry} geom
   * @private
   * @template T
   */
  appendItemForGeom_(item, geom) {
    var geomType = geom.getType();
    this.isSupportedType_(geomType);

    // write offset
    this.dvShx_.setUint32(this.header_.shx.position, this.header_.position / 2); // words not bytes
    this.header_.shx.position += 4;

    /* Shape File Record Header (big endian)
     *                                                    Byte
     * Position  Field           Value           Type     Order
     * Byte 0    Record Number   Record Num      Integer  Big
     * Byte 4    Record Length   # 16-bit Words  Integer  Big
     * Byte 8    Start of Shape File Record
     */
    // write record number
    if (item.get('RECNUM')) {
      this.dvShp_.setUint32(this.header_.position, item.get('RECNUM'));
    } else {
      this.dvShp_.setUint32(this.header_.position, ++this.recNum_);
    }
    this.header_.position += 8;

    // save position for record length
    var recordStart = this.header_.position;
    var extent = geom.getExtent();

    // Make sure the global extent includes this extent
    if (extent) {
      if (this.extent_) {
        this.extent_ = extend(this.extent_, extent);
      } else {
        this.extent_ = clone(extent);
      }
    }

    let recLength = 0;
    const shapeType = getShapeTypeFromGeometry(geom);
    if (geomType == GeometryType.POINT) {
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
      const coord = geom.getCoordinates();
      recLength = 20;

      this.dvShp_.setFloat64(recordStart + 4, coord[0], true);
      this.dvShp_.setFloat64(recordStart + 12, coord[1], true);

      if (shapeType == TYPE.POINTZ) {
        // Add Z + M
        recLength = 36;
        this.dvShp_.setFloat64(recordStart + 20, coord[2], true);
      }
    } else if (geomType == GeometryType.MULTI_POINT) {
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
      const coords = geom.getCoordinates();
      const numPoints = coords.length;
      const pointsLen = numPoints * 16;

      recLength = 40 + pointsLen;

      if (shapeType === TYPE.MULTIPOINTZ) {
        // 4 min max's (z & m) + 2x8xlength (z points, m points)
        recLength += (8 * 4) + (numPoints * 16);
      }

      // Box
      this.dvShp_.setFloat64(recordStart + 4, extent[0], true);
      this.dvShp_.setFloat64(recordStart + 12, extent[1], true);
      this.dvShp_.setFloat64(recordStart + 20, extent[2], true);
      this.dvShp_.setFloat64(recordStart + 28, extent[3], true);

      // Num points
      this.dvShp_.setInt32(recordStart + 36, numPoints, true);

      // Points
      const pointsStart = recordStart + 40;
      const zStart = pointsStart + pointsLen + 16;

      coords.forEach(function(coord, index) {
        const pointOffset = index * 16;
        this.dvShp_.setFloat64(pointsStart + pointOffset, coord[0], true);
        this.dvShp_.setFloat64(pointsStart + pointOffset + 8, coord[1], true);

        if (shapeType == TYPE.MULTIPOINTZ) {
          const zOffset = index * 8;
          this.dvShp_.setFloat64(zStart + zOffset, coord[2], true);
        }
      }, this);
    } else if (geomType == GeometryType.LINE_STRING ||
        geomType == GeometryType.MULTI_LINE_STRING ||
        geomType == GeometryType.POLYGON ||
        geomType == GeometryType.MULTI_POLYGON) {
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
       * Note: xx = 44 + 4 * NumParts
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

      const partCoordinates = getPartCoordinatesFromGeometry(geom);
      const numParts = partCoordinates.length;
      const flatGroupCoords = getFlatGroupCoordinates(partCoordinates);

      // Part Indexes
      for (let i = 0, partStartIndex = 0; i < numParts; i++) {
        this.dvShp_.setInt32(recordStart + 44 + (i * 4), partStartIndex, true);
        partStartIndex += partCoordinates[i].length;
      }

      const numPoints = flatGroupCoords.length;
      const partsLen = numParts * 4;
      const pointsLen = numPoints * 16;

      recLength = 44 + partsLen + pointsLen;

      // add the z components if available
      if (shapeType === TYPE.POLYLINEZ || shapeType === TYPE.POLYGONZ) {
        // 4 min max's (z & m) + 2x8xlength (z points, m points)
        recLength += (8 * 4) + (numPoints * 16);
      }

      this.dvShp_.setFloat64(recordStart + 4, extent[0], true);
      this.dvShp_.setFloat64(recordStart + 12, extent[1], true);
      this.dvShp_.setFloat64(recordStart + 20, extent[2], true);
      this.dvShp_.setFloat64(recordStart + 28, extent[3], true);

      // Start Indices
      this.dvShp_.setInt32(recordStart + 36, numParts, true);

      // Lon & Lat Pairs
      this.dvShp_.setInt32(recordStart + 40, numPoints, true);

      // Points
      const pointsStart = recordStart + 44 + partsLen;
      const zpointsStart = pointsStart + pointsLen + (2 * 8);
      for (let i = 0; i < flatGroupCoords.length; i++) {
        const offset = i * 16;
        this.dvShp_.setFloat64(pointsStart + offset, flatGroupCoords[i][0], true);
        this.dvShp_.setFloat64(pointsStart + offset + 8, flatGroupCoords[i][1], true);

        if (shapeType === TYPE.POLYLINEZ || shapeType === TYPE.POLYGONZ) {
          this.dvShp_.setFloat64(zpointsStart + (i * 8), flatGroupCoords[i][2], true);
        }
      }
    }

    /* Shape File Record (little endian)
     *                                                      Byte
     * Position  Field           Value             Type     Order
     * Byte 0    Shape Type      0, *1, *3, *5     Integer  Little
     * Byte 4    Specific for each Shape Type
     */
    if (this.shpType_ < 0 || (this.shpType_ == TYPE.POINT && shapeType != TYPE.POINT)) {
      // write shape type in header
      this.shpType_ = shapeType;
      this.dvShp_.setUint32(32, this.shpType_, true);
    }

    // write record shape type
    this.dvShp_.setUint32(recordStart, shapeType, true);
    this.header_.position += recLength;

    this.dvShp_.setUint32(recordStart - 4, recLength / 2);
    this.dvShx_.setUint32(this.header_.shx.position, recLength / 2);
    this.header_.shx.position += 4;

    // Add the DBF Metadata for this geometry
    this.addMetadata_(item);
  }

  /**
   * Process a single item adding the metadata to the DBF file.
   * Do this for each geometry added even if its a duplicate
   *
   * @param {T} item The item
   * @private
   * @template T
   */
  addMetadata_(item) {
    osArray.forEach(this.columns_, function(col) {
      var name = col['name'];
      var field = col['field'];

      var value = item.get(field);
      value = value == null ? '' : value;

      if (field == RecordField.TIME && osImplements(value, ITime.ID)) {
        value = /** @type {ITime} */ (value).toISOString();
      } else {
        value = googString.makeSafe(value);
        value = googString.trim(value);
      }

      if (value.length > this.columnLengths_[name]) {
        value = value.substr(0, this.columnLengths_[name]);
      }

      var numBytes = this.writeMultiByte(this.dvDbf_, this.header_.dbf.position, value);

      // fill with nulls
      for (var i = numBytes; i < this.columnLengths_[name]; ++i) {
        this.dvDbf_.setUint8(this.header_.dbf.position + i, 0x0);
      }

      this.header_.dbf.position += this.columnLengths_[name];
    }, this);
    this.dvDbf_.setUint8(this.header_.dbf.position, 0x20);
    this.header_.dbf.position++;
  }

  /**
   * Add the shapefile footer
   */
  appendFooter() {
    // SHP file length. words not bytes
    this.dvShp_.setUint32(24, this.header_.position / 2);

    // SHP file min/max lon/lat
    this.dvShp_.setFloat64(36, this.extent_[0], true);
    this.dvShp_.setFloat64(44, this.extent_[1], true);
    this.dvShp_.setFloat64(52, this.extent_[2], true);
    this.dvShp_.setFloat64(60, this.extent_[3], true);

    // SHX file length. words not bytes
    this.dvShx_.setUint32(24, this.header_.shx.position / 2);

    // SHX file min/max lon/lat
    this.dvShx_.setFloat64(36, this.extent_[0], true);
    this.dvShx_.setFloat64(44, this.extent_[1], true);
    this.dvShx_.setFloat64(52, this.extent_[2], true);
    this.dvShx_.setFloat64(60, this.extent_[3], true);

    // SHX shape type
    this.dvShx_.setUint32(32, this.shpType_, true);

    // number of records
    this.dvDbf_.setUint32(4, this.recNum_, true);

    var shpFile = new OSFile();
    shpFile.setContent(this.header_.data.slice(0, this.header_.position));
    shpFile.setFileName(this.name + '.shp');
    this.addFile(shpFile);

    var dbfFile = new OSFile();
    dbfFile.setContent(this.header_.dbf.data.slice(0, this.header_.dbf.position));
    dbfFile.setFileName(this.name + '.dbf');
    this.addFile(dbfFile);

    var shxFile = new OSFile();
    shxFile.setContent(this.header_.shx.data.slice(0, this.header_.shx.position));
    shxFile.setFileName(this.name + '.shx');
    this.addFile(shxFile);

    var prjFile = new OSFile();
    prjFile.setContent(SHPExporter.PRJ_WGS84);
    prjFile.setFileName(this.name + '.prj');
    this.addFile(prjFile);

    var cpgFile = new OSFile();
    cpgFile.setContent(SHPExporter.CPG_UTF8);
    cpgFile.setFileName(this.name + '.cpg');
    this.addFile(cpgFile);
  }

  /**
   * @inheritDoc
   */
  getUI() {
    return `<${shpExportUi} exporter="exporter"></${shpExportUi}>`;
  }

  /**
   * Get if ellipses should be exported.
   *
   * @return {boolean}
   */
  getExportEllipses() {
    return this.exportEllipses_;
  }

  /**
   * Set if ellipses should be exported.
   *
   * @param {boolean} value
   */
  setExportEllipses(value) {
    this.exportEllipses_ = value;
  }
}

/**
 * Logger
 * @type {log.Logger}
 */
const logger = log.getLogger('plugin.file.shp.SHPExporter');


/**
 * PRJ content for WGS84.
 * @type {string}
 * @const
 */
SHPExporter.PRJ_WGS84 = 'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",' +
    'SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]]';

/**
 * Code Page content for WGS84.
 *
 * This is used to indicate the file encoding, and is provided in a side-car (.cpg) file.
 *
 * @type {string}
 * @const
 */
SHPExporter.CPG_UTF8 = 'UTF-8';
