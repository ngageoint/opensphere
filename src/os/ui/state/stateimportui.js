goog.provide('os.ui.state.StateImportUI');

goog.require('goog.dom.xml');
goog.require('os.parse.StateParserConfig');
goog.require('os.state.Tag');
goog.require('os.tag');
goog.require('os.ui.im.FileImportUI');
goog.require('os.ui.state.stateImportDirective');
goog.require('os.ui.window');



/**
 * @extends {os.ui.im.FileImportUI}
 * @constructor
 */
os.ui.state.StateImportUI = function() {
  os.ui.state.StateImportUI.base(this, 'constructor');
};
goog.inherits(os.ui.state.StateImportUI, os.ui.im.FileImportUI);


/**
 * @inheritDoc
 */
os.ui.state.StateImportUI.prototype.launchUI = function(file, opt_config) {
  var config = new os.parse.StateParserConfig();

  // if an existing config was provided, merge it in
  if (opt_config) {
    this.mergeConfig(opt_config, config);
  }
  config['file'] = file;

  var rawState = null;

  var content = file.getContent();
  var contentType = file.getContentType();
  if (content) {
    if (goog.isString(content)) {
      if (contentType == 'application/json') {
        try {
          rawState = /** @type {Object} */ (JSON.parse(content));
        } catch (e) {
          rawState = undefined;
        }
      } else {
        rawState = goog.dom.xml.loadXml(content);
      }
    } else if (content instanceof Document || goog.isObject(content)) {
      rawState = content;
    }
  }

  config['state'] = rawState;

  if (rawState instanceof Document) {
    this.handleXML(file, rawState, config);
  } else if (goog.isObject(rawState)) {
    this.handleJSON(file, rawState, config);
  }
};


/**
 * @inheritDoc
 */
os.ui.state.StateImportUI.prototype.mergeConfig = function(from, to) {
  os.ui.state.StateImportUI.base(this, 'mergeConfig', from, to);
  to['state'] = from['state'];
  to['loadItems'] = from['loadItems'];
};


/**
 * Pulls information off of an XML state file and uses it to populate the import directive.
 * @param {os.file.File} file
 * @param {Document} stateDoc
 * @param {Object} config
 */
os.ui.state.StateImportUI.prototype.handleXML = function(file, stateDoc, config) {
  if (stateDoc) {
    var titleEl = stateDoc.querySelector(os.state.Tag.STATE + ' > ' + os.state.Tag.TITLE);
    if (titleEl && titleEl.textContent) {
      config['title'] = titleEl.textContent;
    }

    var descEl = stateDoc.querySelector(os.state.Tag.STATE + ' > ' + os.state.Tag.DESCRIPTION);
    if (descEl && descEl.textContent) {
      config['description'] = descEl.textContent;
    }

    var tagsEl = stateDoc.querySelector(os.state.Tag.STATE + ' > ' + os.state.Tag.TAGS);
    if (tagsEl) {
      config['tags'] = os.tag.stringFromXML(tagsEl);
    }
  }

  this.showUI(file, config);
};


/**
 * Pulls information off of an XML state file and uses it to populate the import directive.
 * @param {os.file.File} file
 * @param {Object} stateObject
 * @param {Object} config
 */
os.ui.state.StateImportUI.prototype.handleJSON = function(file, stateObject, config) {
  if (stateObject) {
    config['title'] = stateObject['title'];
    config['description'] = stateObject['description'];
    config['tags'] = stateObject['tags'];
  }

  this.showUI(file, config);
};


/**
 * Takes the completed config and displays the UI for it.
 * @param {os.file.File} file
 * @param {Object} config
 */
os.ui.state.StateImportUI.prototype.showUI = function(file, config) {
  if (!config['title']) {
    config['title'] = file.getFileName();
  }

  var scopeOptions = {
    'config': config
  };
  var windowOptions = {
    'label': 'Import State',
    'icon': 'fa fa-file-text lt-blue-icon',
    'x': 'center',
    'y': 'center',
    'width': '385',
    'height': 'auto',
    'modal': 'true',
    'show-close': 'true'
  };
  var template = '<stateimport></stateimport>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};
