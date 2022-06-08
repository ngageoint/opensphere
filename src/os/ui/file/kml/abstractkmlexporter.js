goog.declareModuleId('os.ui.file.kml.AbstractKMLExporter');

import {pushSerializeAndPop} from 'ol/src/xml.js';

import JsonField from '../../../../plugin/file/kml/jsonfield.js';
import {OS_NS} from '../../../../plugin/file/kml/kml.js';
import ZipExporter from '../../../ex/zipexporter.js';
import Fields from '../../../fields/fields.js';
import {DESC_REGEXP} from '../../../fields/index.js';
import OSFile from '../../../file/file.js';
import instanceOf from '../../../instanceof.js';
import {isPrimitive} from '../../../object/object.js';
import {PLACEMARK_SERIALIZERS, GEOMETRY_NODE_FACTORY} from '../../../ol/format/KML.js';
import * as osTime from '../../../time/time.js';
import TimeInstant from '../../../time/timeinstant.js';
import TimeRange from '../../../time/timerange.js';
import * as xml from '../../../xml.js';
import * as kml from './kml.js';

const {getFirstElementChild, insertSiblingBefore} = goog.require('goog.dom');
const {createDocument, serialize} = goog.require('goog.dom.xml');
const log = goog.require('goog.log');
const googString = goog.require('goog.string');

const {default: ITime} = goog.requireType('os.time.ITime');


/**
 * Abstract KML exporter
 *
 * @abstract
 * @extends {ZipExporter<T>}
 * @template T
 */
export default class AbstractKMLExporter extends ZipExporter {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.log = logger;
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
    this.osNS = OS_NS;

    /**
     * @type {!Object<string, function(!Element, T)>}
     * @protected
     */
    this.elementProcessors = {};
    this.elementProcessors[kml.ElementType.FOLDER] = this.processFolder.bind(this);
    this.elementProcessors[kml.ElementType.PLACEMARK] = this.processPlacemark.bind(this);

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
    this.labelDelimiter_ = AbstractKMLExporter.LABEL_DELIMITER;

    /**
     * The default icon to use for placemarks.
     * @type {kml.Icon}
     * @private
     */
    this.defaultIcon_ = /** @type {kml.Icon} */ ({});

    /**
     * The icon to use for placemarks.
     * @type {?kml.Icon}
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
     * If range rings should be exported (when available).
     * @type {boolean}
     * @protected
     */
    this.exportRangeRings = false;

    /**
     * If the ellipse center point should be included.
     * @type {boolean}
     * @protected
     */
    this.useCenterPoint = false;

    // initial setup
    this.setDefaultIcon(
        kml.DEFAULT_ICON.href,
        kml.DEFAULT_ICON.scale,
        kml.DEFAULT_ICON.options);
  }

  /**
   * @inheritDoc
   */
  reset() {
    super.reset();
    this.doc = null;
    this.docName = null;
    this.kmlDoc = null;
    this.defaultFolder = null;

    this.defaultIcon_ = /** @type {kml.Icon} */ (Object.assign({}, kml.DEFAULT_ICON));
    this.icon_ = null;
    this.styles_ = {};
    this.labelMap = {};
  }

  /**
   * @inheritDoc
   */
  getExtension() {
    return this.compress ? 'kmz' : 'kml';
  }

  /**
   * @inheritDoc
   */
  getLabel() {
    return 'KML';
  }

  /**
   * @inheritDoc
   */
  getMimeType() {
    return this.compress ? 'application/vnd.google-earth.kmz' : 'application/vnd.google-earth.kml+xml';
  }

  /**
   * Get the default icon to use for placemarks.
   *
   * @return {kml.Icon}
   */
  getDefaultIcon() {
    return this.defaultIcon_;
  }

  /**
   * Set the default icon to use for placemarks.
   *
   * @param {string} href The icon URI
   * @param {number=} opt_scale The icon scale
   * @param {Object=} opt_options
   */
  setDefaultIcon(href, opt_scale, opt_options) {
    this.defaultIcon_.href = href;

    if (typeof opt_options === 'object' && !isNaN(opt_options)) {
      this.defaultIcon_.options = opt_options;
    }

    if (typeof opt_scale === 'number' && !isNaN(opt_scale)) {
      this.defaultIcon_.scale = Math.max(0, opt_scale);
    }
  }

  /**
   * Get the name attribute for the Document element.
   *
   * @return {string}
   */
  getDocName() {
    return this.docName || this.getName() || 'KML Document';
  }

  /**
   * Set the name attribute for the Document element.
   *
   * @param {string} name
   */
  setDocName(name) {
    this.docName = name;
  }

  /**
   * Get the default field(s) used for the Placemark name.
   *
   * @return {Array<*>}
   */
  getDefaultLabelFields() {
    return this.defaultLabelFields_;
  }

  /**
   * Set the default field(s) used for the Placemark name.
   *
   * @param {Array<*>} value
   */
  setDefaultLabelFields(value) {
    this.defaultLabelFields_ = value;
  }

  /**
   * Get the delimiter used to separate multiple labels.
   *
   * @return {string}
   */
  getLabelDelimiter() {
    return this.labelDelimiter_;
  }

  /**
   * Set the delimiter used to separate multiple labels.
   *
   * @param {string} value
   */
  setLabelDelimiter(value) {
    this.labelDelimiter_ = value;
  }

  /**
   * Get if the item color should be used for icons.
   *
   * @return {boolean}
   */
  getUseItemColor() {
    return this.useItemColor;
  }

  /**
   * Set if the item color should be used for icons.
   *
   * @param {boolean} value
   */
  setUseItemColor(value) {
    this.useItemColor = value;
  }

  /**
   * Get if the item icon should be used instead of the default.
   *
   * @return {boolean}
   */
  getUseItemIcon() {
    return this.useItemIcon;
  }

  /**
   * Set if the item icon should be used instead of the default.
   *
   * @param {boolean} value
   */
  setUseItemIcon(value) {
    this.useItemIcon = value;
  }

  /**
   * Get if ellipses should be exported.
   *
   * @return {boolean}
   */
  getExportEllipses() {
    return this.exportEllipses;
  }

  /**
   * Set if ellipses should be exported.
   *
   * @param {boolean} value
   */
  setExportEllipses(value) {
    this.exportEllipses = value;
  }

  /**
   * Get if range rings should be exported.
   *
   * @return {boolean}
   */
  getExportRangeRings() {
    return this.exportRangeRings;
  }


  /**
   * Set if range rings should be exported.
   *
   * @param {boolean} value
   */
  setExportRangeRings(value) {
    this.exportRangeRings = value;
  }

  /**
   * Get if center points should be included in ellipses.
   *
   * @return {boolean}
   */
  getUseCenterPoint() {
    return this.useCenterPoint;
  }

  /**
   * Set if center points should be included in ellipses.
   *
   * @param {boolean} value
   */
  setUseCenterPoint(value) {
    this.useCenterPoint = value;
  }

  /**
   * @inheritDoc
   */
  processItems() {
    this.doc = createDocument('kml', this.kmlNS);

    var kmlEl = /** @type {!Element} */ (getFirstElementChild(this.doc));

    var xmlnsUri = 'http://www.w3.org/2000/xmlns/';
    kmlEl.setAttributeNS(xmlnsUri, 'xmlns:gx', this.gxNS);
    kmlEl.setAttributeNS(xmlnsUri, 'xmlns:os', this.osNS);

    // create the Document element
    this.kmlDoc = xml.appendElementNS('Document', this.kmlNS, kmlEl);
    xml.appendElementNS('name', this.kmlNS, this.kmlDoc, this.getDocName());
    xml.appendElementNS('visibility', this.kmlNS, this.kmlDoc, 1);

    // create the root Folder element
    this.defaultFolder = xml.createElementNS('Folder', this.kmlNS, this.doc);
    xml.appendElementNS('name', this.kmlNS, this.defaultFolder, this.getDocName());

    for (var i = 0, n = this.items.length; i < n; i++) {
      this.processItem(this.items[i]);
    }

    // if there is anything in the default folder other than the name element, add it to the document
    if (this.defaultFolder.childElementCount > 1) {
      this.kmlDoc.appendChild(this.defaultFolder);
    }

    var content = serialize(this.doc);

    // serialize may not append the xml tag
    if (!content.startsWith('<?')) {
      content = '<?xml version="1.0"?>' + content;
    }

    var kmlFile = new OSFile();
    kmlFile.setFileName(this.getName() + '.kml');
    kmlFile.setContent(content);
    this.addFile(kmlFile);
  }

  /**
   * Create the full label for an item from configured fields.
   *
   * @param {T} item The item
   * @return {?string}
   * @protected
   */
  createLabel(item) {
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
  }

  /**
   * Create the full label for an item from configured fields.
   *
   * @param {T} item The item
   * @param {Array<*>} labelFields The label fields
   * @return {?string}
   * @private
   */
  extractLabelFromFields_(item, labelFields) {
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
  }

  /**
   * Process a single item, returning a KML element to add to the document.
   *
   * @param {T} item The item
   * @protected
   * @template T
   */
  processItem(item) {
    var parent = this.getParent(item);
    if (parent) {
      var elementType = this.getElementType(item);
      if (elementType && this.elementProcessors[elementType]) {
        var itemId = this.getId(item);
        var element = xml.appendElementNS(elementType, this.kmlNS, parent, undefined, {
          'id': itemId
        });

        var name = this.createLabel(item);
        if (name) {
          // only add the name element if a label was created, because the name is used for the displayed label in Google
          // Earth. showing id's is both not helpful and produces clutter, though it will result in showing [no name] for
          // everything in the GE tree. Opensphere will use the Placemark id for the tree if a name isn't found.
          xml.appendElementNS('name', this.kmlNS, element, name);
        }

        var processElement = this.elementProcessors[elementType];
        processElement(element, item);
      }
    }
  }

  /**
   * Process a Folder element to add to the KML.
   *
   * @param {!Element} element The Placemark element
   * @param {T} item The item
   * @protected
   * @template T
   */
  processFolder(element, item) {
    var visibility = this.isItemVisible(item) ? 1 : 0;
    xml.appendElementNS('visibility', this.kmlNS, element, visibility);

    var children = this.getChildren(item);
    if (children) {
      for (var i = 0; i < children.length; i++) {
        this.processItem(/** @type {T} */ (children[i]));
      }
    }
  }

  /**
   * Process a Placemark element to add to the KML.
   *
   * @param {!Element} element The Placemark element
   * @param {T} item The item
   * @protected
   * @template T
   */
  processPlacemark(element, item) {
    var styleId = this.getStyleId(item);
    if (!googString.isEmptyOrWhitespace(googString.makeSafe(styleId))) {
      xml.appendElementNS('styleUrl', this.kmlNS, element, '#' + styleId);
    }

    var pStyleEl = this.createPlacemarkMergedStyle(element, item);
    if (pStyleEl) {
      element.appendChild(pStyleEl);
    }

    var visibility = this.isItemVisible(item) ? 1 : 0;
    xml.appendElementNS('visibility', this.kmlNS, element, visibility);

    var ed = xml.createElementNS('ExtendedData', this.kmlNS, this.doc);

    var time = this.getTime(item);
    if (time) {
      // don't create the time element until we know it will have something in it
      var ts;

      if (instanceOf(time, TimeRange.NAME)) {
        time = /** @type {TimeRange} */ (time);

        var start = time.getStart();
        if (start && start != TimeInstant.MIN_TIME) {
          ts = ts || xml.appendElementNS('TimeSpan', this.kmlNS, element);
          xml.appendElementNS('begin', this.kmlNS, ts,
              osTime.format(new Date(start), undefined, undefined, true));
        }

        var end = time.getEnd();
        if (end && end != TimeInstant.MAX_TIME) {
          ts = ts || xml.appendElementNS('TimeSpan', this.kmlNS, element);
          xml.appendElementNS('end', this.kmlNS, ts, osTime.format(new Date(end), undefined, undefined, true));
        }
      } else {
        var start = time.getStart();
        if (start && start != TimeInstant.MIN_TIME) {
          ts = xml.appendElementNS('TimeStamp', this.kmlNS, element);
          xml.appendElementNS('when', this.kmlNS, ts, osTime.format(new Date(start), undefined, undefined, true));
        }
      }

      var timeEl = xml.appendElementNS('Data', this.kmlNS, ed, undefined, {
        'name': Fields.TIME
      });
      xml.appendElementNS('value', this.kmlNS, timeEl, time.toString());
    }

    this.addGeometryNode(item, element);

    var fields = this.getFields(item);
    if (fields && fields.length > 0) {
      var descEl;
      for (var i = 0, n = fields.length; i < n; i++) {
        var val = this.getField(item, fields[i]);
        if (val != null) {
          if (descEl === undefined && typeof val === 'string' && DESC_REGEXP.test(fields[i])) {
            // strip out carriage returns, because screw windows
            val.replace(/\r/g, '');

            if (!googString.isEmptyOrWhitespace(googString.makeSafe(val))) {
              descEl = xml.appendElementNS('description', this.kmlNS, element);

              var cdata = this.doc.createCDATASection(val);
              descEl.appendChild(cdata);
            }
          } else if (isPrimitive(val)) {
            var dataEl = xml.appendElementNS('Data', this.kmlNS, ed, undefined, {
              'name': fields[i]
            });
            xml.appendElementNS('value', this.kmlNS, dataEl, String(val));
          } else if (JsonField.indexOf(fields[i]) > -1) {
            // write anything in this array as a serialized JSON value
            var dataEl = xml.appendElementNS('Data', this.kmlNS, ed, undefined, {
              'name': fields[i]
            });
            xml.appendElementNS('value', this.kmlNS, dataEl, JSON.stringify(val));
          }
        }
      }

      // Some fields do not get automatically exported (e.g., fields that are not visible)
      // if the rotation column is one of those fields create its data element here
      var rotationColumn = this.getRotationColumn(item);
      if (!!rotationColumn && !fields.includes(rotationColumn)) {
        var rotDataEl = xml.appendElementNS('Data', this.kmlNS, ed, undefined, {
          'name': rotationColumn
        });
        xml.appendElementNS('value', this.kmlNS, rotDataEl, String(this.getField(item, rotationColumn)));
      }

      // Add line dash info as custom element since kml doesn't support it
      var lineDash = this.getLineDash(item);
      if (lineDash && Array.isArray(lineDash) && lineDash.length) {
        var lineDashDataEl = xml.appendElementNS('Data', this.kmlNS, ed, undefined, {
          'name': 'lineDash'
        });
        xml.appendElementNS('value', this.kmlNS, lineDashDataEl, JSON.stringify(lineDash));
      }
    }

    if (ed.childElementCount > 0) {
      element.appendChild(ed);
    }
  }

  /**
   * Create placemark specific merged style.
   *
   * @param {!Element} placemarkEl The placemark element
   * @param {T} item The item
   * @return {?Element} The merged style element
   * @protected
   * @template T
   */
  createPlacemarkMergedStyle(placemarkEl, item) {
    var styleEl = null;

    var rotationColumn = this.getRotationColumn(item);
    if (rotationColumn) {
      var heading = /** @type {number} */ (this.getField(item, rotationColumn));
      if (!isNaN(heading)) {
        styleEl = styleEl || xml.createElementNS('Style', this.kmlNS, this.doc);
        var iconStyleEl = xml.appendElementNS('IconStyle', this.kmlNS, styleEl);
        xml.appendElementNS('heading', this.kmlNS, iconStyleEl, heading % 360);
      }
    }

    var balloonOptions = this.getBalloonOptions(item);
    if (balloonOptions && balloonOptions.text) {
      styleEl = styleEl || xml.createElementNS('Style', this.kmlNS, this.doc);
      this.writeBalloonStyle(styleEl, balloonOptions);
    }

    return styleEl;
  }

  /**
   * Adds an item's geometry to its Placemark.
   *
   * @param {T} item The item
   * @param {!Node} node The kml:Placemark node
   * @protected
   *
   * @suppress {accessControls} To allow access to private OL3 KML format constructs.
   */
  addGeometryNode(item, node) {
    var geometry = this.getGeometry(item);
    if (geometry) {
      var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
      pushSerializeAndPop(context, PLACEMARK_SERIALIZERS,
          GEOMETRY_NODE_FACTORY, [geometry], []);
    }
  }

  /**
   * Gets the style id for an item, creating a style if necessary.
   *
   * @param {T} item The item
   * @param {string} styleId The style id
   * @param {string} color The item color
   * @param {?string} fillColor The item fill color
   * @param {?string} strokeColor The item line (stroke) color
   * @param {kml.Icon=} opt_icon The item icon
   * @param {?number=} opt_strokeWidth the width of the line (stroke)
   * @protected
   */
  createStyle(item, styleId, color, fillColor, strokeColor, opt_icon, opt_strokeWidth) {
    var styleEl = xml.createElementNS('Style', this.kmlNS, this.doc, undefined, {
      'id': styleId
    });

    // all styles will have an IconStyle element, so create that first
    var iconStyleEl = xml.appendElementNS('IconStyle', this.kmlNS, styleEl);

    if (opt_icon != null) {
      // icon/point style
      if (this.useItemColor) {
        // override the icon color with the item's color
        xml.appendElementNS('color', this.kmlNS, iconStyleEl, color);
      }

      if (opt_icon.scale != null) {
        xml.appendElementNS('scale', this.kmlNS, iconStyleEl, opt_icon.scale);
      }

      if (opt_icon.options != null) {
        var el = xml.appendElementNS('os:iconOptions', this.osNS, iconStyleEl, ' ');

        var cdata = this.doc.createCDATASection(JSON.stringify(opt_icon.options));
        el.appendChild(cdata);
      }

      // add the icon href
      var iconEl = xml.appendElementNS('Icon', this.kmlNS, iconStyleEl);
      var iconUri = opt_icon.href;
      xml.appendElementNS('href', this.kmlNS, iconEl, iconUri);
    } else {
      // default style - apply the item's color to everything
      xml.appendElementNS('color', this.kmlNS, iconStyleEl, color);
    }

    var lineStyleEl = xml.appendElementNS('LineStyle', this.kmlNS, styleEl);
    xml.appendElementNS('color', this.kmlNS, lineStyleEl, strokeColor || color);
    xml.appendElementNS('width', this.kmlNS, lineStyleEl, opt_strokeWidth || 2);

    var polyStyleEl = xml.appendElementNS('PolyStyle', this.kmlNS, styleEl);
    xml.appendElementNS('color', this.kmlNS, polyStyleEl, fillColor || color);
    xml.appendElementNS('fill', this.kmlNS, polyStyleEl, this.getFill(item) && fillColor ? 1 : 0);
    xml.appendElementNS('outline', this.kmlNS, polyStyleEl, this.getStroke(item) && strokeColor ? 1 : 0);

    var firstFolder = this.kmlDoc.querySelector('Folder');
    if (firstFolder) {
      // add the style before the first Folder node
      insertSiblingBefore(styleEl, firstFolder);
    } else {
      // no folder, so just append it
      this.kmlDoc.appendChild(styleEl);
    }
    this.styles_[styleId] = true;
  }

  /**
   * Get the children of an item.
   *
   * @param {T} item The item
   * @return {Array<T>} The item's children
   * @protected
   */
  getChildren(item) {
    return null;
  }

  /**
   * Get the color of an item. This should return an ABGR string that can be dropped directly into the KML.
   *
   * @abstract
   * @param {T} item The item
   * @return {string} The item's color as an ABGR string
   * @protected
   */
  getColor(item) {}

  /**
   * Gets whether or not to fill the item
   * @param {T} item The item
   * @return {boolean}
   * @protected
   */
  getFill(item) {
    return false;
  }

  /**
   * Gets whether or not to stroke the item
   * @param {T} item The item
   * @return {boolean}
   * @protected
   */
  getStroke(item) {
    return true;
  }

  /**
   * Get the fill color of an item. This should return an ABGR string that can be dropped directly into the KML.
   * @abstract
   * @param {T} item The item
   * @return {?string} The item's fill color as an ABGR string
   * @protected
   */
  getFillColor(item) {}

  /**
   * Get the stroke color of an item. This should return an ABGR string that can be dropped directly into the KML.
   * @abstract
   * @param {T} item The item
   * @return {?string} The item's stroke color as an ABGR string
   * @protected
   */
  getStrokeColor(item) {}

  /**
   * Get the stroke width of an item.
   * @abstract
   * @param {T} item The item
   * @return {?number} The item's stroke width as an integer, or null to use default value
   * @protected
   */
  getStrokeWidth(item) {}

  /**
   * Get the type of KML element represented by the item.
   *
   * @param {T} item The item
   * @return {kml.ElementType}
   * @protected
   */
  getElementType(item) {
    return kml.ElementType.PLACEMARK;
  }

  /**
   * Get the fields to export for an item.
   *
   * @param {T} item The item
   * @return {Array<string>} The fields to export
   */
  getFields(item) {
    return this.fields;
  }

  /**
   * @inheritDoc
   */
  setFields(value) {
    this.fields = value;
  }

  /**
   * Get the geometry for an item.
   *
   * @abstract
   * @param {T} item The item
   * @return {(ol.geom.Geometry|undefined)}
   * @protected
   */
  getGeometry(item) {}

  /**
   * Get the icon rotation column.
   *
   * @abstract
   * @param {T} item The item
   * @return {string|null|undefined}
   * @protected
   */
  getRotationColumn(item) {}

  /**
   * Get the line dash.
   *
   * @abstract
   * @param {T} item The item
   * @return {Array<number>|null|undefined}
   * @protected
   */
  getLineDash(item) {}

  /**
   * Get the id of an item.
   *
   * @param {T} item The item
   * @return {kml.Icon} The icon representing the item
   * @protected
   */
  getIcon(item) {
    return this.icon_ ? this.icon_ : this.defaultIcon_;
  }

  /**
   * set the icon
   *
   * @param {kml.Icon} icon The icon
   */
  setIcon(icon) {
    this.icon_ = icon;
  }

  /**
   * Get the id of an item.
   *
   * @abstract
   * @param {T} item The item
   * @return {string} The item's id
   * @protected
   */
  getId(item) {}

  /**
   * Get the field value from an item.
   *
   * @abstract
   * @param {T} item The item
   * @param {string} field The field
   * @return {*} The value
   * @protected
   */
  getField(item, field) {}

  /**
   * Gets the label fields to use in the Placemark name.
   *
   * @param {T} item The item
   * @param {*} labelField
   * @return {?string} null if no label
   */
  getItemLabel(item, labelField) {
    if (typeof labelField == 'string') {
      return /** @type {string|undefined} */ (this.getField(item, labelField)) || null;
    }

    return null;
  }

  /**
   * If the item is visible.
   *
   * @param {T} item The item
   * @return {boolean}
   */
  isItemVisible(item) {
    return true;
  }

  /**
   * If the item is one of the root items being exported.
   *
   * @param {T} item The item
   * @return {boolean}
   */
  isRootItem(item) {
    return this.items != null && this.items.indexOf(item) > -1;
  }

  /**
   * Gets the parent element for the provided item.
   *
   * @param {T} item The item
   * @return {Element} The parent element.
   * @protected
   */
  getParent(item) {
    // use the default kml:Folder. applications can provide their own behavior.
    return this.defaultFolder;
  }

  /**
   * Get all properties from an item.
   *
   * @abstract
   * @param {T} item The item
   * @return {Object<string, *>} The item's properties
   * @protected
   */
  getProperties(item) {}

  /**
   * Gets the style id for an item, creating a style if necessary.
   *
   * @param {T} item The item
   * @return {string} The style id for the item
   * @protected
   */
  getStyleId(item) {
    var type = this.getStyleType(item);
    var styleParts = [type];
    var styleId;

    // color is only used in the style if overriding the icon color or using the default style type
    var color = this.getColor(item);
    if (this.useItemColor || type == kml.StyleType.DEFAULT) {
      styleParts.push(color);
    }

    var fillColor = this.getFillColor(item);
    if (this.useItemColor || type == kml.StyleType.DEFAULT) {
      styleParts.push(fillColor);
    }

    var strokeColor = this.getStrokeColor(item);
    if (this.useItemColor || type == kml.StyleType.DEFAULT) {
      styleParts.push(strokeColor);
    }

    var icon = type == kml.StyleType.DEFAULT ? undefined : this.getIcon(item);
    if (type == kml.StyleType.ICON && this.useItemIcon) {
      // override the default icon with the item's icon
      icon = this.getIcon(item);

      // use the hashcode since a URL may contain restricted characters for an XML attribute
      styleParts.push(String(googString.hashCode(icon.href)));

      if (typeof icon.scale === 'number' && icon.scale != 1) {
        styleParts.push(String(icon.scale));
      }
    }

    var strokeWidth = this.getStrokeWidth(item);
    styleParts.push(strokeWidth);

    // hyphen separate the id components
    styleId = styleParts.join('-');

    if (!(styleId in this.styles_)) {
      this.createStyle(item, styleId, color, fillColor, strokeColor, icon, strokeWidth);
    }

    return styleId;
  }

  /**
   * Gets the style type for an item.
   *
   * @abstract
   * @param {T} item The item
   * @return {string} The style type for the item
   * @protected
   */
  getStyleType(item) {}

  /**
   * Gets the time associated with the provided item.
   *
   * @abstract
   * @param {T} item The item
   * @return {ITime} The item's time
   * @protected
   */
  getTime(item) {}

  /**
   * Gets the label fields to use in the Placemark name.
   *
   * @param {T} item The item
   * @return {Array<*>} null if no label fields
   */
  getGroupLabels(item) {
    return null;
  }

  /**
   * Get the KML balloon style options for the item.
   *
   * @param {T} item The item.
   * @return {?osx.annotation.KMLBalloon} The balloon options.
   * @protected
   * @template T
   */
  getBalloonOptions(item) {
    return null;
  }

  /**
   * Add a BalloonStyle to a Style element.
   *
   * @param {!Element} styleEl The Style element.
   * @param {!osx.annotation.KMLBalloon} options The balloon options.
   * @protected
   */
  writeBalloonStyle(styleEl, options) {
    var balloonStyleEl = xml.appendElementNS('BalloonStyle', this.kmlNS, styleEl);
    xml.appendElementNS('text', this.kmlNS, balloonStyleEl, options.text);

    if (options.bgColor != null) {
      xml.appendElementNS('bgColor', this.kmlNS, balloonStyleEl, options.bgColor);
    }

    if (options.textColor != null) {
      xml.appendElementNS('textColor', this.kmlNS, balloonStyleEl, options.textColor);
    }

    if (options.displayMode != null) {
      xml.appendElementNS('displayMode', this.kmlNS, balloonStyleEl, options.displayMode);
    }
  }
}

/**
 * Logger
 * @type {goog.log.Logger}
 */
const logger = log.getLogger('os.ui.file.kml.AbstractKMLExporter');

/**
 * The delimiter used to separate multiple labels.
 * @type {string}
 * @const
 */
AbstractKMLExporter.LABEL_DELIMITER = ' - ';
