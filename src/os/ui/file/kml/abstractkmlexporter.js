goog.provide('os.ui.file.kml.AbstractKMLExporter');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('goog.object');
goog.require('goog.string');
goog.require('ol.array');
goog.require('os.Fields');
goog.require('os.annotation');
goog.require('os.ex.ZipExporter');
goog.require('os.file.File');
goog.require('os.instanceOf');
goog.require('os.time');
goog.require('os.time.TimeInstant');
goog.require('os.time.TimeRange');
goog.require('os.ui.file.kml');
goog.require('os.ui.text.TuiEditor');
goog.require('os.xml');
goog.require('plugin.file.kml.KMLField');


/**
 * Abstract KML exporter
 *
 * @abstract
 * @extends {os.ex.ZipExporter<T>}
 * @constructor
 * @template T
 */
os.ui.file.kml.AbstractKMLExporter = function() {
  os.ui.file.kml.AbstractKMLExporter.base(this, 'constructor');
  this.log = os.ui.file.kml.AbstractKMLExporter.LOGGER_;
  this.compress = true;

  /**
   * The XML document.
   * @type {Document}
   * @protected
   */
  this.doc = null;

  /**
   * The name for the kml:Document.
   * @type {?string}
   * @protected
   */
  this.docName = null;

  /**
   * The kml:Document element.
   * @type {Element}
   * @protected
   */
  this.kmlDoc = null;

  /**
   * The KML namespace to use for export.
   * @type {string}
   * @protected
   */
  this.kmlNS = 'http://www.opengis.net/kml/2.2';

  /**
   * The KML gx extension namespace to use for export.
   * @type {string}
   * @protected
   */
  this.gxNS = 'http://www.google.com/kml/ext/2.2';

  /**
   * The KML os extension namespace to use for export.
   * @type {string}
   * @protected
   */
  this.osNS = plugin.file.kml.OS_NS;

  /**
   * @type {!Object<string, function(!Element, T)>}
   * @protected
   */
  this.elementProcessors = {};
  this.elementProcessors[os.ui.file.kml.ElementType.FOLDER] = this.processFolder.bind(this);
  this.elementProcessors[os.ui.file.kml.ElementType.PLACEMARK] = this.processPlacemark.bind(this);

  /**
   * The fields to export from each item.
   * @type {Array<string>}
   * @protected
   */
  this.fields = null;

  /**
   * The default kml:Folder to hold placemarks
   * @type {Element}
   * @protected
   */
  this.defaultFolder = null;

  /**
   * The default item field(s) to use for Placemark names.
   * @type {Array<*>}
   * @private
   */
  this.defaultLabelFields_ = null;

  /**
   * The item field(s) to use for Placemark names.
   * @type {!Object<string, Array<*>>}
   * @protected
   */
  this.labelMap = {};

  /**
   * The delimiter used to separate multiple labels.
   * @type {string}
   * @private
   */
  this.labelDelimiter_ = os.ui.file.kml.AbstractKMLExporter.LABEL_DELIMITER_;

  /**
   * The default icon to use for placemarks.
   * @type {os.ui.file.kml.Icon}
   * @private
   */
  this.defaultIcon_ = /** @type {os.ui.file.kml.Icon} */ (goog.object.clone(os.ui.file.kml.DEFAULT_ICON));

  /**
   * The icon to use for placemarks.
   * @type {?os.ui.file.kml.Icon}
   * @private
   */
  this.icon_ = null;

  /**
   * Map tracking which styles have been created.
   * @type {!Object<string, boolean>}
   * @private
   */
  this.styles_ = {};

  /**
   * If the item color should be used for icons.
   * @type {boolean}
   * @protected
   */
  this.useItemColor = true;

  /**
   * If the item icon should be used in place of the default.
   * @type {boolean}
   * @protected
   */
  this.useItemIcon = false;

  /**
   * If ellipses should be exported (when available).
   * @type {boolean}
   * @protected
   */
  this.exportEllipses = false;

  /**
   * If the ellipse center point should be included.
   * @type {boolean}
   * @protected
   */
  this.useCenterPoint = false;
};
goog.inherits(os.ui.file.kml.AbstractKMLExporter, os.ex.ZipExporter);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.file.kml.AbstractKMLExporter.LOGGER_ = goog.log.getLogger('os.ui.file.kml.AbstractKMLExporter');


/**
 * The delimiter used to separate multiple labels.
 * @type {string}
 * @private
 * @const
 */
os.ui.file.kml.AbstractKMLExporter.LABEL_DELIMITER_ = ' - ';


/**
 * @inheritDoc
 */
os.ui.file.kml.AbstractKMLExporter.prototype.reset = function() {
  os.ui.file.kml.AbstractKMLExporter.base(this, 'reset');
  this.doc = null;
  this.docName = null;
  this.kmlDoc = null;
  this.defaultFolder = null;

  this.defaultIcon_ = /** @type {os.ui.file.kml.Icon} */ (goog.object.clone(os.ui.file.kml.DEFAULT_ICON));
  this.icon_ = null;
  this.styles_ = {};
  this.labelMap = {};
};


/**
 * @inheritDoc
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getExtension = function() {
  return this.compress ? 'kmz' : 'kml';
};


/**
 * @inheritDoc
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getLabel = function() {
  return 'KML';
};


/**
 * @inheritDoc
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getMimeType = function() {
  return this.compress ? 'application/vnd.google-earth.kmz' : 'application/vnd.google-earth.kml+xml';
};


/**
 * Get the default icon to use for placemarks.
 *
 * @return {os.ui.file.kml.Icon}
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getDefaultIcon = function() {
  return this.defaultIcon_;
};


/**
 * Set the default icon to use for placemarks.
 *
 * @param {string} href The icon URI
 * @param {number=} opt_scale The icon scale
 * @param {Object=} opt_options
 */
os.ui.file.kml.AbstractKMLExporter.prototype.setDefaultIcon = function(href, opt_scale, opt_options) {
  this.defaultIcon_.href = href;

  if (typeof opt_options === 'object' && !isNaN(opt_options)) {
    this.defaultIcon_.options = opt_options;
  }

  if (typeof opt_scale === 'number' && !isNaN(opt_scale)) {
    this.defaultIcon_.scale = Math.max(0, opt_scale);
  }
};


/**
 * Get the name attribute for the Document element.
 *
 * @return {string}
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getDocName = function() {
  return this.docName || this.getName() || 'KML Document';
};


/**
 * Set the name attribute for the Document element.
 *
 * @param {string} name
 */
os.ui.file.kml.AbstractKMLExporter.prototype.setDocName = function(name) {
  this.docName = name;
};


/**
 * Get the default field(s) used for the Placemark name.
 *
 * @return {Array<*>}
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getDefaultLabelFields = function() {
  return this.defaultLabelFields_;
};


/**
 * Set the default field(s) used for the Placemark name.
 *
 * @param {Array<*>} value
 */
os.ui.file.kml.AbstractKMLExporter.prototype.setDefaultLabelFields = function(value) {
  this.defaultLabelFields_ = value;
};


/**
 * Get the delimiter used to separate multiple labels.
 *
 * @return {string}
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getLabelDelimiter = function() {
  return this.labelDelimiter_;
};


/**
 * Set the delimiter used to separate multiple labels.
 *
 * @param {string} value
 */
os.ui.file.kml.AbstractKMLExporter.prototype.setLabelDelimiter = function(value) {
  this.labelDelimiter_ = value;
};


/**
 * Get if the item color should be used for icons.
 *
 * @return {boolean}
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getUseItemColor = function() {
  return this.useItemColor;
};


/**
 * Set if the item color should be used for icons.
 *
 * @param {boolean} value
 */
os.ui.file.kml.AbstractKMLExporter.prototype.setUseItemColor = function(value) {
  this.useItemColor = value;
};


/**
 * Get if the item icon should be used instead of the default.
 *
 * @return {boolean}
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getUseItemIcon = function() {
  return this.useItemIcon;
};


/**
 * Set if the item icon should be used instead of the default.
 *
 * @param {boolean} value
 */
os.ui.file.kml.AbstractKMLExporter.prototype.setUseItemIcon = function(value) {
  this.useItemIcon = value;
};


/**
 * Get if ellipses should be exported.
 *
 * @return {boolean}
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getExportEllipses = function() {
  return this.exportEllipses;
};


/**
 * Set if ellipses should be exported.
 *
 * @param {boolean} value
 */
os.ui.file.kml.AbstractKMLExporter.prototype.setExportEllipses = function(value) {
  this.exportEllipses = value;
};


/**
 * Get if center points should be included in ellipses.
 *
 * @return {boolean}
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getUseCenterPoint = function() {
  return this.useCenterPoint;
};


/**
 * Set if center points should be included in ellipses.
 *
 * @param {boolean} value
 */
os.ui.file.kml.AbstractKMLExporter.prototype.setUseCenterPoint = function(value) {
  this.useCenterPoint = value;
};


/**
 * @inheritDoc
 */
os.ui.file.kml.AbstractKMLExporter.prototype.processItems = function() {
  this.doc = goog.dom.xml.createDocument('kml', this.kmlNS);

  var kml = /** @type {!Element} */ (goog.dom.getFirstElementChild(this.doc));

  var xmlnsUri = 'http://www.w3.org/2000/xmlns/';
  ol.xml.setAttributeNS(kml, xmlnsUri, 'xmlns:gx', this.gxNS);
  ol.xml.setAttributeNS(kml, xmlnsUri, 'xmlns:os', this.osNS);

  // create the Document element
  this.kmlDoc = os.xml.appendElementNS('Document', this.kmlNS, kml);
  os.xml.appendElementNS('name', this.kmlNS, this.kmlDoc, this.getDocName());
  os.xml.appendElementNS('visibility', this.kmlNS, this.kmlDoc, 1);

  // create the root Folder element
  this.defaultFolder = os.xml.createElementNS('Folder', this.kmlNS, this.doc);
  os.xml.appendElementNS('name', this.kmlNS, this.defaultFolder, this.getDocName());

  for (var i = 0, n = this.items.length; i < n; i++) {
    this.processItem(this.items[i]);
  }

  // if there is anything in the default folder other than the name element, add it to the document
  if (this.defaultFolder.childElementCount > 1) {
    this.kmlDoc.appendChild(this.defaultFolder);
  }

  var content = goog.dom.xml.serialize(this.doc);

  // serialize may not append the xml tag
  if (!goog.string.startsWith(content, '<?')) {
    content = '<?xml version="1.0"?>' + content;
  }

  var kmlFile = new os.file.File();
  kmlFile.setFileName(this.getName() + '.kml');
  kmlFile.setContent(content);
  this.addFile(kmlFile);
};


/**
 * Create the full label for an item from configured fields.
 *
 * @param {T} item The item
 * @return {?string}
 * @protected
 */
os.ui.file.kml.AbstractKMLExporter.prototype.createLabel = function(item) {
  var itemLabel = null;

  // try the group fields first
  var labelFields = this.getGroupLabels(item);
  if (labelFields) {
    itemLabel = this.extractLabelFromFields_(item, labelFields);
  }

  // if no label was produced, try the defaults
  if (!itemLabel && this.defaultLabelFields_) {
    itemLabel = this.extractLabelFromFields_(item, this.defaultLabelFields_);
  }

  return itemLabel;
};


/**
 * Create the full label for an item from configured fields.
 *
 * @param {T} item The item
 * @param {Array<*>} labelFields The label fields
 * @return {?string}
 * @private
 */
os.ui.file.kml.AbstractKMLExporter.prototype.extractLabelFromFields_ = function(item, labelFields) {
  if (labelFields) {
    var labelParts = [];
    for (var i = 0; i < labelFields.length; i++) {
      var label = this.getItemLabel(item, labelFields[i]);
      if (label) {
        labelParts.push(label);
      }
    }

    // only change the name if there are actually labels to display, otherwise use the default. we'll need to rework
    // this if users don't want a label at all unless configured in the application.
    if (labelParts.length > 0) {
      // Google Earth doesn't support multi-line labels, so separate them with a delimiter
      return labelParts.join(this.labelDelimiter_);
    }
  }

  return null;
};


/**
 * Process a single item, returning a KML element to add to the document.
 *
 * @param {T} item The item
 * @protected
 * @template T
 */
os.ui.file.kml.AbstractKMLExporter.prototype.processItem = function(item) {
  var parent = this.getParent(item);
  if (parent) {
    var elementType = this.getElementType(item);
    if (elementType && this.elementProcessors[elementType]) {
      var itemId = this.getId(item);
      var element = os.xml.appendElementNS(elementType, this.kmlNS, parent, undefined, {
        'id': itemId
      });

      var name = this.createLabel(item);
      if (name) {
        // only add the name element if a label was created, because the name is used for the displayed label in Google
        // Earth. showing id's is both not helpful and produces clutter, though it will result in showing [no name] for
        // everything in the GE tree. Opensphere will use the Placemark id for the tree if a name isn't found.
        os.xml.appendElementNS('name', this.kmlNS, element, name);
      }

      var processElement = this.elementProcessors[elementType];
      processElement(element, item);
    }
  }
};


/**
 * Process a Folder element to add to the KML.
 *
 * @param {!Element} element The Placemark element
 * @param {T} item The item
 * @protected
 * @template T
 */
os.ui.file.kml.AbstractKMLExporter.prototype.processFolder = function(element, item) {
  var visibility = this.isItemVisible(item) ? 1 : 0;
  os.xml.appendElementNS('visibility', this.kmlNS, element, visibility);

  var children = this.getChildren(item);
  if (children) {
    for (var i = 0; i < children.length; i++) {
      this.processItem(/** @type {T} */ (children[i]));
    }
  }
};


/**
 * Process a Placemark element to add to the KML.
 *
 * @param {!Element} element The Placemark element
 * @param {T} item The item
 * @protected
 * @template T
 */
os.ui.file.kml.AbstractKMLExporter.prototype.processPlacemark = function(element, item) {
  var styleId = this.getStyleId(item);
  if (!goog.string.isEmptyOrWhitespace(goog.string.makeSafe(styleId))) {
    os.xml.appendElementNS('styleUrl', this.kmlNS, element, '#' + styleId);
  }

  var pStyleEl = this.createPlacemarkMergedStyle(element, item);
  if (pStyleEl) {
    element.appendChild(pStyleEl);
  }

  var visibility = this.isItemVisible(item) ? 1 : 0;
  os.xml.appendElementNS('visibility', this.kmlNS, element, visibility);

  var ed = os.xml.createElementNS('ExtendedData', this.kmlNS, this.doc);

  var time = this.getTime(item);
  if (time) {
    // don't create the time element until we know it will have something in it
    var ts;

    if (os.instanceOf(time, os.time.TimeRange.NAME)) {
      time = /** @type {os.time.TimeRange} */ (time);

      var start = time.getStart();
      if (start && start != os.time.TimeInstant.MIN_TIME) {
        ts = ts || os.xml.appendElementNS('TimeSpan', this.kmlNS, element);
        os.xml.appendElementNS('begin', this.kmlNS, ts,
            os.time.format(new Date(start), undefined, undefined, true));
      }

      var end = time.getEnd();
      if (end && end != os.time.TimeInstant.MAX_TIME) {
        ts = ts || os.xml.appendElementNS('TimeSpan', this.kmlNS, element);
        os.xml.appendElementNS('end', this.kmlNS, ts, os.time.format(new Date(end), undefined, undefined, true));
      }
    } else {
      var start = time.getStart();
      if (start && start != os.time.TimeInstant.MIN_TIME) {
        ts = os.xml.appendElementNS('TimeStamp', this.kmlNS, element);
        os.xml.appendElementNS('when', this.kmlNS, ts, os.time.format(new Date(start), undefined, undefined, true));
      }
    }

    var timeEl = os.xml.appendElementNS('Data', this.kmlNS, ed, undefined, {
      'name': os.Fields.TIME
    });
    os.xml.appendElementNS('value', this.kmlNS, timeEl, time.toString());
  }

  this.addGeometryNode(item, element);

  var fields = this.getFields(item);
  if (fields && fields.length > 0) {
    var descEl;
    for (var i = 0, n = fields.length; i < n; i++) {
      var val = this.getField(item, fields[i]);
      if (val != null) {
        if (descEl === undefined && typeof val === 'string' && os.fields.DESC_REGEXP.test(fields[i])) {
          // strip out carriage returns, because screw windows
          val.replace(/\r/g, '');

          if (!goog.string.isEmptyOrWhitespace(goog.string.makeSafe(val))) {
            descEl = os.xml.appendElementNS('description', this.kmlNS, element);

            var cdata = this.doc.createCDATASection(val);
            descEl.appendChild(cdata);
          }
        } else if (os.object.isPrimitive(val)) {
          var dataEl = os.xml.appendElementNS('Data', this.kmlNS, ed, undefined, {
            'name': fields[i]
          });
          os.xml.appendElementNS('value', this.kmlNS, dataEl, String(val));
        } else if (plugin.file.kml.JsonField.indexOf(fields[i]) > -1) {
          // write anything in this array as a serialized JSON value
          var dataEl = os.xml.appendElementNS('Data', this.kmlNS, ed, undefined, {
            'name': fields[i]
          });
          os.xml.appendElementNS('value', this.kmlNS, dataEl, JSON.stringify(val));
        }
      }
    }

    // Some fields do not get automatically exported (e.g., fields that are not visible)
    // if the rotation column is one of those fields create its data element here
    var rotationColumn = this.getRotationColumn(item);
    if (!!rotationColumn && !ol.array.includes(fields, rotationColumn)) {
      var rotDataEl = os.xml.appendElementNS('Data', this.kmlNS, ed, undefined, {
        'name': rotationColumn
      });
      os.xml.appendElementNS('value', this.kmlNS, rotDataEl, String(this.getField(item, rotationColumn)));
    }

    // Add line dash info as custom element since kml doesn't support it
    var lineDash = this.getLineDash(item);
    if (lineDash && Array.isArray(lineDash) && lineDash.length) {
      var lineDashDataEl = os.xml.appendElementNS('Data', this.kmlNS, ed, undefined, {
        'name': 'lineDash'
      });
      os.xml.appendElementNS('value', this.kmlNS, lineDashDataEl, JSON.stringify(lineDash));
    }
  }

  if (ed.childElementCount > 0) {
    element.appendChild(ed);
  }
};


/**
 * Create placemark specific merged style.
 *
 * @param {!Element} placemarkEl The placemark element
 * @param {T} item The item
 * @return {?Element} The merged style element
 * @protected
 * @template T
 */
os.ui.file.kml.AbstractKMLExporter.prototype.createPlacemarkMergedStyle = function(placemarkEl, item) {
  var styleEl = null;

  var rotationColumn = this.getRotationColumn(item);
  if (rotationColumn) {
    var heading = /** @type {number} */ (this.getField(item, rotationColumn));
    if (!isNaN(heading)) {
      styleEl = styleEl || os.xml.createElementNS('Style', this.kmlNS, this.doc);
      var iconStyleEl = os.xml.appendElementNS('IconStyle', this.kmlNS, styleEl);
      os.xml.appendElementNS('heading', this.kmlNS, iconStyleEl, heading % 360);
    }
  }

  var balloonOptions = this.getBalloonOptions(item);
  if (balloonOptions && balloonOptions.text) {
    styleEl = styleEl || os.xml.createElementNS('Style', this.kmlNS, this.doc);
    this.writeBalloonStyle(styleEl, balloonOptions);
  }

  return styleEl;
};


/**
 * Adds an item's geometry to its Placemark.
 *
 * @param {T} item The item
 * @param {!Node} node The kml:Placemark node
 * @protected
 *
 * @suppress {accessControls} To allow access to private OL3 KML format constructs.
 */
os.ui.file.kml.AbstractKMLExporter.prototype.addGeometryNode = function(item, node) {
  var geometry = this.getGeometry(item);
  if (geometry) {
    var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
    ol.xml.pushSerializeAndPop(context, ol.format.KML.PLACEMARK_SERIALIZERS_,
        ol.format.KML.GEOMETRY_NODE_FACTORY_, [geometry], []);
  }
};


/**
 * Gets the style id for an item, creating a style if necessary.
 *
 * @param {T} item The item
 * @param {string} styleId The style id
 * @param {string} color The item color
 * @param {?string} fillColor The item fill color
 * @param {?string} strokeColor The item fill color
 * @param {os.ui.file.kml.Icon=} opt_icon The item icon
 * @protected
 */
os.ui.file.kml.AbstractKMLExporter.prototype.createStyle = function(item, styleId, color, fillColor, strokeColor,
    opt_icon) {
  var styleEl = os.xml.createElementNS('Style', this.kmlNS, this.doc, undefined, {
    'id': styleId
  });

  // all styles will have an IconStyle element, so create that first
  var iconStyleEl = os.xml.appendElementNS('IconStyle', this.kmlNS, styleEl);

  if (opt_icon != null) {
    // icon/point style
    if (this.useItemColor) {
      // override the icon color with the item's color
      os.xml.appendElementNS('color', this.kmlNS, iconStyleEl, color);
    }

    if (opt_icon.scale != null) {
      os.xml.appendElementNS('scale', this.kmlNS, iconStyleEl, opt_icon.scale);
    }

    if (opt_icon.options != null) {
      var el = os.xml.appendElementNS('os:iconOptions', this.osNS, iconStyleEl, ' ');

      var cdata = this.doc.createCDATASection(JSON.stringify(opt_icon.options));
      el.appendChild(cdata);
    }

    // add the icon href
    var iconEl = os.xml.appendElementNS('Icon', this.kmlNS, iconStyleEl);
    var iconUri = opt_icon.href;
    os.xml.appendElementNS('href', this.kmlNS, iconEl, iconUri);
  } else {
    // default style - apply the item's color to everything
    os.xml.appendElementNS('color', this.kmlNS, iconStyleEl, color);
  }

  var lineStyleEl = os.xml.appendElementNS('LineStyle', this.kmlNS, styleEl);
  os.xml.appendElementNS('color', this.kmlNS, lineStyleEl, strokeColor || color);
  os.xml.appendElementNS('width', this.kmlNS, lineStyleEl, 2);

  var polyStyleEl = os.xml.appendElementNS('PolyStyle', this.kmlNS, styleEl);
  os.xml.appendElementNS('color', this.kmlNS, polyStyleEl, fillColor || color);
  os.xml.appendElementNS('fill', this.kmlNS, polyStyleEl, this.getFill(item) && fillColor ? 1 : 0);
  os.xml.appendElementNS('outline', this.kmlNS, polyStyleEl, this.getStroke(item) && strokeColor ? 1 : 0);

  var firstFolder = this.kmlDoc.querySelector('Folder');
  if (firstFolder) {
    // add the style before the first Folder node
    goog.dom.insertSiblingBefore(styleEl, firstFolder);
  } else {
    // no folder, so just append it
    this.kmlDoc.appendChild(styleEl);
  }
  this.styles_[styleId] = true;
};


/**
 * Get the children of an item.
 *
 * @param {T} item The item
 * @return {Array<T>} The item's children
 * @protected
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getChildren = function(item) {
  return null;
};


/**
 * Get the color of an item. This should return an ABGR string that can be dropped directly into the KML.
 *
 * @abstract
 * @param {T} item The item
 * @return {string} The item's color as an ABGR string
 * @protected
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getColor = function(item) {};


/**
 * Gets whether or not to fill the item
 * @param {T} item The item
 * @return {boolean}
 * @protected
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getFill = function(item) {
  return false;
};


/**
 * Gets whether or not to stroke the item
 * @param {T} item The item
 * @return {boolean}
 * @protected
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getStroke = function(item) {
  return true;
};


/**
 * Get the fill color of an item. This should return an ABGR string that can be dropped directly into the KML.
 * @abstract
 * @param {T} item The item
 * @return {?string} The item's fill color as an ABGR string
 * @protected
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getFillColor = function(item) {};


/**
 * Get the stroke color of an item. This should return an ABGR string that can be dropped directly into the KML.
 * @abstract
 * @param {T} item The item
 * @return {?string} The item's stroke color as an ABGR string
 * @protected
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getStrokeColor = function(item) {};


/**
 * Get the type of KML element represented by the item.
 *
 * @param {T} item The item
 * @return {os.ui.file.kml.ElementType}
 * @protected
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getElementType = function(item) {
  return os.ui.file.kml.ElementType.PLACEMARK;
};


/**
 * Get the fields to export for an item.
 *
 * @param {T} item The item
 * @return {Array<string>} The fields to export
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getFields = function(item) {
  return this.fields;
};


/**
 * @inheritDoc
 */
os.ui.file.kml.AbstractKMLExporter.prototype.setFields = function(value) {
  this.fields = value;
};


/**
 * Get the geometry for an item.
 *
 * @abstract
 * @param {T} item The item
 * @return {(ol.geom.Geometry|undefined)}
 * @protected
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getGeometry = function(item) {};


/**
 * Get the icon rotation column.
 *
 * @abstract
 * @param {T} item The item
 * @return {string|null|undefined}
 * @protected
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getRotationColumn = function(item) {};


/**
 * Get the line dash.
 *
 * @abstract
 * @param {T} item The item
 * @return {Array<number>|null|undefined}
 * @protected
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getLineDash = function(item) {};


/**
 * Get the id of an item.
 *
 * @param {T} item The item
 * @return {os.ui.file.kml.Icon} The icon representing the item
 * @protected
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getIcon = function(item) {
  return this.icon_ ? this.icon_ : this.defaultIcon_;
};


/**
 * set the icon
 *
 * @param {os.ui.file.kml.Icon} icon The icon
 */
os.ui.file.kml.AbstractKMLExporter.prototype.setIcon = function(icon) {
  this.icon_ = icon;
};


/**
 * Get the id of an item.
 *
 * @abstract
 * @param {T} item The item
 * @return {string} The item's id
 * @protected
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getId = function(item) {};


/**
 * Get the field value from an item.
 *
 * @abstract
 * @param {T} item The item
 * @param {string} field The field
 * @return {*} The value
 * @protected
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getField = function(item, field) {};


/**
 * Gets the label fields to use in the Placemark name.
 *
 * @param {T} item The item
 * @param {*} labelField
 * @return {?string} null if no label
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getItemLabel = function(item, labelField) {
  if (typeof labelField == 'string') {
    return /** @type {string|undefined} */ (this.getField(item, labelField)) || null;
  }

  return null;
};


/**
 * If the item is visible.
 *
 * @param {T} item The item
 * @return {boolean}
 */
os.ui.file.kml.AbstractKMLExporter.prototype.isItemVisible = function(item) {
  return true;
};


/**
 * If the item is one of the root items being exported.
 *
 * @param {T} item The item
 * @return {boolean}
 */
os.ui.file.kml.AbstractKMLExporter.prototype.isRootItem = function(item) {
  return this.items != null && this.items.indexOf(item) > -1;
};


/**
 * Gets the parent element for the provided item.
 *
 * @param {T} item The item
 * @return {Element} The parent element.
 * @protected
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getParent = function(item) {
  // use the default kml:Folder. applications can provide their own behavior.
  return this.defaultFolder;
};


/**
 * Get all properties from an item.
 *
 * @abstract
 * @param {T} item The item
 * @return {Object<string, *>} The item's properties
 * @protected
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getProperties = function(item) {};


/**
 * Gets the style id for an item, creating a style if necessary.
 *
 * @param {T} item The item
 * @return {string} The style id for the item
 * @protected
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getStyleId = function(item) {
  var type = this.getStyleType(item);
  var styleParts = [type];
  var styleId;

  // color is only used in the style if overriding the icon color or using the default style type
  var color = this.getColor(item);
  if (this.useItemColor || type == os.ui.file.kml.StyleType.DEFAULT) {
    styleParts.push(color);
  }

  var fillColor = this.getFillColor(item);
  if (this.useItemColor || type == os.ui.file.kml.StyleType.DEFAULT) {
    styleParts.push(fillColor);
  }

  var strokeColor = this.getStrokeColor(item);
  if (this.useItemColor || type == os.ui.file.kml.StyleType.DEFAULT) {
    styleParts.push(strokeColor);
  }

  var icon = type == os.ui.file.kml.StyleType.DEFAULT ? undefined : this.getIcon(item);
  if (type == os.ui.file.kml.StyleType.ICON && this.useItemIcon) {
    // override the default icon with the item's icon
    icon = this.getIcon(item);

    // use the hashcode since a URL may contain restricted characters for an XML attribute
    styleParts.push(String(goog.string.hashCode(icon.href)));

    if (typeof icon.scale === 'number' && icon.scale != 1) {
      styleParts.push(String(icon.scale));
    }
  }

  // hyphen separate the id components
  styleId = styleParts.join('-');

  if (!(styleId in this.styles_)) {
    this.createStyle(item, styleId, color, fillColor, strokeColor, icon);
  }

  return styleId;
};


/**
 * Gets the style type for an item.
 *
 * @abstract
 * @param {T} item The item
 * @return {string} The style type for the item
 * @protected
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getStyleType = function(item) {};


/**
 * Gets the time associated with the provided item.
 *
 * @abstract
 * @param {T} item The item
 * @return {os.time.ITime} The item's time
 * @protected
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getTime = function(item) {};


/**
 * Gets the label fields to use in the Placemark name.
 *
 * @param {T} item The item
 * @return {Array<*>} null if no label fields
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getGroupLabels = function(item) {
  return null;
};


/**
 * Get the KML balloon style options for the item.
 *
 * @param {T} item The item.
 * @return {?osx.annotation.KMLBalloon} The balloon options.
 * @protected
 * @template T
 */
os.ui.file.kml.AbstractKMLExporter.prototype.getBalloonOptions = function(item) {
  return null;
};


/**
 * Add a BalloonStyle to a Style element.
 *
 * @param {!Element} styleEl The Style element.
 * @param {!osx.annotation.KMLBalloon} options The balloon options.
 * @protected
 */
os.ui.file.kml.AbstractKMLExporter.prototype.writeBalloonStyle = function(styleEl, options) {
  var balloonStyleEl = os.xml.appendElementNS('BalloonStyle', this.kmlNS, styleEl);
  os.xml.appendElementNS('text', this.kmlNS, balloonStyleEl, options.text);

  if (options.bgColor != null) {
    os.xml.appendElementNS('bgColor', this.kmlNS, balloonStyleEl, options.bgColor);
  }

  if (options.textColor != null) {
    os.xml.appendElementNS('textColor', this.kmlNS, balloonStyleEl, options.textColor);
  }

  if (options.displayMode != null) {
    os.xml.appendElementNS('displayMode', this.kmlNS, balloonStyleEl, options.displayMode);
  }
};
