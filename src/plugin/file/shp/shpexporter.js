goog.provide('plugin.file.shp.SHPExporter');

goog.require('goog.log');
goog.require('ol.Feature');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.SimpleGeometry');
goog.require('os.array');
goog.require('os.data.OSDataManager');
goog.require('os.ex.ZipExporter');
goog.require('os.file.File');
goog.require('os.source.Vector');
goog.require('os.time.ITime');
goog.require('plugin.file.shp.data.SHPHeader');
goog.require('plugin.file.shp.ui.shpExportDirective');



/**
 * A SHP exporter
 *
 * @extends {os.ex.ZipExporter.<T>}
 * @constructor
 * @template T
 */
plugin.file.shp.SHPExporter = function() {
  plugin.file.shp.SHPExporter.base(this, 'constructor');
  this.log = plugin.file.shp.SHPExporter.LOGGER_;

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
   * @type {plugin.file.shp.data.SHPHeader}
   * @private
   */
  this.header_ = new plugin.file.shp.data.SHPHeader();

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
};
goog.inherits(plugin.file.shp.SHPExporter, os.ex.ZipExporter);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.file.shp.SHPExporter.LOGGER_ = goog.log.getLogger('plugin.file.shp.SHPExporter');


/**
 * PRJ content for WGS84.
 * @type {string}
 * @const
 */
plugin.file.shp.SHPExporter.PRJ_WGS84 = 'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",' +
    'SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]]';


/**
 * @inheritDoc
 */
plugin.file.shp.SHPExporter.prototype.getExtension = function() {
  return 'zip';
};


/**
 * @inheritDoc
 */
plugin.file.shp.SHPExporter.prototype.getLabel = function() {
  return 'SHP';
};


/**
 * @inheritDoc
 */
plugin.file.shp.SHPExporter.prototype.getMimeType = function() {
  return 'application/zip';
};


/**
 * @inheritDoc
 */
plugin.file.shp.SHPExporter.prototype.cancel = function() {};


/**
 * Get the feature's source.
 *
 * @param {ol.Feature} feature The feature
 * @return {os.source.Vector} The source
 * @private
 */
plugin.file.shp.SHPExporter.prototype.getSource_ = function(feature) {
  var source = null;
  if (feature) {
    var sourceId = feature.get(os.data.RecordField.SOURCE_ID);
    if (typeof sourceId === 'string') {
      source = /** @type {os.source.Vector} */ (os.osDataManager.getSource(sourceId));
    }
  }

  return source;
};


/**
 * Parse the column
 *
 * @param {T} item
 * @param {Object} col
 * @private
 * @template T
 */
plugin.file.shp.SHPExporter.prototype.parseColumn_ = function(item, col) {
  var name = col['name'];
  var field = col['field'];
  var value = item.get(field);
  var valueType = typeof value;

  // columns starting with '_' are considered private and will be ignored
  if (field.indexOf('_') != 0 && field != 'geometry') {
    // convert the value to a string
    if (value instanceof Date) {
      // os.time.ITime implementations override toString, so the else block will handle it
      value = value.toISOString();
    } else {
      value = goog.string.makeSafe(value);
      value = goog.string.trim(value);
    }

    // determine the column name to use in the shapefile
    if (!(name in this.columnName_)) {
      // can only be 10 characters with terminating null
      // so pad with null characters and truncate to 10 characters
      var fieldName = (name.replace(' ', '_') +
          '\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000').substr(0, 10);

      if (goog.object.containsValue(this.columnName_, fieldName)) {
        if (!(fieldName in this.columnNameCounter_)) {
          this.columnNameCounter_[fieldName] = 0;
        }
        this.columnNameCounter_[fieldName]++;

        // Since the 10char name is the same. attempt to make it unique
        fieldName = (fieldName.substr(0, 9) + String(this.columnNameCounter_[fieldName])).substr(0, 10);
      }

      this.columnName_[name] = fieldName;
    }

    // determine the maximum length for column values
    if (name in this.columnTypes_) {
      this.columnLengths_[name] = Math.min(Math.max(this.columnLengths_[name], value.length), 255);
    } else {
      this.columnLengths_[name] = Math.min(value.length, 255);
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
};


/**
 * @inheritDoc
 */
plugin.file.shp.SHPExporter.prototype.setItems = function(items) {
  plugin.file.shp.SHPExporter.base(this, 'setItems', items);

  // parse columns from the new items
  this.parseColumns();

  // reset the exporter
  this.extent_ = null;
  this.recNum_ = 0;
  this.shpType_ = -1;
  this.dvShp_ = null;
  this.dvDbf_ = null;
  this.dvShx_ = null;
};


/**
 * Parse the columns to include in the shapefile.
 *
 * @protected
 */
plugin.file.shp.SHPExporter.prototype.parseColumns = function() {
  this.columns_ = [];
  this.columnLengths_ = {};
  this.columnPrecisions_ = {};
  this.columnTypes_ = {};
  this.columnName_ = {};
  this.columnNameCounter_ = {};

  if (this.items && this.items.length > 0) {
    var item = this.items[0];
    var source = this.getSource_(item);
    var columns = source && source.getColumnsArray() || goog.object.getKeys(item.getProperties());

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
          if (columns[j]['visible'] && !goog.string.isEmptyOrWhitespace(goog.string.makeSafe(colNameField['name']))) {
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
          if (!goog.string.isEmptyOrWhitespace(goog.string.makeSafe(colNameField['name']))) {
            this.parseColumn_(item, colNameField);
          }
        }
      }
    }
  }
};


/**
 * Add the shapefile header
 */
plugin.file.shp.SHPExporter.prototype.appendHeader = function() {
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
};


/**
 * Allocate space for headers
 *
 * @private
 */
plugin.file.shp.SHPExporter.prototype.allocateArrays_ = function() {
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
      if (geom instanceof ol.geom.GeometryCollection) {
        os.array.forEach(geom.getGeometries(), function(geometry) {
          this.allocateItem_(item, /** @type {ol.geom.SimpleGeometry} */ (geometry));
        }, this);
      } else {
        this.allocateItem_(item, geom);
      }
    }
  }
};


/**
 * Allocate space for this item
 *
 * @param {T} item The item
 * @param {ol.geom.SimpleGeometry} geom
 * @private
 * @template T
 */
plugin.file.shp.SHPExporter.prototype.allocateItem_ = function(item, geom) {
  // Doesnt seem like shapefiles support multi polygon. Just polygons with multiple stuff (like holes)
  if (geom.getType() == ol.geom.GeometryType.MULTI_POLYGON) {
    geom = /** @type {ol.geom.MultiPolygon} */ (geom);
    os.array.forEach(geom.getPolygons(), function(polygon) {
      this.allocateItemForGeom_(item, polygon);
    }, this);
  } else if (geom.getType() == ol.geom.GeometryType.MULTI_POINT) {
    geom = /** @type {ol.geom.MultiPoint} */ (geom);
    os.array.forEach(geom.getPoints(), function(point) {
      this.allocateItemForGeom_(item, point);
    }, this);
  } else {
    this.allocateItemForGeom_(item, geom);
  }
};


/**
 * Allocate space for this item
 *
 * @param {T} item The item
 * @param {ol.geom.SimpleGeometry} geom
 * @private
 * @template T
 */
plugin.file.shp.SHPExporter.prototype.allocateItemForGeom_ = function(item, geom) {
  var geomType = geom.getType();
  this.isSupportedType_(geomType);

  this.header_.shx.allocation += 8;
  this.header_.allocation += 8;

  var recLength = 0;
  if (geomType == ol.geom.GeometryType.POINT) {
    var coord = geom.getCoordinates();
    recLength = 20;
    if (geom.getLayout() == 'XYZ' && coord[2] != 0) {
      recLength = 36;
    }
  } else if (geomType == ol.geom.GeometryType.LINE_STRING ||
      geomType == ol.geom.GeometryType.MULTI_LINE_STRING ||
      geomType == ol.geom.GeometryType.POLYGON) {
    var numParts = 1;
    var flatGroupCoords = [];
    if (geomType == ol.geom.GeometryType.LINE_STRING) {
      flatGroupCoords = geom.getCoordinates();
    } else {
      var coords = geom.getCoordinates();
      numParts = coords.length;

      // Flatten down the coordinates one level
      os.array.forEach(coords, function(coord) {
        os.array.forEach(coord, function(point) {
          flatGroupCoords.push(point);
        });
      });
    }

    var numPoints = flatGroupCoords.length;
    var partsLen = numParts * 4;
    var pointsLen = numPoints * 16;
    recLength = 44 + partsLen + pointsLen;

    if (geom.getLayout() == 'XYZ') {
      // add the z components if available
      for (var i = 0; i < flatGroupCoords.length; i++) {
        if (flatGroupCoords[i][2] != 0) {
          // 4 min max's (z & m) + 2x8xlength (z points, m points)
          recLength += (8 * 4) + (numPoints * 16);
          break;
        }
      }
    }
  }
  this.header_.allocation += recLength;

  // Add the DBF Metadata for this geometry
  os.array.forEach(this.columns_, function(col) {
    var name = col['name'];
    this.header_.dbf.allocation += this.columnLengths_[name];
  }, this);
  this.header_.dbf.allocation++;
};


/**
 * Append the SHP Header
 */
plugin.file.shp.SHPExporter.prototype.appendSHPHeader = function() {
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
};


/**
 * Append the DBF Header
 */
plugin.file.shp.SHPExporter.prototype.appendDBFHeader = function() {
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
  goog.object.forEach(this.columnLengths_, function(len) {
    recordSize += len;
  });

  // write record size
  this.dvDbf_.setUint16(10, recordSize + 1, true);

  // language driver ID (ANSI)
  this.dvDbf_.setUint16(29, 0x57, true);

  // write header (column info)
  os.array.forEach(this.columns_, function(col, index) {
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
};


/**
 * Append the SHX Header
 */
plugin.file.shp.SHPExporter.prototype.appendSHXHeader = function() {
  // file type
  this.dvShx_.setUint32(0, 9994);
  // file version
  this.dvShx_.setUint32(28, 1000, true);
  this.header_.shx.position = 100;
};


/**
 * Convert string to byte
 *
 * @param {DataView} dv
 * @param {number} pos - the position
 * @param {string} str - the string to conver to bytes
 */
plugin.file.shp.SHPExporter.prototype.writeMultiByte = function(dv, pos, str) {
  for (var i = 0; str && i < str.length; ++i) {
    dv.setUint8(pos, str.charCodeAt(i));
    pos++;
  }
};


/**
 * @inheritDoc
 */
plugin.file.shp.SHPExporter.prototype.processItems = function() {
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
    os.alertManager.sendAlert(skipMsg, os.alert.AlertEventSeverity.WARNING, this.log);
  }

  // only add the footer if one or more items were added, otherwise exporting the SHP will fail.
  if (skipped < this.items.length) {
    this.appendFooter();
  }
};


/**
 * Process a single item, returning a Placemark element to add to the SHP.
 *
 * @param {T} item The item
 * @return {boolean} If the item was added
 * @protected
 * @template T
 */
plugin.file.shp.SHPExporter.prototype.processItem = function(item) {
  var geom = this.getGeometry_(item);
  if (geom != null) {
    if (geom instanceof ol.geom.GeometryCollection) {
      os.array.forEach(geom.getGeometries(), function(geometry) {
        this.appendItem_(item, /** @type {ol.geom.SimpleGeometry} */ (geometry));
      }, this);
    } else {
      this.appendItem_(item, geom);
    }

    return true;
  }

  return false;
};


/**
 * Get the geometry for a feature.
 *
 * @param {ol.Feature} feature The feature
 * @return {ol.geom.GeometryCollection|ol.geom.SimpleGeometry|undefined}
 * @private
 */
plugin.file.shp.SHPExporter.prototype.getGeometry_ = function(feature) {
  var geometry;
  if (feature) {
    geometry = /** @type {(ol.geom.SimpleGeometry|undefined)} */ (feature.get(os.data.RecordField.GEOM));

    if (geometry) {
      geometry = /** @type {(ol.geom.SimpleGeometry|undefined)} */ (geometry.clone().toLonLat());

      if (this.exportEllipses_) {
        var ellipse = os.feature.createEllipse(feature);
        if (ellipse && !(ellipse instanceof ol.geom.Point)) {
          geometry = /** @type {(ol.geom.SimpleGeometry|undefined)} */ (ellipse);
        }
      }
    }
  }

  return geometry;
};


/**
 * Only put entries in if they are supported
 *
 * @param {ol.geom.GeometryType} type
 * @private
 */
plugin.file.shp.SHPExporter.prototype.isSupportedType_ = function(type) {
  if (type != ol.geom.GeometryType.POINT &&
      type != ol.geom.GeometryType.MULTI_POINT &&
      type != ol.geom.GeometryType.LINE_STRING &&
      type != ol.geom.GeometryType.MULTI_LINE_STRING &&
      type != ol.geom.GeometryType.MULTI_POLYGON &&
      type != ol.geom.GeometryType.POLYGON) {
    throw new Error(type + ' is not supported');
  }
};


/**
 * Add this geometry to the shape file
 *
 * @param {T} item The item
 * @param {ol.geom.SimpleGeometry} geom
 * @private
 * @template T
 */
plugin.file.shp.SHPExporter.prototype.appendItemForGeom_ = function(item, geom) {
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
      this.extent_ = ol.extent.extend(this.extent_, extent);
    } else {
      this.extent_ = ol.extent.clone(extent);
    }
  }

  var recLength = 0;
  var shapeType = -1;
  if (geomType == ol.geom.GeometryType.POINT) {
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
    var coord = geom.getCoordinates();
    shapeType = plugin.file.shp.TYPE.POINT;
    recLength = 20;
    if (geom.getLayout() == 'XYZ' && coord[2] != 0) {
      shapeType = plugin.file.shp.TYPE.POINTZ;
      recLength = 36;
    }

    this.dvShp_.setFloat64(recordStart + 4, coord[0], true);
    this.dvShp_.setFloat64(recordStart + 12, coord[1], true);
    if (shapeType == plugin.file.shp.TYPE.POINTZ) {
      this.dvShp_.setFloat64(recordStart + 20, coord[2], true);
    }
    // } else if (geom.getType() == ol.geom.GeometryType.MULTI_POINT) {
    //   /**
    //    * MultiPoint
    //    *                                                  Byte
    //    * Position   Field       Value     Type    Number    Order
    //    * Byte 0     Shape Type  8         Integer 1         Little
    //    * Byte 4     Box         Box       Double  4         Little
    //    * Byte 36    NumPoints   NumPoints Integer 1         Little
    //    * Byte 40    Points      Points    Point   NumPoints Little
    //    *
    //    * Byte X     Zmin        Zmin      Double  1         Little
    //    * Byte X+8   Zmax        Zmax      Double  1         Little
    //    * Byte X+16  Zarray      Zarray    Double  NumPoints Little
    //    * Byte Y*    Mmin        Mmin      Double  1         Little
    //    * Byte Y+8*  Mmax        Mmax      Double  1         Little
    //    * Byte Y+16* Marray      Marray    Double  NumPoints Little
    //    * Note: X = 40 + (16 * NumPoints); Y = X + 16 + (8 * NumPoints)
    //    */
    //   shapeType = plugin.file.shp.TYPE.MULTIPOINT;
    //   var coords = geom.getCoordinates();
    //   var numPoints = coords.length;
    //   var pointsLen = numPoints * 16;

    //   recLength = 40 + pointsLen;
    //   if (geom.getLayout() == 'XYZ') {
    //     for (var i = 0; i < coords.length; i++) {
    //       if (coords[i][2] != 0) {
    //         shapeType = plugin.file.shp.TYPE.MULTIPOINTZ;
    //         recLength += 16 + (16 * numPoints);
    //         break;
    //       }
    //     }
    //   }

    //   // Box
    //   this.dvShp_.setFloat64(recordStart + 4, extent[0], true);
    //   this.dvShp_.setFloat64(recordStart + 12, extent[1], true);
    //   this.dvShp_.setFloat64(recordStart + 20, extent[2], true);
    //   this.dvShp_.setFloat64(recordStart + 28, extent[3], true);

    //   // Num points
    //   this.dvShp_.setInt32(recordStart + 40, numPoints, true);

    //   // Points
    //   var pointsStart = recordStart + 40;
    //   var zpointsStart = pointsStart + pointsLen;
    //   os.array.forEach(coords, function(coord, index) {
    //     var offset = index * 16;
    //     this.dvShp_.setFloat64(pointsStart + offset, coord[0], true);
    //     this.dvShp_.setFloat64(pointsStart + offset + 8, coord[1], true);

  //     if (shapeType == plugin.file.shp.TYPE.MULTIPOINTZ) {
  //       this.dvShp_.setFloat64(zpointsStart + (8 * index), coord[2], true);
  //     }
  //   }, this);
  } else if (geomType == ol.geom.GeometryType.LINE_STRING ||
      geomType == ol.geom.GeometryType.MULTI_LINE_STRING ||
      geomType == ol.geom.GeometryType.POLYGON) {
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

    switch (geomType) {
      case ol.geom.GeometryType.LINE_STRING:
      case ol.geom.GeometryType.MULTI_LINE_STRING:
        shapeType = plugin.file.shp.TYPE.POLYLINE;
        break;
      case ol.geom.GeometryType.POLYGON:
        shapeType = plugin.file.shp.TYPE.POLYGON;
        break;
      default:
        break;
    }

    var numParts = 1;
    var flatGroupCoords = [];
    if (geomType == ol.geom.GeometryType.LINE_STRING) {
      flatGroupCoords = geom.getCoordinates();

      // Only 1 part for line strings
      this.dvShp_.setInt32(recordStart + 44, 0, true);
    } else {
      var coords = geom.getCoordinates();
      numParts = coords.length;

      // Flatten down the coordinates one level
      os.array.forEach(coords, function(coord) {
        os.array.forEach(coord, function(point) {
          flatGroupCoords.push(point);
        });
      });

      // Part Indexes
      var partStartIndex = 0;
      for (var i = 0; i < numParts; i++) {
        this.dvShp_.setInt32(recordStart + 44 + (i * 4), partStartIndex, true);
        partStartIndex += coords[i].length;
      }
    }

    var numPoints = flatGroupCoords.length;
    var partsLen = numParts * 4;
    var pointsLen = numPoints * 16;
    recLength = 44 + partsLen + pointsLen;

    if (geom.getLayout() == 'XYZ') {
      // add the z components if available
      for (var i = 0; i < flatGroupCoords.length; i++) {
        if (flatGroupCoords[i][2] != 0) {
          // 4 min max's (z & m) + 2x8xlength (z points, m points)
          recLength += (8 * 4) + (numPoints * 16);
          if (shapeType == plugin.file.shp.TYPE.POLYLINE) {
            shapeType = plugin.file.shp.TYPE.POLYLINEZ;
            break;
          } else {
            shapeType = plugin.file.shp.TYPE.POLYGONZ;
            break;
          }
        }
      }
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
    var pointsStart = recordStart + 44 + partsLen;
    var zpointsStart = pointsStart + pointsLen + (2 * 8);
    for (var i = 0; i < flatGroupCoords.length; i++) {
      var offset = i * 16;
      this.dvShp_.setFloat64(pointsStart + offset, flatGroupCoords[i][0], true);
      this.dvShp_.setFloat64(pointsStart + offset + 8, flatGroupCoords[i][1], true);

      if (shapeType == plugin.file.shp.TYPE.POLYLINEZ ||
          shapeType == plugin.file.shp.TYPE.POLYGONZ) {
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
  if (this.shpType_ < 0 || (this.shpType_ == plugin.file.shp.TYPE.POINT && shapeType != plugin.file.shp.TYPE.POINT)) {
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
};


/**
 * First check to see if this is a multipolygon and break it up
 *
 * @param {T} item The item
 * @param {ol.geom.SimpleGeometry} geom
 * @private
 * @template T
 */
plugin.file.shp.SHPExporter.prototype.appendItem_ = function(item, geom) {
  // Doesnt seem like shapefiles support multi polygon. Just polygons with multiple stuff (like holes)
  if (geom.getType() == ol.geom.GeometryType.MULTI_POLYGON) {
    geom = /** @type {ol.geom.MultiPolygon} */ (geom);
    os.array.forEach(geom.getPolygons(), function(polygon) {
      this.appendItemForGeom_(item, polygon);
    }, this);
  } else if (geom.getType() == ol.geom.GeometryType.MULTI_POINT) {
    geom = /** @type {ol.geom.MultiPoint} */ (geom);
    os.array.forEach(geom.getPoints(), function(point) {
      this.appendItemForGeom_(item, point);
    }, this);
  } else {
    this.appendItemForGeom_(item, geom);
  }
};


/**
 * Process a single item adding the metadata to the DBF file.
 * Do this for each geometry added even if its a duplicate
 *
 * @param {T} item The item
 * @private
 * @template T
 */
plugin.file.shp.SHPExporter.prototype.addMetadata_ = function(item) {
  os.array.forEach(this.columns_, function(col) {
    var name = col['name'];
    var field = col['field'];

    var value = item.get(field);
    value = value == null ? '' : value;

    if (field == os.data.RecordField.TIME && os.implements(value, os.time.ITime.ID)) {
      value = /** @type {os.time.ITime} */ (value).toISOString();
    } else {
      value = goog.string.makeSafe(value);
      value = goog.string.trim(value);
    }

    if (value.length > this.columnLengths_[name]) {
      value = value.substr(0, this.columnLengths_[name]);
    }

    this.writeMultiByte(this.dvDbf_, this.header_.dbf.position, value);

    // fill with nulls
    for (var i = value.length; i < this.columnLengths_[name]; ++i) {
      this.dvDbf_.setUint8(this.header_.dbf.position + i, 0x0);
    }

    this.header_.dbf.position += this.columnLengths_[name];
  }, this);
  this.dvDbf_.setUint8(this.header_.dbf.position, 0x20);
  this.header_.dbf.position++;
};


/**
 * Add the shapefile footer
 */
plugin.file.shp.SHPExporter.prototype.appendFooter = function() {
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

  var shpFile = new os.file.File();
  shpFile.setContent(this.header_.data.slice(0, this.header_.position));
  shpFile.setFileName(this.name + '.shp');
  this.addFile(shpFile);

  var dbfFile = new os.file.File();
  dbfFile.setContent(this.header_.dbf.data.slice(0, this.header_.dbf.position));
  dbfFile.setFileName(this.name + '.dbf');
  this.addFile(dbfFile);

  var shxFile = new os.file.File();
  shxFile.setContent(this.header_.shx.data.slice(0, this.header_.shx.position));
  shxFile.setFileName(this.name + '.shx');
  this.addFile(shxFile);

  var prjFile = new os.file.File();
  prjFile.setContent(plugin.file.shp.SHPExporter.PRJ_WGS84);
  prjFile.setFileName(this.name + '.prj');
  this.addFile(prjFile);
};


/**
 * @inheritDoc
 */
plugin.file.shp.SHPExporter.prototype.getUI = function() {
  return '<shpexport exporter="exporter"></shpexport>';
};


/**
 * Get if ellipses should be exported.
 *
 * @return {boolean}
 */
plugin.file.shp.SHPExporter.prototype.getExportEllipses = function() {
  return this.exportEllipses_;
};


/**
 * Set if ellipses should be exported.
 *
 * @param {boolean} value
 */
plugin.file.shp.SHPExporter.prototype.setExportEllipses = function(value) {
  this.exportEllipses_ = value;
};
