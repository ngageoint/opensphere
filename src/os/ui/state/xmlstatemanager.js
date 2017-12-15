goog.provide('os.ui.state.XMLStateManager');
goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.config');
goog.require('os.file.FileManager');
goog.require('os.state');
goog.require('os.state.Tag');
goog.require('os.state.XMLStateOptions');
goog.require('os.state.XMLStateTypeMethod');
goog.require('os.tag');
goog.require('os.ui.state.StateManager');



/**
 * XML state manager.
 * @extends {os.ui.state.StateManager.<!Document, !os.state.XMLStateOptions>}
 * @constructor
 */
os.ui.state.XMLStateManager = function() {
  os.ui.state.XMLStateManager.base(this, 'constructor');
  this.contentType = 'text/xml';
  this.log = os.ui.state.XMLStateManager.LOGGER_;

  /**
   * The namespace URI to use in exported state files
   * @type {string}
   * @private
   */
  this.nsUri_ = os.ui.state.XMLStateManager.NS_URI;

  // register the content method
  var fm = os.file.FileManager.getInstance();
  fm.registerContentTypeMethod(new os.state.XMLStateTypeMethod());
};
goog.inherits(os.ui.state.XMLStateManager, os.ui.state.StateManager);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.state.XMLStateManager.LOGGER_ = goog.log.getLogger('os.ui.state.XMLStateManager');


/**
 * The namespace uri for exported states.
 * @type {string}
 * @const
 */
// os.ui.state.XMLStateManager.NS_URI = 'http://www.bit-sys.com/state/';
// TODO:STATE -> Was the namespace rename intentional?
os.ui.state.XMLStateManager.NS_URI = 'http://www.bit-sys.com/mist/state/';


/**
 * @inheritDoc
 */
os.ui.state.XMLStateManager.prototype.setVersion = function(version) {
  os.ui.state.XMLStateManager.base(this, 'setVersion', version);
  this.nsUri_ = os.ui.state.XMLStateManager.NS_URI + version;
};


/**
 * @inheritDoc
 */
os.ui.state.XMLStateManager.prototype.analyze = function(obj) {
  if (goog.isString(obj)) {
    var doc = goog.dom.xml.loadXml(obj);
    if (doc) {
      obj = doc;
    }
  }

  var list = [];
  if (obj instanceof Document && goog.dom.getFirstElementChild(obj) instanceof Element) {
    var rootNode = goog.dom.getFirstElementChild(obj);
    var v = rootNode.namespaceURI;
    v = v.substring(v.lastIndexOf('/') + 1);

    if (v in this.versions) {
      var states = this.versions[v];
      var children = goog.dom.getChildren(rootNode);
      if (children) {
        var i = children.length;
        while (i--) {
          var tag = os.state.serializeTag(children[i]);
          if (tag && tag in states) {
            var s = new states[tag]();
            s.setEnabled(true);
            list.push(s);
          }
        }
      }
    }
  }

  list.sort(os.state.titleCompare);
  return list;
};


/**
 * @inheritDoc
 */
os.ui.state.XMLStateManager.prototype.loadState = function(obj, states, stateId, opt_title) {
  if (obj && states) {
    if (goog.isString(obj)) {
      var doc = goog.dom.xml.loadXml(obj);
      if (doc) {
        obj = doc;
      }
    }

    if (obj instanceof Document && goog.dom.getFirstElementChild(obj) instanceof Element) {
      states.sort(os.state.priorityCompare);

      var children = goog.dom.getChildren(goog.dom.getFirstElementChild(obj));
      for (var i = 0, n = states.length; i < n; i++) {
        var state = states[i];
        if (state.getEnabled()) {
          for (var j = 0, m = children.length; j < m; j++) {
            if (os.state.serializeTag(children[j]) == state.toString()) {
              state.load(children[j], stateId, opt_title);
              break;
            }
          }
        }
      }
    }
  }
};


/**
 * @inheritDoc
 */
os.ui.state.XMLStateManager.prototype.createStateObject = function(method, title, opt_desc, opt_tags) {
  var appName = os.config.getAppName('Unknown Application');
  var version = os.config.getAppVersion('Unknown Version');
  var doc = goog.dom.xml.createDocument();
  var rootNode = os.xml.createElementNS(os.state.Tag.STATE, this.nsUri_, doc);
  rootNode.setAttribute(os.state.Tag.SOURCE, appName + ' (' + version + ')');
  // v4 support
  rootNode.setAttribute(os.state.Tag.VERSION, this.getVersion());
  doc.appendChild(rootNode);

  os.xml.appendElement(os.state.Tag.TITLE, rootNode, title);

  if (opt_desc) {
    os.xml.appendElement(os.state.Tag.DESCRIPTION, rootNode, opt_desc);
  }

  if (opt_tags) {
    var tagEl = os.tag.xmlFromTags(opt_tags, os.state.Tag.TAGS, doc);
    if (tagEl) {
      rootNode.appendChild(tagEl);
    }
  }

  return doc;
};


/**
 * @inheritDoc
 */
os.ui.state.XMLStateManager.prototype.createStateOptions = function(method, title, obj, opt_desc, opt_tags) {
  var options = new os.state.XMLStateOptions(title, obj);
  options.description = opt_desc || null;
  options.method = method;
  options.tags = opt_tags || null;
  return options;
};


/**
 * @inheritDoc
 */
os.ui.state.XMLStateManager.prototype.serializeContent = function(options) {
  return options.doc ? os.xml.serialize(options.doc) : null;
};


/**
 * @inheritDoc
 */
os.ui.state.XMLStateManager.prototype.getStateFileName = function(options) {
  return options.doc ? options.doc.querySelector(os.state.Tag.TITLE).textContent + '_state.xml' : null;
};
