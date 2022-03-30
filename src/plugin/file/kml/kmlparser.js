goog.declareModuleId('plugin.file.kml.KMLParser');

import Feature from 'ol/src/Feature.js';
import {readBoolean, readDecimal, readString, readPositiveInteger, readBooleanString} from 'ol/src/format/xsd.js';
import {inflateCoordinates} from 'ol/src/geom/flat/inflate.js';
import GeometryLayout from 'ol/src/geom/GeometryLayout.js';
import GeometryType from 'ol/src/geom/GeometryType.js';
import LineString from 'ol/src/geom/LineString.js';
import MultiLineString from 'ol/src/geom/MultiLineString.js';
import {transformExtent} from 'ol/src/proj.js';
import IconAnchorUnits from 'ol/src/style/IconAnchorUnits.js';
import {getUid} from 'ol/src/util.js';
import {isDocument, getAllTextContent, pushParseAndPop, makeObjectPropertySetter, makeStructureNS} from 'ol/src/xml.js';
import AlertEventSeverity from '../../../os/alert/alerteventseverity.js';
import AlertManager from '../../../os/alert/alertmanager.js';
import * as annotation from '../../../os/annotation/annotation.js';
import * as arraybuf from '../../../os/arraybuf.js';
import ColumnDefinition from '../../../os/data/columndefinition.js';
import RecordField from '../../../os/data/recordfield.js';
import Fields from '../../../os/fields/fields.js';
import * as osFileMimeText from '../../../os/file/mime/text.js';
import * as mimeZip from '../../../os/file/mime/zip.js';
import {METHOD_FIELD} from '../../../os/interpolate.js';
import Method from '../../../os/interpolatemethod.js';
import Image from '../../../os/layer/image.js';
import * as osMap from '../../../os/map/map.js';
import MapContainer from '../../../os/mapcontainer.js';
import * as net from '../../../os/net/net.js';
import Request from '../../../os/net/request.js';
import * as osObject from '../../../os/object/object.js';
import AsyncZipParser from '../../../os/parse/asynczipparser.js';
import * as osProj from '../../../os/proj/proj.js';
import ImageStatic from '../../../os/source/imagestatic.js';
import TriState from '../../../os/structs/tristate.js';
import * as osStyle from '../../../os/style/style.js';
import StyleField from '../../../os/style/stylefield.js';
import StyleType from '../../../os/style/styletype.js';
import * as track from '../../../os/track/track.js';
import ColorControlType from '../../../os/ui/colorcontroltype.js';
import ControlType from '../../../os/ui/controltype.js';
import * as osUiFileKml from '../../../os/ui/file/kml/kml.js';
import * as ui from '../../../os/ui/ui.js';
import AltitudeMode from '../../../os/webgl/altitudemode.js';
import * as xml from '../../../os/xml.js';
import JsonField from './jsonfield.js';
import * as kml from './kml.js';
import KMLField from './kmlfield.js';
import * as model from './kmlmodel.js';
import parseTour from './tour/tourparser.js';
import * as KMLImageLayerUI from './ui/kmlimagelayerui.js';
import KMLNetworkLinkNode from './ui/kmlnetworklinknode.js';
import KMLNode from './ui/kmlnode.js';
import KMLTourNode from './ui/kmltournode.js';


const Uri = goog.require('goog.Uri');
const asserts = goog.require('goog.asserts');
const ConditionalDelay = goog.require('goog.async.ConditionalDelay');
const dom = goog.require('goog.dom');
const NodeType = goog.require('goog.dom.NodeType');
const googDomXml = goog.require('goog.dom.xml');
const GoogFileReader = goog.require('goog.fs.FileReader');
const log = goog.require('goog.log');
const EventType = goog.require('goog.net.EventType');
const googObject = goog.require('goog.object');
const googString = goog.require('goog.string');



/**
 * @typedef {{
 *   children: !(Array|NodeList),
 *   index: number,
 *   node: KMLNode
 * }}
 */
let KMLParserStackObj;


/**
 * Parses a KML source
 *
 * @implements {IParser<KMLNode>}
 * @template T
 */
export default class KMLParser extends AsyncZipParser {
  /**
   * Constructor.
   * @param {Object<string, *>} options Layer configuration options.
   */
  constructor(options) {
    super();

    // load default KML styles
    kml.createStyleDefaults();

    /**
     * The source document
     * @type {Document}
     * @private
     */
    this.document_ = null;

    /**
     * Parser identifier
     * @type {string}
     * @private
     */
    this.id_ = googString.getRandomString();

    /**
     * The logger
     * @type {Logger}
     * @private
     */
    this.log_ = logger;

    /**
     * If the parse should merge into an existing tree
     * @type {boolean}
     * @private
     */
    this.merging_ = false;

    /**
     * The root KML tree node
     * @type {KMLNode}
     * @private
     */
    this.rootNode_ = null;

    /**
     * Columns detected in the KML
     * @type {Array<!ColumnDefinition>}
     * @private
     */
    this.columns_ = null;

    /**
     * Map used to detect KML Placemark columns
     * @type {Object<string, boolean>}
     * @private
     */
    this.columnMap_ = null;

    /**
     * The parsing stack
     * @type {!Array<!KMLParserStackObj>}
     * @private
     */
    this.stack_ = [];

    /**
     * The KML style config map
     * @type {!Object<string, Object<string, *>>}
     * @private
     */
    this.styleMap_ = {};

    /**
     * The KML balloon style config map.
     * @type {!Object<string, !Object<string, *>>}
     * @private
     */
    this.balloonStyleMap = {};

    /**
     * The KML style config map for highlight styles from StyleMap tags
     * @type {!Object<string, !Object<string, *>>}
     * @private
     */
    this.highlightStyleMap_ = {};

    /**
     * The number of unnamed nodes parsed from the document - used for providing unique names
     * @type {number}
     * @private
     */
    this.unnamedCount_ = 0;

    /**
     * The settings from the network link control for the minRefreshPeriod
     * 0 means to use link refresh defined by the requestor
     * @type {number}
     * @private
     */
    this.minRefreshPeriod_ = 0;

    /**
     * Map of asset file names to data URIs
     * @type {Object<string, string>}
     * @private
     */
    this.assetMap_ = {};

    /**
     * Map of URLs to external style sheets
     * @type {Object<string, boolean|Request>}
     * @private
     */
    this.extStyles_ = {};

    /**
     * The number of kmz image entries to process
     * @type {number}
     * @private
     */
    this.kmzImagesRemaining_ = 0;

    /**
     * @type {Object<string, !zip.Entry>} entries
     * @private
     */
    this.kmlEntries_ = {};

    /**
     * @type {Array<string>}
     * @private
     */
    this.kmlThings_ = KMLParser.KML_THINGS.slice();

    /**
     * @type {RegExp}
     * @private
     */
    this.kmlThingRegex_ = this.getKmlThingRegex();

    /**
     * Indicates if the kmz has a collada model to parse.
     * @type {boolean}
     * @private
     */
    this.hasModel_ = false;

    /**
     * @type {Object<string, {parent: ?string, parsers: Object<string, Object<string, ol.XmlParser>>}>}
     * @private
     */
    this.parsersByPlacemarkTag_ = {
      'Placemark': {
        parent: null,
        parsers: kml.OL_PLACEMARK_PARSERS()
      }
    };
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    this.cleanup();
    this.clearAssets();
    super.disposeInternal();
  }

  /**
   * @inheritDoc
   */
  cleanup() {
    // FIXME: we should be clearing assets here, but they won't be available at load time
    // this.clearAssets();

    this.document_ = null;
    this.merging_ = false;
    this.rootNode_ = null;
    this.columns_ = null;
    this.columnMap_ = null;
    this.stack_.length = 0;
    this.styleMap_ = {};
    this.balloonStyleMap = {};
    this.unnamedCount_ = 0;
    this.minRefreshPeriod_ = 0;
  }

  /**
   * Cleans up any KMZ assets. This should be done before parsing again or when the layer is removed.
   */
  clearAssets() {
    this.assetMap_ = {};
  }

  /**
   * Get the last parsed root KML tree node. This reference will be lost on cleanup, so it must be retrieved when parsing
   * completes.
   *
   * @return {KMLNode}
   */
  getRootNode() {
    return this.rootNode_;
  }

  /**
   * Get the minimum refresh period (from the network link control)
   *
   * @return {number}
   */
  getMinRefreshPeriod() {
    return this.minRefreshPeriod_;
  }

  /**
   * Set the root KML tree node. Use this to merge the parse result into an existing tree.
   *
   * @param {KMLNode} rootNode
   */
  setRootNode(rootNode) {
    this.rootNode_ = rootNode;
    this.merging_ = !!rootNode;
  }

  /**
   * Get columns detected in the KML.
   *
   * @return {Array<!ColumnDefinition>}
   */
  getColumns() {
    if (!this.columns_ && this.columnMap_) {
      // translate the column map into slickgrid columns
      this.columns_ = [];

      for (var column in this.columnMap_) {
        if (column === RecordField.TIME) {
          // display the recordTime field as TIME
          this.columns_.push(new ColumnDefinition(Fields.TIME, RecordField.TIME));
        } else if (!KMLParser.SKIPPED_COLUMNS_.test(column)) {
          this.columns_.push(new ColumnDefinition(column));
        }
      }

      this.columnMap_ = null;
    }

    return this.columns_;
  }

  /**
   * @inheritDoc
   */
  hasNext() {
    return this.stack_.length > 0;
  }

  /**
   * @inheritDoc
   */
  setSource(source) {
    this.cleanup();

    if (typeof source === 'string') {
      this.document_ = xml.loadXml(source);
    } else if (isDocument(source)) {
      this.document_ = /** @type {Document} */ (source);
    } else if (source instanceof ArrayBuffer) {
      if (mimeZip.isZip(source)) {
        this.clearAssets();
        this.createZipReader(source);
        return;
      } else {
        var s = osFileMimeText.getText(source);
        if (s) {
          this.document_ = googDomXml.loadXml(s);
        } else {
          log.error(this.log_, 'Source buffer does not appear to be text');
          this.onError();
        }
      }
    } else if (source instanceof Blob) {
      GoogFileReader.readAsArrayBuffer(source).addCallback(this.setSource, this);
      return;
    }

    if (this.document_) {
      var rootEl = dom.getFirstElementChild(this.document_);
      if (rootEl && rootEl.localName.toLowerCase() !== 'kml') {
        // Sometimes people are dumb and create documents without a root <kml> tag.
        // This is technically invalid KML and even invalid XML.  Because Google Earth
        // accepts this crap, add a special case to put the proper root tag.
        var newRoot = xml.createElement('kml', this.document_);

        // add the Document element to the KML element
        newRoot.appendChild(rootEl);

        // add the new KML element to the document
        this.document_.appendChild(newRoot);

        // and update the root element
        rootEl = newRoot;
      }

      if (rootEl) {
        if (!this.loadExternalStyles()) {
          this.begin();
        }
      } else {
        log.error(this.log_, 'No KML content to parse!');
        this.onError();
      }
    } else {
      log.error(this.log_, 'Content must be a valid KML document!');
      this.onError();
    }
  }

  /**
   * @protected
   * @return {boolean} Whether or not external styles are loading
   */
  loadExternalStyles() {
    var styles = this.document_.querySelectorAll('styleUrl');
    var extStylesFound = false;

    for (var i = 0, n = styles.length; i < n; i++) {
      var style = getAllTextContent(styles[i], true).trim();
      if (style) {
        // remove the fragment, if url is incorrectly formatted, kml is bad and this url should be skipped
        var url = style.replace(/#.*/, '');
        url = encodeURI(url) === url ? url : undefined;
        if (url) {
          extStylesFound = true;
          dom.setTextContent(styles[i], '#' + style.replace('#', '_'));

          if (!(url in this.extStyles_)) {
            if (url in this.kmlEntries_) {
              var entry = this.kmlEntries_[url];
              entry.getData(new zip.BlobWriter(), this.processZIPEntry_.bind(this, entry.filename));
              this.extStyles_[url] = true;
            } else {
              var req = new Request(url);
              req.listen(EventType.SUCCESS, this.onExtStyleLoad, false, this);
              req.listen(EventType.ERROR, this.onExtStyleLoad, false, this);
              this.extStyles_[url] = req;
              req.load();
            }
          }
        }
      }
    }

    return extStylesFound;
  }

  /**
   * @param {GoogEvent} evt
   * @protected
   */
  onExtStyleLoad(evt) {
    var req = /** @type {Request} */ (evt.target);
    var url = req.getUri().toString();
    var safeUrl = this.extStyles_[url] ? url : decodeURI(url);
    delete this.extStyles_[safeUrl];

    var resp = /** @type {string} */ (req.getResponse());
    req.dispose();

    if (evt.type === EventType.SUCCESS) {
      this.handleExternalStylesheet_(resp, url);
    } else {
      this.continueStyles_();
    }
  }

  /**
   * @param {!string} content
   * @param {!string} url
   * @private
   */
  handleExternalStylesheet_(content, url) {
    try {
      var doc = googDomXml.loadXml(content);
      var appendTo = this.document_.querySelector('Document') || dom.getFirstElementChild(this.document_);

      var styles = doc.querySelectorAll('Style');
      for (var i = 0, n = styles.length; i < n; i++) {
        var style = styles[i];

        // "namespace" the style with the URL
        style.setAttribute('id', url + '_' + style.getAttribute('id'));

        // append it to the main document
        appendTo.appendChild(style);
      }

      var styleMaps = doc.querySelectorAll('StyleMap');
      for (var i = 0, n = styleMaps.length; i < n; i++) {
        var styleMap = styleMaps[i];

        // "namespace" the style with the URL
        styleMap.setAttribute('id', url + '_' + styleMap.getAttribute('id'));

        var styleUrls = Array.prototype.slice.call(styleMap.querySelectorAll('styleUrl'));
        styleUrls.forEach(function(styleUrl) {
          var current = styleUrl.textContent.replace(/^#/, '');
          styleUrl.textContent = '#' + url + '_' + current;
        });

        // append it to the main document
        appendTo.appendChild(styleMap);
      }
    } catch (e) {
      log.error(this.log_, 'Could not parse KML stylesheet ' + url);
    }

    this.continueStyles_();
  }

  /**
   * Keep waiting for styles or begin if they are done
   *
   * @private
   */
  continueStyles_() {
    // if we still have any outstanding style requests, keep waiting
    for (var key in this.extStyles_) {
      return;
    }

    // otherwise start parsing the main document
    this.begin();
  }

  /**
   * @protected
   */
  begin() {
    var rootEl = dom.getFirstElementChild(this.document_);
    var rootChildren = dom.getChildren(rootEl);

    if (rootChildren && rootChildren.length > 0) {
      // start parsing at the first child of the kml tag
      this.stack_.push(/** @type {KMLParserStackObj} */ ({
        children: [rootEl],
        index: 0,
        node: null
      }));

      this.onReady();

      // read NetworkLinkControl
      for (var i = 0; i < rootChildren.length; i++) {
        var child = rootChildren[i];
        if (child.localName == 'NetworkLinkControl' && child.querySelector('minRefreshPeriod')) {
          this.minRefreshPeriod_ = parseInt(child.querySelector('minRefreshPeriod').textContent, 10) * 1000;
        }
      }
    } else {
      log.error(this.log_, 'Empty KML tree!');
      this.onError();
    }
  }

  /**
   * @inheritDoc
   */
  handleZipReaderError() {
    super.handleZipReaderError();
    this.onError();
  }

  /**
   * HACK ALERT! zip.js has a zip.TextWriter() class that directly turns the zip entry into the string we want.
   * Unfortunately, it doesn't work in FF24 for some reason, but luckily, the BlobWriter does. Here, we read
   * the zip as a Blob, then feed it to a FileReader in the next callback in order to extract the text.
   *
   * @inheritDoc
   */
  handleZipEntries(entries) {
    var mainEntry = null;
    var firstEntry = null;
    var mainKml = /(doc|index)\.kml$/i;
    var anyKml = /\.kml$/i;
    var collada = /\.dae$/i;
    var img = /\.(png|jpg|jpeg|gif|bmp|do)$/i;

    for (var i = 0, n = entries.length; i < n; i++) {
      // if we have multiple entries, try to find one titled either doc.kml or index.kml as these
      // are generally the most important ones
      var entry = entries[i];
      if (!mainEntry && mainKml.test(entry.filename)) {
        mainEntry = entry;
      } else if (anyKml.test(entry.filename)) {
        if (!firstEntry) {
          firstEntry = entry;
        }

        this.kmlEntries_[entry.filename] = entry;
      } else if (img.test(entry.filename)) {
        var result = img.exec(entry.filename);
        img.lastIndex = 0;

        this.kmzImagesRemaining_++;

        entry.getData(new zip.Data64URIWriter('image/' + result[1]), this.processZipAsset_.bind(this, entry.filename));
      } else if (collada.test(entry.filename)) {
        this.hasModel_ = true;
        this.kmzImagesRemaining_++;
        entry.getData(new zip.TextWriter(), this.processZipAsset_.bind(this, entry.filename));
      } else {
        this.kmzImagesRemaining_++;
        this.processUnknownZipAsset_(entry);
      }
    }

    mainEntry = mainEntry || firstEntry;


    // before processing the main KML, try to delay until all images have been added to our asset map
    // move on if it takes longer than 20 seconds
    if (mainEntry) {
      var delay = new ConditionalDelay(this.imagesRemaining_.bind(this));
      delay.onSuccess = this.processMainEntry_.bind(this, mainEntry, true);
      delay.onFailure = this.processMainEntry_.bind(this, mainEntry, false);
      delay.start(200, 20000);
    } else {
      log.error(this.log_, 'No KML found in the ZIP!');
      this.onError();
    }
  }

  /**
   * Parse the main kml file
   *
   * @param {zip.Entry} mainEntry
   * @param {boolean} success True if all entries/images were processed
   * @private
   */
  processMainEntry_(mainEntry, success) {
    if (!success) {
      log.error(this.log_, 'Failed to process KMZ images in a timely manner - skipping ' +
          this.kmzImagesRemaining_ + ' images.');
    }
    mainEntry.getData(new zip.BlobWriter(), this.processZIPEntry_.bind(this, mainEntry.filename));
  }

  /**
   * True if we have processed all images
   *
   * @return {boolean} True if not all images have been processes
   * @private
   */
  imagesRemaining_() {
    return this.kmzImagesRemaining_ <= 0;
  }

  /**
   * Handler for processing unknown assets within the ZIP file
   * @param {!zip.Entry} entry
   * @private
   */
  processUnknownZipAsset_(entry) {
    entry.getData(new zip.ArrayBufferWriter(), (data) => {
      const type = arraybuf.getMimeType(/** @type {ArrayBuffer} */ (data));
      if (type && type.substr(0, 5) === 'image') {
        entry.getData(new zip.Data64URIWriter(type), this.processZipAsset_.bind(this, entry.filename));
      } else {
        // eh whatever just skip this
        this.kmzImagesRemaining_--;
      }
    });
  }

  /**
   * Handler for processing assets within the ZIP file. This includes images and collada model files.
   * @param {*} filename
   * @param {*} uri
   * @private
   */
  processZipAsset_(filename, uri) {
    if (typeof filename === 'string' && typeof uri === 'string') {
      this.assetMap_[filename] = uri;
      this.kmzImagesRemaining_--;
    } else {
      log.error(this.log_, 'There was a problem unzipping the KMZ!');
      this.onError();
    }
  }

  /**
   * @param {string} filename
   * @param {*} content
   * @private
   */
  processZIPEntry_(filename, content) {
    if (content && content instanceof Blob) {
      var reader = new FileReader();
      reader.onload = this.handleZIPText_.bind(this, filename);
      reader.readAsText(content);
    } else {
      log.error(this.log_, 'There was a problem unzipping the KMZ!');
      this.onError();
    }
  }

  /**
   * @param {string} filename
   * @param {Event} event
   * @private
   */
  handleZIPText_(filename, event) {
    var content = event.target.result;

    if (content && typeof content === 'string') {
      if (!this.document_) {
        this.setSource(content);
      } else {
        delete this.extStyles_[filename];
        this.handleExternalStylesheet_(content, filename);
      }
    } else {
      log.error(this.log_, 'There was a problem reading the ZIP content!');
      this.onError();
    }
  }

  /**
   * @inheritDoc
   */
  parseNext() {
    asserts.assert(this.stack_.length > 0, 'Stack should not be empty');
    asserts.assert(this.stack_[this.stack_.length - 1] != null, 'Top of stack should be an object');

    var stackObj = null;
    var node = null;
    var top = this.stack_[this.stack_.length - 1];
    var parentNode = top.node;
    var children = top.children;
    var currentEl = children[top.index];

    if (!currentEl) {
      var parentLabel = parentNode ? parentNode.getLabel() : 'Unknown';
      var msg = `Encountered null child under node ${parentLabel} - skipping.`;
      log.warning(this.log_, msg);
      return null;
    }

    // Clever hack alert!
    // Since we parse KMZs, the readURI function needs to know if a URL is in the asset map before it tries to resolve
    // it against the node's baseURI. The only thing that is passed to that function is the node, so we'll just tack it on
    currentEl.assetMap = this.assetMap_;

    var localName = currentEl.localName;
    try {
      if (localName === 'Document' || localName === 'Folder' || localName === 'kml') {
        node = this.createTreeNode_(currentEl, parentNode);

        if (node) {
          if (this.merging_) {
            // if this is a merge, initially mark all child nodes for removal. merged children will be unmarked, and
            // remaining children should be removed since they weren't found in the new KML
            this.markAllChildren_(node);
          }

          var stackChildren = dom.getChildren(currentEl);
          if (stackChildren && stackChildren.length > 0) {
            // only continue down this path if the element has children to parse
            stackObj = /** @type {KMLParserStackObj} */ ({
              children: stackChildren,
              index: 0,
              node: node
            });
          }

          if (localName === 'Document') {
            // parse schema nodes
            this.parseSchema_(currentEl);
          }
        }
      } else if (this.kmlThingRegex_ && this.kmlThingRegex_.test(localName) && localName != 'NetworkLinkControl') {
        node = this.createTreeNode_(currentEl, parentNode);
      }
    } catch (e) {
      // something failed so we don't want to continue parsing this DOM path
      stackObj = null;
      node = null;

      log.error(this.log_, 'Failed parsing node type: ' + localName, e);
    }

    ++top.index;
    if (top.index >= children.length) {
      if (this.merging_ && parentNode) {
        // remove any children that weren't found in the new KML
        this.removeMarkedChildren_(parentNode);
      }

      // no more children to parse, so pop the current item off the stack
      this.stack_.pop();
    }

    if (stackObj) {
      // current element is a container, so parse its children next
      this.stack_.push(stackObj);
      this.extractStyles_(currentEl);
    }

    if (!this.hasNext()) {
      this.closeZipReaders();
    }

    return node;
  }

  /**
   * Parses sample data from a KML.
   *
   * @return {!Array<!Feature>}
   */
  parsePreview() {
    var features = [];
    while (this.hasNext() && features.length < 50) {
      var node = this.parseNext();
      if (node) {
        var feature = node.getFeature();
        if (feature) {
          features.push(feature);
        }
      }
    }

    return features;
  }

  /**
   * Marks the node's children for removal.
   *
   * @param {!KMLNode} node The KML node
   * @private
   */
  markAllChildren_(node) {
    var children = node.getChildren();
    if (children) {
      for (var i = 0, n = children.length; i < n; i++) {
        /** @type {KMLNode} */ (children[i]).marked = true;
      }
    }
  }

  /**
   * Removes all marked children from a node.
   *
   * @param {!KMLNode} node The KML node
   * @private
   */
  removeMarkedChildren_(node) {
    var children = node.getChildren();
    if (children) {
      var i = children.length;
      while (i--) {
        var child = /** @type {KMLNode} */ (children[i]);
        if (child.marked) {
          node.removeChildAt(i);
          child.dispose();
        }
      }
    }
  }

  /**
   * Creates a tree node from an XML element
   *
   * @param {Element} el The XML element
   * @param {KMLNode=} opt_parent The parent tree node
   * @return {KMLNode} The tree node
   * @private
   */
  createTreeNode_(el, opt_parent) {
    var node = this.examineElement_(el);
    if (node) {
      if (!node.getLabel()) {
        // use the id if one is available, otherwise create a default name based on the element type
        var id = el.id || el.getAttribute('id');
        node.setLabel(id || this.getDefaultName_(el.localName));
      }

      if (opt_parent != null) {
        // if the child already exists, the new node will be merged and the original node returned
        node = /** @type {KMLNode} */ (opt_parent.addChild(node));
      } else if (this.rootNode_ === null) {
        this.rootNode_ = node;
      } else if (this.rootNode_.getLabel() != node.getLabel()) {
        // the root node name changed, so start with a fresh tree. if this rains on anyone's parade we can probably
        // just rename the existing root node but we're assuming this means the KML has changed significantly
        this.rootNode_.dispose();
        this.rootNode_ = node;
      } else {
        // keep the old root node
        node = this.rootNode_;
      }
    }

    return node;
  }

  /**
   * Examine styles that are unsupported in OpenLayers KML styles.
   *
   * @param {Node} node Node.
   * @private
   */
  examineStyles_(node) {
    var n;
    for (n = node.firstElementChild; n; n = n.nextElementSibling) {
      if (n.localName == 'BalloonStyle') {
        var properties = pushParseAndPop({}, kml.BALLOON_PROPERTY_PARSERS, n, []);
        if (properties) {
          var id = node.id || node.getAttribute('id');
          this.balloonStyleMap[id] = properties;
        }
      }
    }
  }

  /**
   * Read the KML balloon style.
   *
   * @param {Element} el The XML element
   * @param {Feature} feature The feature
   * @private
   *
   * @suppress {accessControls} To allow direct access to feature metadata.
   */
  readBalloonStyle_(el, feature) {
    if (feature.get(annotation.OPTIONS_FIELD)) {
      // the feature is an Open Sphere annotation, so ignore the balloon style. it's there for display in other
      // applications, like Google Earth.
      return;
    }

    var style;
    var balloonEl = el.querySelector('BalloonStyle');
    if (balloonEl) {
      // the placemark has an internal balloon style
      style = pushParseAndPop({}, kml.BALLOON_PROPERTY_PARSERS, balloonEl, []);
    } else {
      // look for a balloon style referenced by styleUrl
      var styleUrl = /** @type {string} */ (feature.get('styleUrl'));
      var styleId = this.getStyleId(decodeURIComponent(styleUrl));
      style = styleId in this.balloonStyleMap ? this.balloonStyleMap[styleId] : null;
    }

    if (style) {
      var text = style['text'];
      var pattern = /[$]\[(.*?)\]/g;
      var regex = new RegExp(pattern);

      text = text.replace(regex, function(match, key) {
        if (key in feature.values_) {
          return feature.get(key);
        } else {
          return '';
        }
      });

      text = ui.sanitize(text);

      feature.set(KMLField.BALLOON_TEXT, text);
    }
  }

  /**
   * Creates a tree node from an XML element
   *
   * @param {Element} el The XML element
   * @return {KMLNode} The tree node
   * @private
   */
  examineElement_(el) {
    var node = null;
    if (el.localName === 'NetworkLink') {
      node = this.readNetworkLink_(el);
    } else if (el.localName === 'GroundOverlay') {
      node = this.readGroundOverlay_(el);
    } else if (el.localName === 'ScreenOverlay') {
      node = this.readScreenOverlay_(el);
    } else if (el.localName === 'Tour') {
      var tour = parseTour(el);
      if (tour) {
        node = new KMLTourNode(tour);
      }
    } else if (this.kmlThingRegex_ && this.kmlThingRegex_.test(el.localName) && el.localName != 'NetworkLinkControl') {
      var feature = this.readPlacemark_(el);
      if (feature) {
        node = new KMLNode();
        node.setFeature(feature);
        node.layerUI = 'kmlnodelayerui';
      }
    } else {
      node = new KMLNode();
    }

    if (node) {
      this.updateNode_(el, node, baseElementParsers);
    }

    return node;
  }

  /**
   * Executes a set of parsers to modify a tree node from an element.
   *
   * @param {Element} el The XML element
   * @param {KMLNode} node The KML tree node
   * @param {Object<string, KMLElementParser>} parsers The parsers to use
   * @private
   */
  updateNode_(el, node, parsers) {
    var n;
    for (n = dom.getFirstElementChild(el); n !== null; n = n.nextElementSibling) {
      var parser = parsers[n.localName];
      if (parser !== undefined) {
        parser.call(this, node, n);
      }
    }
  }

  /**
   * Get a default name for a KML tree node
   *
   * @param {string} localName The element name
   * @return {string}
   * @private
   */
  getDefaultName_(localName) {
    this.unnamedCount_++;

    if (localName == 'kml') {
      // this is the root node, so make it obvious
      return 'kmlroot';
    }

    return 'Unnamed ' + this.unnamedCount_ + ' [' + localName + ']';
  }

  /**
   * Parses a KML NetworkLink element into a tree node
   *
   * @param {Element} el The XML element
   * @return {KMLNetworkLinkNode} The network link node, or null if unable to parse
   * @private
   */
  readNetworkLink_(el) {
    var node = null;
    var linkObj = pushParseAndPop({}, kml.OL_NETWORK_LINK_PARSERS(), el, []);
    if (linkObj && linkObj['href']) {
      node = new KMLNetworkLinkNode(linkObj['href']);

      // default provided by KML spec
      var refreshMode = linkObj['refreshMode'];
      if (refreshMode && googObject.containsValue(osUiFileKml.RefreshMode, refreshMode)) {
        node.setRefreshMode(refreshMode);

        switch (refreshMode) {
          case osUiFileKml.RefreshMode.CHANGE:
            // this is the default, so nothing to do unless we start parsing viewRefreshMode
            break;
          case osUiFileKml.RefreshMode.EXPIRE:
            // the network link should refresh based on HTTP headers or the NetworkLinkControl tag in the fetched KML,
            // so nothing else to do here
            break;
          case osUiFileKml.RefreshMode.INTERVAL:
            var interval = /** @type {number} */ (linkObj['refreshInterval']);
            if (typeof interval === 'number' && !isNaN(interval)) {
              node.setRefreshInterval(interval * 1000);
            }
            break;
          default:
            break;
        }
      }

      var viewRefreshMode = linkObj['viewRefreshMode'];
      if (viewRefreshMode && googObject.containsValue(osUiFileKml.ViewRefreshMode, viewRefreshMode)) {
        node.setViewRefreshMode(viewRefreshMode);

        switch (viewRefreshMode) {
          case osUiFileKml.ViewRefreshMode.NEVER:
            // do nothing
            break;
          case osUiFileKml.ViewRefreshMode.REQUEST:
            // the node handles this case by automatically populating the current view BBOX when the user manually
            // refreshes the layer
            break;
          case osUiFileKml.ViewRefreshMode.STOP:
          case osUiFileKml.ViewRefreshMode.REGION:
            // TODO: Region support. For now I'm going to treat it like onStop, but regions are a more
            // complicated construct for determining view refreshes that we don't support yet.

            // there should be a second parameter defining a time delay after changes for these cases
            var time = /** @type {number} */ (linkObj['viewRefreshTime']);
            if (typeof time === 'number' && !isNaN(time)) {
              node.setViewRefreshTimer(time * 1000);
            }
            break;
          default:
            break;
        }
      }
    }

    return node;
  }

  /**
   * Parses a KML Placemark element into a map feature
   *
   * @param {Element} el The XML element
   * @return {DynamicFeature|Feature|undefined} The map feature
   * @private
   *
   * I don't care what you think, compiler.
   * @suppress {accessControls}
   */
  readPlacemark_(el) {
    asserts.assert(el.nodeType == NodeType.ELEMENT, 'el.nodeType should be ELEMENT');
    asserts.assert(el.localName in this.parsersByPlacemarkTag_,
        'localName should be Placemark or be defined by Schema tags');

    var set = this.parsersByPlacemarkTag_[el.localName];
    var object = {'geometry': null};

    // This is slightly odd in that it allows parent parsers to override values set by
    // child parsers (generally the opposite of what you expect from inheritence), however,
    // use of Schema tags is silly if you are just using them for key/value pairs (that's what
    // ExtendedData is for) and anything more complicated isn't going to be handled by this
    // parser anyway.
    while (set) {
      object = pushParseAndPop(object, set.parsers, el, []);
      set = set.parent ? this.parsersByPlacemarkTag_[set.parent] : null;
    }

    if (!object) {
      return null;
    }

    if (this.hasModel_) {
      model.parseModel(el, object);
    }

    // set geometry fields on the object
    var geometry = /** @type {ol.geom.Geometry|undefined} */ (object['geometry']);
    delete object['geometry'];

    if (geometry) {
      var geometryType = geometry.getType();

      // grab the lon/lat coordinate before we potentially convert it to god knows what
      if (geometryType == GeometryType.POINT) {
        var coord = /** @type {!ol.geom.Point} */ (geometry).getFirstCoordinate();
        if (coord.length > 1) {
          object[Fields.LAT] = object[Fields.LAT] || coord[1];
          object[Fields.LON] = object[Fields.LON] || coord[0];

          if ((coord.length > 2) && (coord[2] != 0)) {
            object[Fields.GEOM_ALT] = object[Fields.GEOM_ALT] || coord[2];
          }
        }
      } else if (geometryType == GeometryType.LINE_STRING) {
        // If tessellation is explicitly disabled, disable interpolation on the geometry. This includes setting the
        // altitude mode to absolute to prevent tessellation in 3D.
        var tessellate = geometry.get('tessellate');
        if (tessellate === false) {
          geometry.set(METHOD_FIELD, Method.NONE);
          geometry.set(RecordField.ALTITUDE_MODE, AltitudeMode.ABSOLUTE);
        }
      }

      // KML specification defaults altitudeMode to clampToGround for all geometry types.
      var altitudeMode = geometry.get(RecordField.ALTITUDE_MODE);
      if (!altitudeMode) {
        geometry.set(RecordField.ALTITUDE_MODE, AltitudeMode.CLAMP_TO_GROUND);
      }

      // convert to application projection
      geometry.osTransform();
    }

    // make sure parsed styles don't appear as a source column
    if (object['Style']) {
      object[kml.STYLE_KEY] = object['Style'];
      delete object['Style'];
    }

    var feature;
    if ((geometry instanceof LineString || geometry instanceof MultiLineString) &&
        geometry.getLayout() === GeometryLayout.XYZM) {
      // Openlayers parses KML tracks into a LineString/MultiLineString with the XYZM layout (lon, lat, alt, time). if one
      // of these is encountered, create a track so it can be animated on the timeline.

      if (geometry instanceof MultiLineString && geometry.get('interpolate')) {
        // if a multi track should be interpolated, join it into a single line. the track updates will handle the
        // interpolation between known positions.
        var flatCoordinates = geometry.getFlatCoordinates();
        var coordinates = inflateCoordinates(flatCoordinates, 0, flatCoordinates.length, 4);
        geometry = new LineString(coordinates);
      }

      feature = track.createTrack(/** @type {!CreateOptions} */ ({
        geometry: geometry,
        name: /** @type {string|undefined} */ (object['name'])
      }));
    } else {
      feature = new Feature(geometry);
    }

    if (feature) {
      this.setFeatureId_(feature);

      // parse any fields that are known to contain JSON data into objects
      for (var i = 0, ii = JsonField.length; i < ii; i++) {
        var field = JsonField[i];

        if (object[field] && typeof object[field] === 'string') {
          object[field] = JSON.parse(object[field]);
        }
      }

      feature.setProperties(object);

      // create/modify the set of columns detected in the file. for now, just keep a basic set to keep this as low
      // overhead as possible.
      if (!this.columnMap_) {
        this.columnMap_ = [];
      }

      for (var key in object) {
        this.columnMap_[key] = true;
      }

      this.applyStyles_(el, feature);
    }

    return feature;
  }

  /**
   * Parses a KML GroundOverlay element into a map layer.
   *
   * @param {Element} el The XML element.
   * @return {KMLNode} A KML node for the overlay, or null if one couldn't be created.
   * @private
   */
  readGroundOverlay_(el) {
    asserts.assert(el.nodeType == NodeType.ELEMENT, 'el.nodeType should be ELEMENT');
    asserts.assert(el.localName == 'GroundOverlay', 'localName should be GroundOverlay');

    var obj = pushParseAndPop({}, kml.GROUND_OVERLAY_PARSERS, el, []);
    if (obj) {
      if (obj['extent'] && obj['Icon'] && obj['Icon']['href']) {
        var icon = /** @type {string} */ (obj['Icon']['href']);
        if (this.assetMap_[icon]) {
          icon = this.assetMap_[icon]; // handle images included in a kmz
        }

        var extent = transformExtent(/** @type {ol.Extent} */ (obj['extent']), osProj.EPSG4326,
            osMap.PROJECTION);

        var feature = new Feature();
        this.setFeatureId_(feature);

        if (obj[RecordField.TIME]) {
          feature.set(RecordField.TIME, obj[RecordField.TIME], true);
        }

        var image = new Image({
          source: new ImageStatic({
            crossOrigin: net.getCrossOrigin(icon),
            url: icon,
            imageExtent: extent,
            projection: osMap.PROJECTION
          }, -(obj['rotation'] || 0))
        });
        image.setId(/** @type {string} */ (feature.getId()));
        image.setLayerUI(KMLImageLayerUI.directiveTag);
        image.setLayerOptions({[ControlType.COLOR]: ColorControlType.PICKER_RESET});

        var node = new KMLNode();
        node.setFeature(feature);
        node.setImage(image);

        return node;
      } else if (obj['error']) {
        var msg = obj['error'].toString();
        log.warning(logger, msg);
        AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.WARNING);
      }
    }

    return null;
  }

  /**
   * Parses a KML ScreenOverlay element into a legend style window.
   *
   * @param {Element} el The XML element.
   * @return {KMLNode} A KML node for the overlay, or null if one couldn't be created.
   * @private
   */
  readScreenOverlay_(el) {
    asserts.assert(el.nodeType == NodeType.ELEMENT, 'el.nodeType should be ELEMENT');
    asserts.assert(el.localName == 'ScreenOverlay', 'localName should be ScreenOverlay');

    var obj = pushParseAndPop({}, kml.SCREEN_OVERLAY_PARSERS, el, []);
    if (obj && obj['name'] && obj['Icon'] && obj['Icon']['href']) {
      var name = /** @type {string} */ (obj['name']);

      var icon = /** @type {string} */ (obj['Icon']['href']);
      if (this.assetMap_[icon]) {
        icon = this.assetMap_[icon]; // handle images included in a kmz
      }

      var screenXY = this.parseScreenXY_(/** @type {ol.KMLVec2_} */ (obj['screenXY']));
      var size = this.parseSizeXY_(/** @type {ol.KMLVec2_} */ (obj['size']));
      if (screenXY && size) {
        var feature = new Feature();
        this.setFeatureId_(feature);

        if (obj[RecordField.TIME]) {
          feature.set(RecordField.TIME, obj[RecordField.TIME], true);
        }

        var overlayOptions = /** @type {!osx.window.ScreenOverlayOptions} */ ({
          id: feature.getId(),
          name: this.rootNode_.getLabel() + ' - ' + name,
          image: icon,
          size: size,
          xy: screenXY,
          showHide: true
        });

        var node = new KMLNode();
        node.setFeature(feature);
        node.setOverlayOptions(overlayOptions);

        return node;
      }
    }

    return null;
  }

  /**
   * Parse XY attributes from a screenXY element and return an object with more useful location coordinates
   *
   * @param {ol.KMLVec2_} options The XY options.
   * @return {Array<string|number>} An array with x/y values representing location in pixels.
   * @private
   */
  parseScreenXY_(options) {
    if (options && options.x != null && options.y != null) {
      var xy = [0, 0];
      var mapSize = MapContainer.getInstance().getMap().getSize();

      if (options.xunits == IconAnchorUnits.FRACTION) {
        if (options.x == 0.5) {
          xy[0] = 'center';
        } else {
          xy[0] = mapSize[0] * options.x;
        }
      } else {
        xy[0] = options.x;
      }

      if (options.yunits == IconAnchorUnits.FRACTION) {
        if (options.y == 0.5) {
          xy[1] = 'center';
        } else {
          xy[1] = mapSize[1] - (mapSize[1] * options.y);
        }
      } else {
        xy[1] = options.y;
      }

      return xy;
    }

    return null;
  }

  /**
   * Parse XY attributes from a size element and return an object with more sizing for our overlay
   *
   * @param {ol.KMLVec2_} options The XY options.
   * @return {Array<string|number>} An array with x/y values representing size in pixels.
   * @private
   */
  parseSizeXY_(options) {
    if (options && options.x != null && options.y != null) {
      var xy = [0, 0];
      var mapSize = MapContainer.getInstance().getMap().getSize();

      if (options.xunits == IconAnchorUnits.FRACTION) {
        // -1 = use native, 0 = maintain aspect, n = relative to screen size
        if (options.x == -1 || options.x == 0) {
          // TODO: no easy way of knowing what size the image is... don't set a size
        } else {
          xy[0] = mapSize[0] * options.x;
        }
      } else {
        xy[0] = options.x;
      }

      if (options.yunits == IconAnchorUnits.FRACTION) {
        // -1 = use native, 0 = maintain aspect, n = relative to screen size
        if (options.y == -1 || options.y == 0) {
          // TODO: no easy way of knowing what size the image is... don't set a size
        } else {
          xy[1] = mapSize[1] * options.y;
        }
      } else {
        xy[1] = options.y;
      }

      return xy;
    }

    return null;
  }

  /**
   * @param {Element} el The XML element
   * @param {Feature} feature The feature
   * @private
   */
  applyStyles_(el, feature) {
    var styles = [];
    var highlightStyle = null;

    // style from style url
    var styleUrl = /** @type {string} */ (feature.get('styleUrl'));
    if (styleUrl) {
      var styleId = this.getStyleId(decodeURIComponent(styleUrl));
      styles.push(styleId in this.styleMap_ ? this.styleMap_[styleId] : null);
      highlightStyle = styleId in this.highlightStyleMap_ ? this.highlightStyleMap_[styleId] : null;
    }

    this.readBalloonStyle_(el, feature);


    // local style
    var style = /** @type {Object} */ (feature.get(kml.STYLE_KEY));
    if (style) {
      this.updateStyleConfig_(style);
      styles.push(style);
    }

    // inherited styles
    var p = el.parentNode;
    while (p) {
      if (p.kmlStyle) {
        styles.unshift(p.kmlStyle);
      }

      p = p.parentNode;
    }

    // default style
    styles.unshift(kml.DEFAULT_STYLE);

    // reduce style sets to single set
    var mergedStyle = styles.reduce(KMLParser.reduceStyles_, null);
    if (mergedStyle) {
      var existingStyle = /** @type {Array<!Object>|Object|undefined} */ (feature.get(StyleType.FEATURE));
      if (existingStyle) {
        // if the feature already has a style config, merge in the KML style
        if (Array.isArray(existingStyle)) {
          for (var i = 0; i < existingStyle.length; i++) {
            osObject.merge(mergedStyle, existingStyle[i]);
          }
        } else {
          osObject.merge(mergedStyle, existingStyle);
        }
      } else {
        // set the style config for the feature
        feature.set(StyleType.FEATURE, mergedStyle, true);
      }

      if (highlightStyle) {
        feature.set(StyleType.CUSTOM_HIGHLIGHT, highlightStyle, true);
      }

      // set the feature shape if it wasn't defined in the file and an icon style is present
      if (!feature.get(StyleField.SHAPE) && osStyle.isIconConfig(mergedStyle)) {
        feature.set(StyleField.SHAPE, osStyle.ShapeType.ICON);
      }

      // set the feature shape if it wasn't defined in the file and an icon style is present
      if (!feature.get(StyleField.CENTER_SHAPE) && osStyle.isIconConfig(mergedStyle)) {
        feature.set(StyleField.CENTER_SHAPE, osStyle.ShapeType.ICON);
      }

      // apply the feature style
      osStyle.setFeatureStyle(feature);
    }

    var description = /** @type {string} */ (feature.get('description'));
    if (description) {
      // support KMZ assets in the description
      for (var key in this.assetMap_) {
        // replace naive URLs
        var pattern = 'src=["\']' + key.replace(/(.)/g, '[$1]') + '["\']';
        var regex = new RegExp(pattern);
        description = description.replace(regex, 'src="' + this.assetMap_[key] + '"');

        // Replace href's
        pattern = 'href=["\']' + key.replace(/(.)/g, '[$1]') + '["\']';
        regex = new RegExp(pattern);
        description = description.replace(regex, 'href="' + this.assetMap_[key] + '"');

        // replace properly encoded URLs
        var encodedKey = new Uri(key).toString();
        pattern = 'src=["\']' + encodedKey.replace(/(.)/g, '[$1]') + '["\']';
        regex = new RegExp(pattern);
        description = description.replace(regex, 'src="' + this.assetMap_[key] + '"');

        // Replace href's for encoded URLs
        pattern = 'href=["\']' + encodedKey.replace(/(.)/g, '[$1]') + '["\']';
        regex = new RegExp(pattern);
        description = description.replace(regex, 'href="' + this.assetMap_[key] + '"');
      }

      feature.set('description', description);
    }
  }

  /**
   * Extracts all immediate styles from the provided element.
   *
   * @param {Element} el The XML element
   * @private
   */
  extractStyles_(el) {
    // grab only immediate children. styles are inherited from ancestors only.
    var styleEls = xml.getChildrenByTagName(el, 'Style');
    for (var i = 0, n = styleEls.length; i < n; i++) {
      var style = styleEls[i];

      this.examineStyles_(style);

      var styleConfig = kml.readStyle(style, this.stack_);
      this.updateStyleConfig_(styleConfig);
      var id = style.id || style.getAttribute('id');
      if (!id) {
        // styles without an ID are merely the base styles for the container
        //
        // Clever hack alert!
        // The "stack" in this class is not really a stack. Therefore, we are
        // going to store the KML styles on the element itself
        el.kmlStyle = styleConfig;
        continue;
      }

      if (id in this.styleMap_) {
        var newId = id + '-' + googString.getRandomString();
        var styleUrls = Array.prototype.slice.call(el.querySelectorAll('styleUrl'));
        styleUrls.forEach(function(styleUrl) {
          if (styleUrl.textContent.replace(/^#/, '') == id) {
            styleUrl.textContent = '#' + newId;
          }
        });

        id = newId;
      }

      this.styleMap_[id] = styleConfig;
    }

    // handle StyleMap elements
    styleEls = xml.getChildrenByTagName(el, 'StyleMap');
    for (i = 0, n = styleEls.length; i < n; i++) {
      style = styleEls[i];
      id = style.id || style.getAttribute('id');

      if (!id) {
        log.error(logger, 'StyleMap tags must have an "id" attribute');
        continue;
      }

      var pairs = xml.getChildrenByTagName(style, 'Pair');
      for (var j = 0, m = pairs.length; j < m; j++) {
        var key = xml.getChildValue(pairs[j], 'key');
        var url = xml.getChildValue(pairs[j], 'styleUrl');

        if (key && url) {
          key = key.trim();
          var assignMap = key === 'normal' ? this.styleMap_ : this.highlightStyleMap_;
          url = url.trim().replace(/^#/, '');

          if (url in this.styleMap_) {
            assignMap[id] = this.styleMap_[url];
          }
        }
      }
    }
  }

  /**
   * Gets all the schema tags and adds ol XML parsers for each one
   *
   * @param {Element} el The XML element
   * @private
   */
  parseSchema_(el) {
    var schemas = xml.getChildrenByTagName(el, 'Schema');
    for (var i = 0, n = schemas.length; i < n; i++) {
      var name = schemas[i].name || schemas[i].getAttribute('name');
      if (!name) {
        continue;
      }

      if (this.kmlThings_.indexOf(name) === -1) {
        this.kmlThings_.push(name);
      }

      var fields = xml.getChildrenByTagName(schemas[i], 'SimpleField');

      /**
       * @type {Object<string, ol.XmlParser>}
       */
      var parsers = {};
      var fieldCount = 0;
      for (var j = 0, m = fields.length; j < m; j++) {
        var reader = null;
        var type = fields[j].type || fields[j].getAttribute('type');
        type = type.toLowerCase();

        switch (type) {
          case 'bool':
            reader = readBoolean;
            break;
          case 'int':
          case 'short':
          case 'float':
          case 'double':
            reader = readDecimal;
            break;
          case 'uint':
          case 'ushort':
            reader = readPositiveInteger;
            break;
          default:
            // all other types are strings
            reader = readString;
            break;
        }

        var field = fields[j].name || fields[j].getAttribute('name');
        if (field && reader) {
          parsers[field] = makeObjectPropertySetter(reader);
          fieldCount++;
        }
      }

      if (fieldCount) {
        this.parsersByPlacemarkTag_[name] = {
          parent: /** @type {string} */ (schemas[i].getAttribute('parent')),
          parsers: makeStructureNS(kml.OL_NAMESPACE_URIS(), parsers)
        };
      }
    }

    this.kmlThingRegex_ = this.getKmlThingRegex();
  }

  /**
   * Creates the regex from the current set of KML things.
   *
   * @return {RegExp} The KML regex.
   */
  getKmlThingRegex() {
    return new RegExp('^(' + this.kmlThings_.join('|') + ')$');
  }

  /**
   * @param {Object} config
   * @private
   */
  updateStyleConfig_(config) {
    if (config) {
      // attempt to convert local KMZ asset URIs to the proper data URIs
      if (config['image'] && config['image']['src']) {
        try {
          var src = decodeURIComponent(config['image']['src']);

          if (src && src in this.assetMap_) {
            config['image']['src'] = this.assetMap_[src];
          }
        } catch (e) {
          // ain't no thang
        }
      }
    }
  }

  /**
   * Parse the StyleUrl into the correct id format.
   *
   * @param {string} id The StyleUrl.
   * @return {string} The Parsed Style id.
   */
  getStyleId(id) {
    var x = id.indexOf('#');

    if (x > -1) {
      id = id.substring(x + 1);
    }
    return id;
  }

  /**
   * Set the ID on a KML feature.
   *
   * @param {!Feature} feature The feature.
   * @private
   */
  setFeatureId_(feature) {
    // files containing duplicate network links will create features with duplicate id's. this allows us to merge
    // features on refresh, while still creating an id that's unique from other network links (which will use a
    // different parser)
    var baseId = getUid(feature);
    var id = this.id_ + '#' + baseId;
    feature.setId(id);

    if (feature.get(Fields.ID) == null) {
      feature.set(Fields.ID, baseId, true);
    }
  }

  /**
   * @param {?Object} merged The merged style config
   * @param {Array<Object>} config The current config
   * @return {Object}
   * @private
   */
  static reduceStyles_(merged, config) {
    merged = merged || {};
    osStyle.mergeConfig(config, merged);
    return merged;
  }

  /**
   * Set the KML tree node name.
   *
   * @param {KMLNode} node The KML tree node
   * @param {Element} el The name element
   * @private
   */
  static setNodeLabel_(node, el) {
    asserts.assert(el.localName == 'name', 'localName should be name');

    // default to null and a default label will be created later
    node.setLabel(getAllTextContent(el, true).trim() || null);
  }

  /**
   * Set the KML tree node name.
   *
   * @param {KMLNode} node The KML tree node
   * @param {Element} el The name element
   * @private
   */
  static setNodeCollapsed_(node, el) {
    asserts.assert(el.localName == 'open', 'localName should be open');

    // default to collapsed, so only expand if the text is '1'.
    node.collapsed = getAllTextContent(el, true).trim() !== '1';
  }

  /**
   * Set the KML tree node visibility state.
   *
   * @param {KMLNode} node The KML tree node
   * @param {Element} el The name element
   * @private
   */
  static setNodeVisibility_(node, el) {
    asserts.assert(el.localName == 'visibility', 'localName should be visibility');

    var content = getAllTextContent(el, true).trim();
    if (content) {
      // this only handles turning the node off so we can honor our node defaults. this is specifically for network links,
      // which we always default to being turned off.
      var visibility = readBooleanString(content);
      if (!visibility) {
        node.setState(TriState.OFF);
      }
    }

    var feature = node.getFeature();
    if (feature) {
      // remove the visibility property so it doesn't show up in the list tool
      feature.set('visibility', undefined);
    }
  }
}

/**
 * @type {Array<string>}
 * @const
 */
KMLParser.KML_THINGS = ['NetworkLink', 'Placemark', 'GroundOverlay', 'ScreenOverlay', 'Tour'];

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('plugin.file.kml.KMLParser');

/**
 * Fields to ignore when creating the column list.
 * @type {RegExp}
 * @private
 * @const
 */
KMLParser.SKIPPED_COLUMNS_ = /^(geometry|recordtime|time|styleurl|visibility|_kmlStyle)$/i;

/**
 * @typedef {function(KMLNode, Element)}
 */
let KMLElementParser;

/**
 * @type {Object<string, KMLElementParser>}
 */
const baseElementParsers = {
  'name': KMLParser.setNodeLabel_,
  'open': KMLParser.setNodeCollapsed_,
  'visibility': KMLParser.setNodeVisibility_
};
