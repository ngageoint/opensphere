goog.provide('plugin.file.kml.KMLParser');

goog.require('goog.Uri');
goog.require('goog.asserts');
goog.require('goog.async.ConditionalDelay');
goog.require('goog.dom');
goog.require('goog.dom.NodeType');
goog.require('goog.dom.xml');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.object');
goog.require('ol.Feature');
goog.require('ol.format.Feature');
goog.require('ol.format.XSD');
goog.require('ol.geom.LineString');
goog.require('ol.geom.flat.inflate');
goog.require('ol.layer.Image');
goog.require('ol.xml');
goog.require('os.annotation');
goog.require('os.data.ColumnDefinition');
goog.require('os.file.mime.text');
goog.require('os.file.mime.zip');
goog.require('os.layer.Image');
goog.require('os.net.Request');
goog.require('os.object');
goog.require('os.parse.AsyncZipParser');
goog.require('os.parse.IParser');
goog.require('os.source.ImageStatic');
goog.require('os.track');
goog.require('os.ui.file.kml');
goog.require('os.xml');
goog.require('plugin.file.kml');
goog.require('plugin.file.kml.KMLField');
goog.require('plugin.file.kml.model');
goog.require('plugin.file.kml.tour.FlyTo');
goog.require('plugin.file.kml.tour.Tour');
goog.require('plugin.file.kml.tour.TourControl');
goog.require('plugin.file.kml.tour.Wait');
goog.require('plugin.file.kml.tour.parseTour');
goog.require('plugin.file.kml.ui.KMLNetworkLinkNode');
goog.require('plugin.file.kml.ui.KMLNode');
goog.require('plugin.file.kml.ui.KMLTourNode');


/**
 * @typedef {{
 *   children: !(Array|NodeList),
 *   index: number,
 *   node: plugin.file.kml.ui.KMLNode
 * }}
 */
plugin.file.kml.KMLParserStackObj;



/**
 * Parses a KML source
 *
 * @param {Object.<string, *>} options Layer configuration options.
 * @extends {os.parse.AsyncZipParser}
 * @implements {os.parse.IParser.<plugin.file.kml.ui.KMLNode>}
 * @template T
 * @constructor
 */
plugin.file.kml.KMLParser = function(options) {
  plugin.file.kml.KMLParser.base(this, 'constructor');

  // load default KML styles
  plugin.file.kml.createStyleDefaults();

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
  this.id_ = goog.string.getRandomString();

  /**
   * The logger
   * @type {goog.log.Logger}
   * @private
   */
  this.log_ = plugin.file.kml.KMLParser.LOGGER_;

  /**
   * If the parse should merge into an existing tree
   * @type {boolean}
   * @private
   */
  this.merging_ = false;

  /**
   * The root KML tree node
   * @type {plugin.file.kml.ui.KMLNode}
   * @private
   */
  this.rootNode_ = null;

  /**
   * Columns detected in the KML
   * @type {Array<!os.data.ColumnDefinition>}
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
   * @type {!Array.<!plugin.file.kml.KMLParserStackObj>}
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
   * @type {Object<string, boolean|os.net.Request>}
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
  this.kmlThings_ = plugin.file.kml.KMLParser.KML_THINGS.slice();

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
      parsers: plugin.file.kml.OL_PLACEMARK_PARSERS()
    }
  };
};
goog.inherits(plugin.file.kml.KMLParser, os.parse.AsyncZipParser);


/**
 * @type {Array<string>}
 * @const
 */
plugin.file.kml.KMLParser.KML_THINGS = ['NetworkLink', 'Placemark', 'GroundOverlay', 'ScreenOverlay', 'Tour'];


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.file.kml.KMLParser.LOGGER_ = goog.log.getLogger('plugin.file.kml.KMLParser');


/**
 * Fields to ignore when creating the column list.
 * @type {RegExp}
 * @private
 * @const
 */
plugin.file.kml.KMLParser.SKIPPED_COLUMNS_ = /^(geometry|recordtime|time|styleurl|_kmlStyle)$/i;


/**
 * @inheritDoc
 */
plugin.file.kml.KMLParser.prototype.disposeInternal = function() {
  this.cleanup();
  this.clearAssets();
  plugin.file.kml.KMLParser.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLParser.prototype.cleanup = function() {
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
};


/**
 * Cleans up any KMZ assets. This should be done before parsing again or when the layer is removed.
 */
plugin.file.kml.KMLParser.prototype.clearAssets = function() {
  this.assetMap_ = {};
};


/**
 * Get the last parsed root KML tree node. This reference will be lost on cleanup, so it must be retrieved when parsing
 * completes.
 *
 * @return {plugin.file.kml.ui.KMLNode}
 */
plugin.file.kml.KMLParser.prototype.getRootNode = function() {
  return this.rootNode_;
};


/**
 * Get the minimum refresh period (from the network link control)
 *
 * @return {number}
 */
plugin.file.kml.KMLParser.prototype.getMinRefreshPeriod = function() {
  return this.minRefreshPeriod_;
};


/**
 * Set the root KML tree node. Use this to merge the parse result into an existing tree.
 *
 * @param {plugin.file.kml.ui.KMLNode} rootNode
 */
plugin.file.kml.KMLParser.prototype.setRootNode = function(rootNode) {
  this.rootNode_ = rootNode;
  this.merging_ = !!rootNode;
};


/**
 * Get columns detected in the KML.
 *
 * @return {Array<!os.data.ColumnDefinition>}
 */
plugin.file.kml.KMLParser.prototype.getColumns = function() {
  if (!this.columns_ && this.columnMap_) {
    // translate the column map into slickgrid columns
    this.columns_ = [];

    for (var column in this.columnMap_) {
      if (column === os.data.RecordField.TIME) {
        // display the recordTime field as TIME
        this.columns_.push(new os.data.ColumnDefinition(os.Fields.TIME, os.data.RecordField.TIME));
      } else if (!plugin.file.kml.KMLParser.SKIPPED_COLUMNS_.test(column)) {
        this.columns_.push(new os.data.ColumnDefinition(column));
      }
    }

    this.columnMap_ = null;
  }

  return this.columns_;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLParser.prototype.hasNext = function() {
  return this.stack_.length > 0;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLParser.prototype.setSource = function(source) {
  this.cleanup();

  if (ol.xml.isDocument(source)) {
    this.document_ = /** @type {Document} */ (source);
  } else if (typeof source === 'string') {
    this.document_ = os.xml.loadXml(source);
  } else if (source instanceof ArrayBuffer) {
    if (os.file.mime.zip.isZip(source)) {
      this.clearAssets();
      this.createZipReader(source);
      return;
    } else {
      var s = os.file.mime.text.getText(source);
      if (s) {
        this.document_ = goog.dom.xml.loadXml(s);
      } else {
        goog.log.error(this.log_, 'Source buffer does not appear to be text');
        this.onError();
      }
    }
  } else if (source instanceof Blob) {
    goog.fs.FileReader.readAsArrayBuffer(source).addCallback(this.setSource, this);
    return;
  }

  if (this.document_) {
    var rootEl = goog.dom.getFirstElementChild(this.document_);
    if (rootEl && rootEl.localName.toLowerCase() !== 'kml') {
      // Sometimes people are dumb and create documents without a root <kml> tag.
      // This is technically invalid KML and even invalid XML.  Because Google Earth
      // accepts this crap, add a special case to put the proper root tag.
      var newRoot = os.xml.createElement('kml', this.document_);

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
      goog.log.error(this.log_, 'No KML content to parse!');
      this.onError();
    }
  } else {
    goog.log.error(this.log_, 'Content must be a valid KML document!');
    this.onError();
  }
};


/**
 * @protected
 * @return {boolean} Whether or not external styles are loading
 */
plugin.file.kml.KMLParser.prototype.loadExternalStyles = function() {
  var styles = this.document_.querySelectorAll('styleUrl');
  var extStylesFound = false;

  for (var i = 0, n = styles.length; i < n; i++) {
    var style = ol.xml.getAllTextContent(styles[i], true).trim();
    if (style) {
      // remove the fragment, if url is incorrectly formatted, kml is bad and this url should be skipped
      var url = style.replace(/#.*/, '');
      url = encodeURI(url) === url ? url : undefined;
      if (url) {
        extStylesFound = true;
        goog.dom.setTextContent(styles[i], '#' + style.replace('#', '_'));

        if (!(url in this.extStyles_)) {
          if (url in this.kmlEntries_) {
            var entry = this.kmlEntries_[url];
            entry.getData(new zip.BlobWriter(), this.processZIPEntry_.bind(this, entry.filename));
            this.extStyles_[url] = true;
          } else {
            var req = new os.net.Request(url);
            req.listen(goog.net.EventType.SUCCESS, this.onExtStyleLoad, false, this);
            req.listen(goog.net.EventType.ERROR, this.onExtStyleLoad, false, this);
            this.extStyles_[url] = req;
            req.load();
          }
        }
      }
    }
  }

  return extStylesFound;
};


/**
 * @param {goog.events.Event} evt
 * @protected
 */
plugin.file.kml.KMLParser.prototype.onExtStyleLoad = function(evt) {
  var req = /** @type {os.net.Request} */ (evt.target);
  var url = req.getUri().toString();
  var safeUrl = this.extStyles_[url] ? url : decodeURI(url);
  delete this.extStyles_[safeUrl];

  var resp = /** @type {string} */ (req.getResponse());
  req.dispose();

  if (evt.type === goog.net.EventType.SUCCESS) {
    this.handleExternalStylesheet_(resp, url);
  } else {
    this.continueStyles_();
  }
};


/**
 * @param {!string} content
 * @param {!string} url
 * @private
 */
plugin.file.kml.KMLParser.prototype.handleExternalStylesheet_ = function(content, url) {
  try {
    var doc = goog.dom.xml.loadXml(content);
    var appendTo = this.document_.querySelector('Document') || goog.dom.getFirstElementChild(this.document_);

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
    goog.log.error(this.log_, 'Could not parse KML stylesheet ' + url);
  }

  this.continueStyles_();
};


/**
 * Keep waiting for styles or begin if they are done
 *
 * @private
 */
plugin.file.kml.KMLParser.prototype.continueStyles_ = function() {
  // if we still have any outstanding style requests, keep waiting
  for (var key in this.extStyles_) {
    return;
  }

  // otherwise start parsing the main document
  this.begin();
};


/**
 * @protected
 */
plugin.file.kml.KMLParser.prototype.begin = function() {
  var rootEl = goog.dom.getFirstElementChild(this.document_);
  var rootChildren = goog.dom.getChildren(rootEl);

  if (rootChildren && rootChildren.length > 0) {
    // start parsing at the first child of the kml tag
    this.stack_.push(/** @type {plugin.file.kml.KMLParserStackObj} */ ({
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
    goog.log.error(this.log_, 'Empty KML tree!');
    this.onError();
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLParser.prototype.handleZipReaderError = function() {
  plugin.file.kml.KMLParser.base(this, 'handleZipReaderError');
  this.onError();
};


/**
 * HACK ALERT! zip.js has a zip.TextWriter() class that directly turns the zip entry into the string we want.
 * Unfortunately, it doesn't work in FF24 for some reason, but luckily, the BlobWriter does. Here, we read
 * the zip as a Blob, then feed it to a FileReader in the next callback in order to extract the text.
 *
 * @inheritDoc
 */
plugin.file.kml.KMLParser.prototype.handleZipEntries = function(entries) {
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
      result.lastIndex = 0;

      this.kmzImagesRemaining_++;

      entry.getData(new zip.Data64URIWriter('image/' + result[1]), this.processZipAsset_.bind(this, entry.filename));
    } else if (collada.test(entry.filename)) {
      this.hasModel_ = true;
      this.kmzImagesRemaining_++;
      entry.getData(new zip.TextWriter(), this.processZipAsset_.bind(this, entry.filename));
    }
  }

  mainEntry = mainEntry || firstEntry;


  // before processing the main KML, try to delay until all images have been added to our asset map
  // move on if it takes longer than 20 seconds
  if (mainEntry) {
    var delay = new goog.async.ConditionalDelay(this.imagesRemaining_.bind(this));
    delay.onSuccess = this.processMainEntry_.bind(this, mainEntry, true);
    delay.onFailure = this.processMainEntry_.bind(this, mainEntry, false);
    delay.start(200, 20000);
  } else {
    goog.log.error(this.log_, 'No KML found in the ZIP!');
    this.onError();
  }
};


/**
 * Parse the main kml file
 *
 * @param {zip.Entry} mainEntry
 * @param {boolean} success True if all entries/images were processed
 * @private
 */
plugin.file.kml.KMLParser.prototype.processMainEntry_ = function(mainEntry, success) {
  if (!success) {
    goog.log.error(this.log_, 'Failed to process KMZ images in a timely manner - skipping ' +
        this.kmzImagesRemaining_ + ' images.');
  }
  mainEntry.getData(new zip.BlobWriter(), this.processZIPEntry_.bind(this, mainEntry.filename));
};


/**
 * True if we have processed all images
 *
 * @return {boolean} True if not all images have been processes
 * @private
 */
plugin.file.kml.KMLParser.prototype.imagesRemaining_ = function() {
  return this.kmzImagesRemaining_ <= 0;
};


/**
 * Handler for processing assets within the ZIP file. This includes images and collada model files.
 * @param {*} filename
 * @param {*} uri
 * @private
 */
plugin.file.kml.KMLParser.prototype.processZipAsset_ = function(filename, uri) {
  if (typeof filename === 'string' && typeof uri === 'string') {
    this.assetMap_[filename] = uri;
    this.kmzImagesRemaining_--;
  } else {
    goog.log.error(this.log_, 'There was a problem unzipping the KMZ!');
    this.onError();
  }
};


/**
 * @param {string} filename
 * @param {*} content
 * @private
 */
plugin.file.kml.KMLParser.prototype.processZIPEntry_ = function(filename, content) {
  if (content && content instanceof Blob) {
    var reader = new FileReader();
    reader.onload = this.handleZIPText_.bind(this, filename);
    reader.readAsText(content);
  } else {
    goog.log.error(this.log_, 'There was a problem unzipping the KMZ!');
    this.onError();
  }
};


/**
 * @param {string} filename
 * @param {Event} event
 * @private
 */
plugin.file.kml.KMLParser.prototype.handleZIPText_ = function(filename, event) {
  var content = event.target.result;

  if (content && typeof content === 'string') {
    if (!this.document_) {
      this.setSource(content);
    } else {
      delete this.extStyles_[filename];
      this.handleExternalStylesheet_(content, filename);
    }
  } else {
    goog.log.error(this.log_, 'There was a problem reading the ZIP content!');
    this.onError();
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLParser.prototype.parseNext = function() {
  goog.asserts.assert(this.stack_.length > 0, 'Stack should not be empty');
  goog.asserts.assert(this.stack_[this.stack_.length - 1] != null, 'Top of stack should be an object');

  var stackObj = null;
  var node = null;
  var top = this.stack_[this.stack_.length - 1];
  var parentNode = top.node;
  var children = top.children;
  var currentEl = children[top.index];

  if (!currentEl) {
    var msg = 'Encountered null child under node ' + (parentNode ? parentNode.getLabel() : 'Unknown') + ' - skipping.';
    goog.log.warning(this.log_, msg);
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

        var stackChildren = goog.dom.getChildren(currentEl);
        if (stackChildren && stackChildren.length > 0) {
          // only continue down this path if the element has children to parse
          stackObj = /** @type {plugin.file.kml.KMLParserStackObj} */ ({
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

    goog.log.error(this.log_, 'Failed parsing node type: ' + localName, e);
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
};


/**
 * Parses sample data from a KML.
 *
 * @return {!Array<!ol.Feature>}
 */
plugin.file.kml.KMLParser.prototype.parsePreview = function() {
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
};


/**
 * Marks the node's children for removal.
 *
 * @param {!plugin.file.kml.ui.KMLNode} node The KML node
 * @private
 */
plugin.file.kml.KMLParser.prototype.markAllChildren_ = function(node) {
  var children = node.getChildren();
  if (children) {
    for (var i = 0, n = children.length; i < n; i++) {
      /** @type {plugin.file.kml.ui.KMLNode} */ (children[i]).marked = true;
    }
  }
};


/**
 * Removes all marked children from a node.
 *
 * @param {!plugin.file.kml.ui.KMLNode} node The KML node
 * @private
 */
plugin.file.kml.KMLParser.prototype.removeMarkedChildren_ = function(node) {
  var children = node.getChildren();
  if (children) {
    var i = children.length;
    while (i--) {
      var child = /** @type {plugin.file.kml.ui.KMLNode} */ (children[i]);
      if (child.marked) {
        node.removeChildAt(i);
        child.dispose();
      }
    }
  }
};


/**
 * Creates a tree node from an XML element
 *
 * @param {Element} el The XML element
 * @param {plugin.file.kml.ui.KMLNode=} opt_parent The parent tree node
 * @return {plugin.file.kml.ui.KMLNode} The tree node
 * @private
 */
plugin.file.kml.KMLParser.prototype.createTreeNode_ = function(el, opt_parent) {
  var node = this.examineElement_(el);
  if (node) {
    if (!node.getLabel()) {
      // use the id if one is available, otherwise create a default name based on the element type
      var id = el.id || el.getAttribute('id');
      node.setLabel(id || this.getDefaultName_(el.localName));
    }

    if (opt_parent != null) {
      // if the child already exists, the new node will be merged and the original node returned
      node = /** @type {plugin.file.kml.ui.KMLNode} */ (opt_parent.addChild(node));
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
};


/**
 * Examine styles that are unsupported in OpenLayers KML styles.
 *
 * @param {Node} node Node.
 * @private
 */
plugin.file.kml.KMLParser.prototype.examineStyles_ = function(node) {
  var n;
  for (n = node.firstElementChild; n; n = n.nextElementSibling) {
    if (n.localName == 'BalloonStyle') {
      var properties = ol.xml.pushParseAndPop({}, plugin.file.kml.BALLOON_PROPERTY_PARSERS, n, []);
      if (properties) {
        var id = node.id || node.getAttribute('id');
        this.balloonStyleMap[id] = properties;
      }
    }
  }
};


/**
 * Read the KML balloon style.
 *
 * @param {Element} el The XML element
 * @param {ol.Feature} feature The feature
 * @private
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
plugin.file.kml.KMLParser.prototype.readBalloonStyle_ = function(el, feature) {
  if (feature.get(os.annotation.OPTIONS_FIELD)) {
    // the feature is an Open Sphere annotation, so ignore the balloon style. it's there for display in other
    // applications, like Google Earth.
    return;
  }

  var style;
  var balloonEl = el.querySelector('BalloonStyle');
  if (balloonEl) {
    // the placemark has an internal balloon style
    style = ol.xml.pushParseAndPop({}, plugin.file.kml.BALLOON_PROPERTY_PARSERS, balloonEl, []);
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

    text = os.ui.sanitize(text);

    feature.set(plugin.file.kml.KMLField.BALLOON_TEXT, text);
  }
};


/**
 * Creates a tree node from an XML element
 *
 * @param {Element} el The XML element
 * @return {plugin.file.kml.ui.KMLNode} The tree node
 * @private
 */
plugin.file.kml.KMLParser.prototype.examineElement_ = function(el) {
  var node = null;
  if (el.localName === 'NetworkLink') {
    node = this.readNetworkLink_(el);
  } else if (el.localName === 'GroundOverlay') {
    node = this.readGroundOverlay_(el);
  } else if (el.localName === 'ScreenOverlay') {
    node = this.readScreenOverlay_(el);
  } else if (el.localName === 'Tour') {
    var tour = plugin.file.kml.tour.parseTour(el);
    if (tour) {
      node = new plugin.file.kml.ui.KMLTourNode(tour);
    }
  } else if (this.kmlThingRegex_ && this.kmlThingRegex_.test(el.localName) && el.localName != 'NetworkLinkControl') {
    var feature = this.readPlacemark_(el);
    if (feature) {
      node = new plugin.file.kml.ui.KMLNode();
      node.setFeature(feature);
      node.layerUI = 'kmlnodelayerui';
    }
  } else {
    node = new plugin.file.kml.ui.KMLNode();
  }

  if (node) {
    this.updateNode_(el, node, plugin.file.kml.KMLParser.BASE_ELEMENT_PARSERS_);
  }

  return node;
};


/**
 * Executes a set of parsers to modify a tree node from an element.
 *
 * @param {Element} el The XML element
 * @param {plugin.file.kml.ui.KMLNode} node The KML tree node
 * @param {Object.<string, plugin.file.kml.KMLElementParser>} parsers The parsers to use
 * @private
 */
plugin.file.kml.KMLParser.prototype.updateNode_ = function(el, node, parsers) {
  var n;
  for (n = goog.dom.getFirstElementChild(el); n !== null; n = n.nextElementSibling) {
    var parser = parsers[n.localName];
    if (parser !== undefined) {
      parser.call(this, node, n);
    }
  }
};


/**
 * Get a default name for a KML tree node
 *
 * @param {string} localName The element name
 * @return {string}
 * @private
 */
plugin.file.kml.KMLParser.prototype.getDefaultName_ = function(localName) {
  this.unnamedCount_++;

  if (localName == 'kml') {
    // this is the root node, so make it obvious
    return 'kmlroot';
  }

  return 'Unnamed ' + this.unnamedCount_ + ' [' + localName + ']';
};


/**
 * Parses a KML NetworkLink element into a tree node
 *
 * @param {Element} el The XML element
 * @return {plugin.file.kml.ui.KMLNetworkLinkNode} The network link node, or null if unable to parse
 * @private
 */
plugin.file.kml.KMLParser.prototype.readNetworkLink_ = function(el) {
  var node = null;
  var linkObj = ol.xml.pushParseAndPop({}, plugin.file.kml.OL_NETWORK_LINK_PARSERS(), el, []);
  if (linkObj && linkObj['href']) {
    node = new plugin.file.kml.ui.KMLNetworkLinkNode(linkObj['href']);

    // default provided by KML spec
    var refreshMode = linkObj['refreshMode'];
    if (refreshMode && goog.object.containsValue(os.ui.file.kml.RefreshMode, refreshMode)) {
      node.setRefreshMode(refreshMode);

      switch (refreshMode) {
        case os.ui.file.kml.RefreshMode.CHANGE:
          // this is the default, so nothing to do unless we start parsing viewRefreshMode
          break;
        case os.ui.file.kml.RefreshMode.EXPIRE:
          // the network link should refresh based on HTTP headers or the NetworkLinkControl tag in the fetched KML,
          // so nothing else to do here
          break;
        case os.ui.file.kml.RefreshMode.INTERVAL:
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
    if (viewRefreshMode && goog.object.containsValue(os.ui.file.kml.ViewRefreshMode, viewRefreshMode)) {
      node.setViewRefreshMode(viewRefreshMode);

      switch (viewRefreshMode) {
        case os.ui.file.kml.ViewRefreshMode.NEVER:
          // do nothing
          break;
        case os.ui.file.kml.ViewRefreshMode.REQUEST:
          // the node handles this case by automatically populating the current view BBOX when the user manually
          // refreshes the layer
          break;
        case os.ui.file.kml.ViewRefreshMode.STOP:
        case os.ui.file.kml.ViewRefreshMode.REGION:
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
};


/**
 * Parses a KML Placemark element into a map feature
 *
 * @param {Element} el The XML element
 * @return {os.feature.DynamicFeature|ol.Feature|undefined} The map feature
 * @private
 *
 * I don't care what you think, compiler.
 * @suppress {accessControls}
 */
plugin.file.kml.KMLParser.prototype.readPlacemark_ = function(el) {
  goog.asserts.assert(el.nodeType == goog.dom.NodeType.ELEMENT, 'el.nodeType should be ELEMENT');
  goog.asserts.assert(el.localName in this.parsersByPlacemarkTag_,
      'localName should be Placemark or be defined by Schema tags');

  var set = this.parsersByPlacemarkTag_[el.localName];
  var object = {'geometry': null};

  // This is slightly odd in that it allows parent parsers to override values set by
  // child parsers (generally the opposite of what you expect from inheritence), however,
  // use of Schema tags is silly if you are just using them for key/value pairs (that's what
  // ExtendedData is for) and anything more complicated isn't going to be handled by this
  // parser anyway.
  while (set) {
    object = ol.xml.pushParseAndPop(object, set.parsers, el, []);
    set = set.parent ? this.parsersByPlacemarkTag_[set.parent] : null;
  }

  if (!object) {
    return null;
  }

  if (this.hasModel_) {
    plugin.file.kml.model.parseModel(el, object);
  }

  // set geometry fields on the object
  var geometry = /** @type {ol.geom.Geometry|undefined} */ (object['geometry']);
  delete object['geometry'];

  if (geometry) {
    // grab the lon/lat coordinate before we potentially convert it to god knows what
    if (geometry.getType() == ol.geom.GeometryType.POINT) {
      var coord = /** @type {!ol.geom.Point} */ (geometry).getFirstCoordinate();
      if (coord.length > 1) {
        object[os.Fields.LAT] = object[os.Fields.LAT] || coord[1];
        object[os.Fields.LON] = object[os.Fields.LON] || coord[0];

        if ((coord.length > 2) && (coord[2] != 0)) {
          object[os.Fields.GEOM_ALT] = object[os.Fields.GEOM_ALT] || coord[2];
        }
      }
    }

    // convert to application projection
    geometry.osTransform();
  }

  // make sure parsed styles don't appear as a source column
  if (object['Style']) {
    object[plugin.file.kml.STYLE_KEY] = object['Style'];
    delete object['Style'];
  }

  var feature;
  if ((geometry instanceof ol.geom.LineString || geometry instanceof ol.geom.MultiLineString) &&
      geometry.getLayout() === ol.geom.GeometryLayout.XYZM) {
    // Openlayers parses KML tracks into a LineString/MultiLineString with the XYZM layout (lon, lat, alt, time). if one
    // of these is encountered, create a track so it can be animated on the timeline.

    if (geometry instanceof ol.geom.MultiLineString && geometry.get('interpolate')) {
      // if a multi track should be interpolated, join it into a single line. the track updates will handle the
      // interpolation between known positions.
      var flatCoordinates = geometry.getFlatCoordinates();
      var coordinates = ol.geom.flat.inflate.coordinates(flatCoordinates, 0, flatCoordinates.length, 4);
      geometry = new ol.geom.LineString(coordinates);
    }

    feature = os.track.createTrack(/** @type {!os.track.CreateOptions} */ ({
      geometry: geometry,
      name: /** @type {string|undefined} */ (object['name'])
    }));
  } else {
    feature = new ol.Feature(geometry);
  }

  if (feature) {
    this.setFeatureId_(feature);

    // parse any fields that are known to contain JSON data into objects
    for (var i = 0, ii = plugin.file.kml.JsonField.length; i < ii; i++) {
      var field = plugin.file.kml.JsonField[i];

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
};


/**
 * Parses a KML GroundOverlay element into a map layer.
 *
 * @param {Element} el The XML element.
 * @return {plugin.file.kml.ui.KMLNode} A KML node for the overlay, or null if one couldn't be created.
 * @private
 */
plugin.file.kml.KMLParser.prototype.readGroundOverlay_ = function(el) {
  goog.asserts.assert(el.nodeType == goog.dom.NodeType.ELEMENT, 'el.nodeType should be ELEMENT');
  goog.asserts.assert(el.localName == 'GroundOverlay', 'localName should be GroundOverlay');

  var obj = ol.xml.pushParseAndPop({}, plugin.file.kml.GROUND_OVERLAY_PARSERS, el, []);
  if (obj) {
    if (obj['extent'] && obj['Icon'] && obj['Icon']['href']) {
      var icon = /** @type {string} */ (obj['Icon']['href']);
      if (this.assetMap_[icon]) {
        icon = this.assetMap_[icon]; // handle images included in a kmz
      }

      var extent = ol.proj.transformExtent(/** @type {ol.Extent} */ (obj['extent']), os.proj.EPSG4326,
          os.map.PROJECTION);

      var feature = new ol.Feature();
      this.setFeatureId_(feature);

      if (obj[os.data.RecordField.TIME]) {
        feature.set(os.data.RecordField.TIME, obj[os.data.RecordField.TIME], true);
      }

      var image = new os.layer.Image({
        source: new os.source.ImageStatic({
          crossOrigin: os.net.getCrossOrigin(icon),
          url: icon,
          imageExtent: extent,
          projection: os.map.PROJECTION
        }, -(obj['rotation'] || 0))
      });
      image.setId(/** @type {string} */ (feature.getId()));

      var node = new plugin.file.kml.ui.KMLNode();
      node.setFeature(feature);
      node.setImage(image);

      return node;
    } else if (obj['error']) {
      var msg = obj['error'].toString();
      goog.log.warning(plugin.file.kml.KMLParser.LOGGER_, msg);
      os.alertManager.sendAlert(msg, os.alert.AlertEventSeverity.WARNING);
    }
  }

  return null;
};


/**
 * Parses a KML ScreenOverlay element into a legend style window.
 *
 * @param {Element} el The XML element.
 * @return {plugin.file.kml.ui.KMLNode} A KML node for the overlay, or null if one couldn't be created.
 * @private
 */
plugin.file.kml.KMLParser.prototype.readScreenOverlay_ = function(el) {
  goog.asserts.assert(el.nodeType == goog.dom.NodeType.ELEMENT, 'el.nodeType should be ELEMENT');
  goog.asserts.assert(el.localName == 'ScreenOverlay', 'localName should be ScreenOverlay');

  var obj = ol.xml.pushParseAndPop({}, plugin.file.kml.SCREEN_OVERLAY_PARSERS, el, []);
  if (obj && obj['name'] && obj['Icon'] && obj['Icon']['href']) {
    var name = /** @type {string} */ (obj['name']);

    var icon = /** @type {string} */ (obj['Icon']['href']);
    if (this.assetMap_[icon]) {
      icon = this.assetMap_[icon]; // handle images included in a kmz
    }

    var screenXY = this.parseScreenXY_(obj['screenXY']);
    var size = this.parseSizeXY_(obj['size']);
    if (screenXY && size) {
      var feature = new ol.Feature();
      this.setFeatureId_(feature);

      if (obj[os.data.RecordField.TIME]) {
        feature.set(os.data.RecordField.TIME, obj[os.data.RecordField.TIME], true);
      }

      var overlayOptions = /** @type {!osx.window.ScreenOverlayOptions} */ ({
        id: feature.getId(),
        name: this.rootNode_.getLabel() + ' - ' + name,
        image: icon,
        size: size,
        xy: screenXY,
        showHide: true
      });

      var node = new plugin.file.kml.ui.KMLNode();
      node.setFeature(feature);
      node.setOverlayOptions(overlayOptions);

      return node;
    }
  }

  return null;
};


/**
 * Parse XY attributes from a screenXY element and return an object with more useful location coordinates
 *
 * @param {Object} obj The XY options.
 * @return {Array<string|number>} An array with x/y values representing location in pixels.
 * @private
 */
plugin.file.kml.KMLParser.prototype.parseScreenXY_ = function(obj) {
  if (obj && obj['x'] != null && obj['y'] != null) {
    var xvalue = /** @type {number} */ (obj['x']);
    var yvalue = /** @type {number} */ (obj['y']);
    var xunits = /** @type {string} */ (obj['xunits']);
    var yunits = /** @type {string} */ (obj['yunits']);

    var xy = [0, 0];
    var mapSize = os.MapContainer.getInstance().getMap().getSize();

    if (xunits == 'fraction') {
      if (xvalue == 0.5) {
        xy[0] = 'center';
      } else {
        xy[0] = mapSize[0] * xvalue;
      }
    } else {
      xy[0] = xvalue;
    }

    if (yunits == 'fraction') {
      if (yvalue == 0.5) {
        xy[1] = 'center';
      } else {
        xy[1] = mapSize[1] - (mapSize[1] * yvalue);
      }
    } else {
      xy[1] = yvalue;
    }

    return xy;
  }

  return null;
};


/**
 * Parse XY attributes from a size element and return an object with more sizing for our overlay
 *
 * @param {Object} obj The XY options.
 * @return {Array<string|number>} An array with x/y values representing size in pixels.
 * @private
 */
plugin.file.kml.KMLParser.prototype.parseSizeXY_ = function(obj) {
  if (obj && obj['x'] != null && obj['y'] != null) {
    var xvalue = /** @type {number} */ (obj['x']);
    var yvalue = /** @type {number} */ (obj['y']);
    var xunits = /** @type {string} */ (obj['xunits']);
    var yunits = /** @type {string} */ (obj['yunits']);

    var xy = [0, 0];
    var mapSize = os.MapContainer.getInstance().getMap().getSize();

    if (xunits == 'fraction') {
      // -1 = use native, 0 = maintain aspect, n = relative to screen size
      if (xvalue == -1 || xvalue == 0) {
        // TODO: no easy way of knowing what size the image is... don't set a size
      } else {
        xy[0] = mapSize[0] * xvalue;
      }
    } else {
      xy[0] = xvalue;
    }

    if (yunits == 'fraction') {
      // -1 = use native, 0 = maintain aspect, n = relative to screen size
      if (yvalue == -1 || yvalue == 0) {
        // TODO: no easy way of knowing what size the image is... don't set a size
      } else {
        xy[1] = mapSize[1] * yvalue;
      }
    } else {
      xy[1] = yvalue;
    }

    return xy;
  }

  return null;
};


/**
 * @param {?Object} merged The merged style config
 * @param {Array<Object>} config The current config
 * @return {Object}
 * @private
 */
plugin.file.kml.KMLParser.reduceStyles_ = function(merged, config) {
  merged = merged || {};
  os.style.mergeConfig(config, merged);
  return merged;
};


/**
 * @param {Element} el The XML element
 * @param {ol.Feature} feature The feature
 * @private
 */
plugin.file.kml.KMLParser.prototype.applyStyles_ = function(el, feature) {
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
  var style = /** @type {Object} */ (feature.get(plugin.file.kml.STYLE_KEY));
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
  styles.unshift(plugin.file.kml.DEFAULT_STYLE);

  // reduce style sets to single set
  var mergedStyle = styles.reduce(plugin.file.kml.KMLParser.reduceStyles_, null);
  if (mergedStyle) {
    var existingStyle = /** @type {Array<!Object>|Object|undefined} */ (feature.get(os.style.StyleType.FEATURE));
    if (existingStyle) {
      // if the feature already has a style config, merge in the KML style
      if (goog.isArray(existingStyle)) {
        for (var i = 0; i < existingStyle.length; i++) {
          os.object.merge(mergedStyle, existingStyle[i]);
        }
      } else {
        os.object.merge(mergedStyle, existingStyle);
      }
    } else {
      // set the style config for the feature
      feature.set(os.style.StyleType.FEATURE, mergedStyle, true);
    }

    if (highlightStyle) {
      feature.set(os.style.StyleType.CUSTOM_HIGHLIGHT, highlightStyle, true);
    }

    // set the feature shape if it wasn't defined in the file and an icon style is present
    if (!feature.get(os.style.StyleField.SHAPE) && os.style.isIconConfig(mergedStyle)) {
      feature.set(os.style.StyleField.SHAPE, os.style.ShapeType.ICON);
    }

    // set the feature shape if it wasn't defined in the file and an icon style is present
    if (!feature.get(os.style.StyleField.CENTER_SHAPE) && os.style.isIconConfig(mergedStyle)) {
      feature.set(os.style.StyleField.CENTER_SHAPE, os.style.ShapeType.ICON);
    }

    // apply the feature style
    os.style.setFeatureStyle(feature);
  }

  var description = /** @type {string} */ (feature.get('description'));
  if (description) {
    // support KMZ assets in the description
    for (var key in this.assetMap_) {
      // replace naive URLs
      var pattern = 'src=["\']' + key.replace(/(.)/g, '[$1]') + '["\']';
      var regex = new RegExp(pattern);
      description = description.replace(regex, 'src="' + this.assetMap_[key] + '"');

      // replace properly encoded URLs
      var encodedKey = new goog.Uri(key).toString();
      pattern = 'src=["\']' + encodedKey.replace(/(.)/g, '[$1]') + '["\']';
      regex = new RegExp(pattern);
      description = description.replace(regex, 'src="' + this.assetMap_[key] + '"');
    }

    feature.set('description', description);
  }
};


/**
 * Extracts all immediate styles from the provided element.
 *
 * @param {Element} el The XML element
 * @private
 */
plugin.file.kml.KMLParser.prototype.extractStyles_ = function(el) {
  // grab only immediate children. styles are inherited from ancestors only.
  var styleEls = os.xml.getChildrenByTagName(el, 'Style');
  for (var i = 0, n = styleEls.length; i < n; i++) {
    var style = styleEls[i];

    this.examineStyles_(style);

    var styleConfig = plugin.file.kml.readStyle(style, this.stack_);
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
      var newId = id + '-' + goog.string.getRandomString();
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
  styleEls = os.xml.getChildrenByTagName(el, 'StyleMap');
  for (i = 0, n = styleEls.length; i < n; i++) {
    style = styleEls[i];
    id = style.id || style.getAttribute('id');

    if (!id) {
      goog.log.error(plugin.file.kml.KMLParser.LOGGER_, 'StyleMap tags must have an "id" attribute');
      continue;
    }

    var pairs = os.xml.getChildrenByTagName(style, 'Pair');
    for (var j = 0, m = pairs.length; j < m; j++) {
      var key = os.xml.getChildValue(pairs[j], 'key');
      var url = os.xml.getChildValue(pairs[j], 'styleUrl');

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
};


/**
 * Gets all the schema tags and adds ol XML parsers for each one
 *
 * @param {Element} el The XML element
 * @private
 */
plugin.file.kml.KMLParser.prototype.parseSchema_ = function(el) {
  var schemas = os.xml.getChildrenByTagName(el, 'Schema');
  for (var i = 0, n = schemas.length; i < n; i++) {
    var name = schemas[i].name || schemas[i].getAttribute('name');
    if (!name) {
      continue;
    }

    if (this.kmlThings_.indexOf(name) === -1) {
      this.kmlThings_.push(name);
    }

    var fields = os.xml.getChildrenByTagName(schemas[i], 'SimpleField');

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
          reader = ol.format.XSD.readBoolean;
          break;
        case 'int':
        case 'short':
        case 'float':
        case 'double':
          reader = ol.format.XSD.readDecimal;
          break;
        case 'uint':
        case 'ushort':
          reader = ol.format.XSD.readNonNegativeInteger;
          break;
        default:
          // all other types are strings
          reader = ol.format.XSD.readString;
          break;
      }

      var field = fields[j].name || fields[j].getAttribute('name');
      if (field && reader) {
        parsers[field] = ol.xml.makeObjectPropertySetter(reader);
        fieldCount++;
      }
    }

    if (fieldCount) {
      this.parsersByPlacemarkTag_[name] = {
        parent: /** @type {string} */ (schemas[i].getAttribute('parent')),
        parsers: ol.xml.makeStructureNS(plugin.file.kml.OL_NAMESPACE_URIS(), parsers)
      };
    }
  }

  this.kmlThingRegex_ = this.getKmlThingRegex();
};


/**
 * Creates the regex from the current set of KML things.
 *
 * @return {RegExp} The KML regex.
 */
plugin.file.kml.KMLParser.prototype.getKmlThingRegex = function() {
  return new RegExp('^(' + this.kmlThings_.join('|') + ')$');
};


/**
 * @param {Object} config
 * @private
 */
plugin.file.kml.KMLParser.prototype.updateStyleConfig_ = function(config) {
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
};


/**
 * Parse the StyleUrl into the correct id format.
 *
 * @param {string} id The StyleUrl.
 * @return {string} The Parsed Style id.
 */
plugin.file.kml.KMLParser.prototype.getStyleId = function(id) {
  var x = id.indexOf('#');

  if (x > -1) {
    id = id.substring(x + 1);
  }
  return id;
};


/**
 * Set the ID on a KML feature.
 *
 * @param {!ol.Feature} feature The feature.
 * @private
 */
plugin.file.kml.KMLParser.prototype.setFeatureId_ = function(feature) {
  // files containing duplicate network links will create features with duplicate id's. this allows us to merge
  // features on refresh, while still creating an id that's unique from other network links (which will use a
  // different parser)
  var baseId = ol.getUid(feature);
  var id = this.id_ + '#' + baseId;
  feature.setId(id);

  if (feature.get(os.Fields.ID) == null) {
    feature.set(os.Fields.ID, baseId, true);
  }
};


/**
 * Set the KML tree node name.
 *
 * @param {plugin.file.kml.ui.KMLNode} node The KML tree node
 * @param {Element} el The name element
 * @private
 */
plugin.file.kml.KMLParser.setNodeLabel_ = function(node, el) {
  goog.asserts.assert(el.localName == 'name', 'localName should be name');

  // default to null and a default label will be created later
  node.setLabel(ol.xml.getAllTextContent(el, true).trim() || null);
};


/**
 * Set the KML tree node name.
 *
 * @param {plugin.file.kml.ui.KMLNode} node The KML tree node
 * @param {Element} el The name element
 * @private
 */
plugin.file.kml.KMLParser.setNodeCollapsed_ = function(node, el) {
  goog.asserts.assert(el.localName == 'open', 'localName should be open');

  // default to collapsed, so only expand if the text is '1'.
  node.collapsed = ol.xml.getAllTextContent(el, true).trim() !== '1';
};


/**
 * Set the KML tree node visibility state.
 *
 * @param {plugin.file.kml.ui.KMLNode} node The KML tree node
 * @param {Element} el The name element
 * @private
 */
plugin.file.kml.KMLParser.setNodeVisibility_ = function(node, el) {
  goog.asserts.assert(el.localName == 'visibility', 'localName should be visibility');

  var content = ol.xml.getAllTextContent(el, true).trim();
  if (content) {
    // this only handles turning the node off so we can honor our node defaults. this is specifically for network links,
    // which we always default to being turned off.
    var visibility = ol.format.XSD.readBooleanString(content);
    if (!visibility) {
      node.setState(os.structs.TriState.OFF);
    }
  }

  var feature = node.getFeature();
  if (feature) {
    // remove the visibility property so it doesn't show up in the list tool
    feature.set('visibility', undefined);
  }
};


/**
 * @typedef {function(plugin.file.kml.ui.KMLNode, Element)}
 */
plugin.file.kml.KMLElementParser;


/**
 * @type {Object.<string, plugin.file.kml.KMLElementParser>}
 * @private
 * @const
 */
plugin.file.kml.KMLParser.BASE_ELEMENT_PARSERS_ = {
  'name': plugin.file.kml.KMLParser.setNodeLabel_,
  'open': plugin.file.kml.KMLParser.setNodeCollapsed_,
  'visibility': plugin.file.kml.KMLParser.setNodeVisibility_
};
