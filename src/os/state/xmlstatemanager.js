goog.module('os.state.XMLStateManager');

const {getChildren, getFirstElementChild} = goog.require('goog.dom');
const {createDocument, loadXml} = goog.require('goog.dom.xml');
const log = goog.require('goog.log');
const dispatcher = goog.require('os.Dispatcher');
const {getAppName, getAppVersion} = goog.require('os.config');
const PayloadEvent = goog.require('os.events.PayloadEvent');
const {TYPE} = goog.require('os.file.mime.xmlstate');
const {priorityCompare, serializeTag, titleCompare} = goog.require('os.state');
const BaseStateManager = goog.require('os.state.BaseStateManager');
const Tag = goog.require('os.state.Tag');
const XMLStateOptions = goog.require('os.state.XMLStateOptions');
const {xmlFromTags} = goog.require('os.tag');
const ImportManager = goog.require('os.ui.im.ImportManager');
const StateImportUI = goog.require('os.ui.state.StateImportUI');
const {appendElement, createElementNS, serialize} = goog.require('os.xml');

const Logger = goog.requireType('goog.log.Logger');


/**
 * XML state manager.
 *
 * @extends {BaseStateManager<!Document, !XMLStateOptions>}
 */
class XMLStateManager extends BaseStateManager {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.contentType = 'text/xml';
    this.log = logger;

    /**
     * The namespace URI to use in exported state files
     * @type {string}
     * @private
     */
    this.nsUri_ = XMLStateManager.NS_URI;

    // register the import UI
    var im = ImportManager.getInstance();
    im.registerImportDetails(getAppName('Application') + ' state files.');
    im.registerImportUI(TYPE, new StateImportUI());
  }

  /**
   * @inheritDoc
   */
  setVersion(version) {
    super.setVersion(version);
    this.nsUri_ = XMLStateManager.NS_URI + version;
  }

  /**
   * @inheritDoc
   */
  analyze(obj) {
    if (typeof obj === 'string') {
      var doc = loadXml(obj);
      if (doc) {
        obj = doc;
      }
    }

    var list = [];
    if (obj instanceof Document && getFirstElementChild(obj) instanceof Element) {
      var rootNode = getFirstElementChild(obj);
      var v = rootNode.namespaceURI;
      v = v.substring(v.lastIndexOf('/') + 1);

      if (v in this.versions) {
        var states = this.versions[v];
        var children = getChildren(rootNode);
        if (children) {
          var i = children.length;
          while (i--) {
            var tag = serializeTag(children[i]);
            if (tag && tag in states) {
              var s = new states[tag]();
              s.setEnabled(true);
              list.push(s);
            }
          }
        }
      }
    }

    list.sort(titleCompare);
    return list;
  }

  /**
   * @inheritDoc
   */
  loadState(obj, states, stateId, opt_title) {
    if (obj && states) {
      if (typeof obj === 'string') {
        var doc = loadXml(obj);
        if (doc) {
          obj = doc;
        }
      }

      if (obj instanceof Document && getFirstElementChild(obj) instanceof Element) {
        states.sort(priorityCompare);

        var children = getChildren(getFirstElementChild(obj));
        for (var i = 0, n = states.length; i < n; i++) {
          var state = states[i];
          if (state.getEnabled()) {
            for (var j = 0, m = children.length; j < m; j++) {
              if (serializeTag(children[j]) == state.toString()) {
                state.load(children[j], stateId, opt_title);
                break;
              }
            }
          }
        }
        dispatcher.getInstance().dispatchEvent(new PayloadEvent(BaseStateManager.EventType.LOADED, {
          'id': stateId
        }));
      }
    }
  }

  /**
   * @inheritDoc
   */
  createStateObject(method, title, opt_desc, opt_tags) {
    var appName = getAppName('Unknown Application');
    var version = getAppVersion('Unknown Version');
    var doc = createDocument();
    var rootNode = createElementNS(Tag.STATE, this.nsUri_, doc);
    rootNode.setAttribute(Tag.SOURCE, appName + ' (' + version + ')');
    // v4 support
    rootNode.setAttribute(Tag.VERSION, this.getVersion());
    doc.appendChild(rootNode);

    appendElement(Tag.TITLE, rootNode, title);

    if (opt_desc) {
      appendElement(Tag.DESCRIPTION, rootNode, opt_desc);
    }

    if (opt_tags) {
      var tagEl = xmlFromTags(opt_tags, Tag.TAGS, doc);
      if (tagEl) {
        rootNode.appendChild(tagEl);
      }
    }

    return doc;
  }

  /**
   * @inheritDoc
   */
  createStateOptions(method, title, obj, opt_desc, opt_tags) {
    var options = new XMLStateOptions(title, obj);
    options.description = opt_desc || null;
    options.method = method;
    options.tags = opt_tags || null;
    return options;
  }

  /**
   * @inheritDoc
   */
  serializeContent(options) {
    return options.doc ? serialize(options.doc) : null;
  }

  /**
   * @inheritDoc
   */
  getStateFileName(options) {
    return options.doc ? options.doc.querySelector(Tag.TITLE).textContent + '_state.xml' : null;
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.state.XMLStateManager');

/**
 * The namespace uri for exported states.
 * @type {string}
 * @const
 */
// XMLStateManager.NS_URI = 'http://www.bit-sys.com/state/';
// TODO:STATE -> Was the namespace rename intentional?
XMLStateManager.NS_URI = 'http://www.bit-sys.com/mist/state/';

exports = XMLStateManager;
