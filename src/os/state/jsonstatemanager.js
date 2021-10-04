goog.declareModuleId('os.state.JSONStateManager');

import {getAppName, getAppVersion} from '../config/config.js';
import {TYPE} from '../file/mime/jsonstate.js';
import ImportManager from '../ui/im/importmanager.js';
import StateImportUI from '../ui/state/stateimportui.js';
import BaseStateManager from './basestatemanager.js';
import JSONStateOptions from './jsonstateoptions.js';
import {priorityCompare, titleCompare} from './state.js';
import Tag from './tag.js';

const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');


/**
 * Base JSON state manager.
 *
 * @extends {BaseStateManager<!Object<string, *>, !JSONStateOptions>}
 */
export default class JSONStateManager extends BaseStateManager {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.contentType = 'application/json';
    this.log = logger;

    // register the import UI
    var im = ImportManager.getInstance();
    im.registerImportDetails(getAppName('Application') + ' state files.');
    im.registerImportUI(TYPE, new StateImportUI());
  }

  /**
   * @inheritDoc
   */
  analyze(obj) {
    if (typeof obj === 'string') {
      var actualObject = /** @type {Object} */ (JSON.parse(obj));
      if (actualObject) {
        obj = actualObject;
      }
    }

    var list = [];
    if (obj instanceof Object && Array.isArray(obj[Tag.STATE])) {
      var statesArray = obj[Tag.STATE];
      var v = obj[Tag.VERSION];

      if (v in this.versions) {
        var states = this.versions[v];

        for (var i = 0; i < statesArray.length; i++) {
          var stateJson = statesArray[i];

          if (stateJson) {
            var key = stateJson[Tag.TYPE];
            if (key in states) {
              var s = new states[key]();
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
        var actualObject = /** @type {Object} */ (JSON.parse(obj));
        if (actualObject) {
          obj = actualObject;
        }
      }

      if (obj instanceof Object && Array.isArray(obj[Tag.STATE])) {
        states.sort(priorityCompare);

        var children = obj[Tag.STATE];
        for (var i = 0, n = states.length; i < n; i++) {
          var state = states[i];
          if (state.getEnabled()) {
            for (var j = 0, m = children.length; j < m; j++) {
              if (children[j][Tag.TYPE] == state.toString()) {
                state.load(children[j], stateId);
                break;
              }
            }
          }
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  createStateObject(method, title, opt_desc, opt_tags) {
    var appName = getAppName('Unknown Application');
    var version = getAppVersion('Unknown Version');
    var object = {};
    object[Tag.SOURCE] = appName + ' (' + version + ')';
    object[Tag.TITLE] = title;
    object[Tag.VERSION] = this.getVersion();

    if (opt_desc) {
      object[Tag.DESCRIPTION] = opt_desc;
    }

    if (opt_tags) {
      object[Tag.TAGS] = opt_tags;
    }

    return object;
  }

  /**
   * @inheritDoc
   */
  createStateOptions(method, title, obj, opt_desc, opt_tags) {
    var options = new JSONStateOptions(title, obj);
    options.description = opt_desc || null;
    options.method = method;
    options.tags = opt_tags || null;
    // NOTE: application/json is the IANA registered type for json.  not text/json.
    options.contentType = 'application/json;charset=utf-8';
    return options;
  }

  /**
   * @inheritDoc
   */
  serializeContent(options) {
    return options.obj ? JSON.stringify(options.obj) : null;
  }

  /**
   * @inheritDoc
   */
  getStateFileName(options) {
    return options.obj ? options.obj[Tag.TITLE] + '_state.json' : null;
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.state.JSONStateManager');
