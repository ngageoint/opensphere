goog.provide('os.state.XMLState');
goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('os.state');
goog.require('os.state.AbstractState');
goog.require('os.state.XMLStateOptions');
goog.require('os.xml');



/**
 * Base class for XML states.
 * @extends {os.state.AbstractState.<!Element, os.state.XMLStateOptions>}
 * @constructor
 */
os.state.XMLState = function() {
  os.state.XMLState.base(this, 'constructor');
  this.rootName = 'xml';
};
goog.inherits(os.state.XMLState, os.state.AbstractState);


/**
 * @inheritDoc
 */
os.state.XMLState.prototype.createRoot = function(options) {
  return os.xml.createElement(this.rootName, options.doc, undefined, this.rootAttrs);
};


/**
 * @inheritDoc
 */
os.state.XMLState.prototype.getSource = function(obj) {
  if (obj) {
    var p = obj.parentElement || obj;
    while (p.parentElement) {
      p = p.parentElement;
    }

    return p.getAttribute(os.state.Tag.SOURCE);
  }

  return null;
};


/**
 * @param {!Element|string} elOrString
 * @return {!Element}
 */
os.state.XMLState.ensureXML = function(elOrString) {
  if (goog.isString(elOrString)) {
    var doc = goog.dom.xml.loadXml(elOrString);
    var child = goog.dom.getFirstElementChild(doc);
    if (child) {
      return child;
    }
  }

  return /** @type {!Element} */ (elOrString);
};


/**
 * @inheritDoc
 */
os.state.XMLState.prototype.saveComplete = function(options, rootObj) {
  // save was successful, so add the state to the document
  if (rootObj) {
    goog.dom.getFirstElementChild(options.doc).appendChild(rootObj);
  }

  os.state.XMLState.base(this, 'saveComplete', options, rootObj);
};
