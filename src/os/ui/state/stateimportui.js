goog.declareModuleId('os.ui.state.StateImportUI');

import StateParserConfig from '../../parse/stateparserconfig.js';
import Tag from '../../state/tag.js';
import {stringFromXML} from '../../tag/tag.js';
import FileImportUI from '../im/fileimportui.js';
import {create} from '../window.js';
import {directiveTag as importUi} from './stateimport.js';

const {loadXml} = goog.require('goog.dom.xml');

const {default: OSFile} = goog.requireType('os.file.File');


/**
 */
export default class StateImportUI extends FileImportUI {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  launchUI(file, opt_config) {
    super.launchUI(file, opt_config);

    var config = new StateParserConfig();

    // if an existing config was provided, merge it in
    if (opt_config) {
      this.mergeConfig(opt_config, config);
    }
    config['file'] = file;

    var rawState = null;

    file.convertContentToString();
    var content = file.getContent();
    var contentType = file.getContentType();
    if (content) {
      if (typeof content === 'string') {
        if (contentType == 'application/json') {
          try {
            rawState = /** @type {Object} */ (JSON.parse(content));
          } catch (e) {
            rawState = undefined;
          }
        } else {
          rawState = loadXml(content);
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
  }

  /**
   * @inheritDoc
   */
  mergeConfig(from, to) {
    super.mergeConfig(from, to);
    to['state'] = from['state'];
    to['loadItems'] = from['loadItems'];
  }

  /**
   * Pulls information off of an XML state file and uses it to populate the import directive.
   *
   * @param {OSFile} file
   * @param {Document} stateDoc
   * @param {Object} config
   */
  handleXML(file, stateDoc, config) {
    if (stateDoc) {
      var titleEl = stateDoc.querySelector(Tag.STATE + ' > ' + Tag.TITLE);
      if (titleEl && titleEl.textContent) {
        config['title'] = titleEl.textContent;
      }

      var descEl = stateDoc.querySelector(Tag.STATE + ' > ' + Tag.DESCRIPTION);
      if (descEl && descEl.textContent) {
        config['description'] = descEl.textContent;
      }

      var tagsEl = stateDoc.querySelector(Tag.STATE + ' > ' + Tag.TAGS);
      if (tagsEl) {
        config['tags'] = stringFromXML(tagsEl);
      }
    }

    this.showUI(file, config);
  }

  /**
   * Pulls information off of an XML state file and uses it to populate the import directive.
   *
   * @param {OSFile} file
   * @param {Object} stateObject
   * @param {Object} config
   */
  handleJSON(file, stateObject, config) {
    if (stateObject) {
      config['title'] = stateObject['title'];
      config['description'] = stateObject['description'];
      config['tags'] = stateObject['tags'];
    }

    this.showUI(file, config);
  }

  /**
   * Takes the completed config and displays the UI for it.
   *
   * @param {OSFile} file
   * @param {Object} config
   */
  showUI(file, config) {
    if (!config['title']) {
      config['title'] = file.getFileName();
    }

    var scopeOptions = {
      'config': config
    };
    var windowOptions = {
      'label': 'Import State',
      'icon': 'fa fa-file-text',
      'x': 'center',
      'y': 'center',
      'width': '400',
      'height': 'auto',
      'modal': 'true',
      'show-close': 'true'
    };
    var template = `<${importUi}></${importUi}>`;
    create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
}
