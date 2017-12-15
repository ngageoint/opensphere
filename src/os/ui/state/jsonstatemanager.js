goog.provide('os.ui.state.JSONStateManager');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.config');
goog.require('os.file.FileManager');
goog.require('os.state');
goog.require('os.state.JSONStateOptions');
goog.require('os.state.JSONStateTypeMethod');
goog.require('os.state.Tag');
goog.require('os.tag');
goog.require('os.ui.state.StateManager');



/**
 * Base JSON state manager.
 * @extends {os.ui.state.StateManager.<!Object.<string, *>, !os.state.JSONStateOptions>}
 * @constructor
 */
os.ui.state.JSONStateManager = function() {
  os.ui.state.JSONStateManager.base(this, 'constructor');
  this.contentType = 'application/json';
  this.log = os.ui.state.JSONStateManager.LOGGER_;

  // register the content method
  var fm = os.file.FileManager.getInstance();
  fm.registerContentTypeMethod(new os.state.JSONStateTypeMethod());
};
goog.inherits(os.ui.state.JSONStateManager, os.ui.state.StateManager);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.state.JSONStateManager.LOGGER_ = goog.log.getLogger('os.ui.state.JSONStateManager');


/**
 * @inheritDoc
 */
os.ui.state.JSONStateManager.prototype.analyze = function(obj) {
  if (goog.isString(obj)) {
    var actualObject = /** @type {Object} */ (JSON.parse(obj));
    if (actualObject) {
      obj = actualObject;
    }
  }

  var list = [];
  if (obj instanceof Object && goog.isArray(obj[os.state.Tag.STATE])) {
    var statesArray = obj[os.state.Tag.STATE];
    var v = obj[os.state.Tag.VERSION];

    if (v in this.versions) {
      var states = this.versions[v];

      for (var i = 0; i < statesArray.length; i++) {
        var stateJson = statesArray[i];

        if (stateJson) {
          var key = stateJson[os.state.Tag.TYPE];
          if (key in states) {
            var s = new states[key]();
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
os.ui.state.JSONStateManager.prototype.loadState = function(obj, states, stateId, opt_title) {
  if (obj && states) {
    if (goog.isString(obj)) {
      var actualObject = /** @type {Object} */ (JSON.parse(obj));
      if (actualObject) {
        obj = actualObject;
      }
    }

    if (obj instanceof Object && goog.isArray(obj[os.state.Tag.STATE])) {
      states.sort(os.state.priorityCompare);

      var children = obj[os.state.Tag.STATE];
      for (var i = 0, n = states.length; i < n; i++) {
        var state = states[i];
        if (state.getEnabled()) {
          for (var j = 0, m = children.length; j < m; j++) {
            if (children[j][os.state.Tag.TYPE] == state.toString()) {
              state.load(children[j], stateId);
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
os.ui.state.JSONStateManager.prototype.createStateObject = function(method, title, opt_desc, opt_tags) {
  var appName = os.config.getAppName('Unknown Application');
  var version = os.config.getAppVersion('Unknown Version');
  var object = {};
  object[os.state.Tag.SOURCE] = appName + ' (' + version + ')';
  object[os.state.Tag.TITLE] = title;
  object[os.state.Tag.VERSION] = this.getVersion();

  if (opt_desc) {
    object[os.state.Tag.DESCRIPTION] = opt_desc;
  }

  if (opt_tags) {
    object[os.state.Tag.TAGS] = opt_tags;
  }

  return object;
};


/**
 * @inheritDoc
 */
os.ui.state.JSONStateManager.prototype.createStateOptions = function(method, title, obj, opt_desc, opt_tags) {
  var options = new os.state.JSONStateOptions(title, obj);
  options.description = opt_desc || null;
  options.method = method;
  options.tags = opt_tags || null;
  // NOTE: application/json is the IANA registered type for json.  not text/json.
  options.contentType = 'application/json;charset=utf-8';
  return options;
};


/**
 * @inheritDoc
 */
os.ui.state.JSONStateManager.prototype.serializeContent = function(options) {
  return options.obj ? JSON.stringify(options.obj) : null;
};


/**
 * @inheritDoc
 */
os.ui.state.JSONStateManager.prototype.getStateFileName = function(options) {
  return options.obj ? options.obj[os.state.Tag.TITLE] + '_state.json' : null;
};
