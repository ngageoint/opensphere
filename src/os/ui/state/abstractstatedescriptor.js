goog.provide('os.ui.state.AbstractStateDescriptor');

goog.require('os.data.BaseDescriptor');
goog.require('os.data.DescriptorEvent');
goog.require('os.data.DescriptorEventType');
goog.require('os.file.FileStorage');
goog.require('os.implements');
goog.require('os.parse.StateParserConfig');
goog.require('os.ui.file.method.UrlMethod');
goog.require('os.ui.file.ui.defaultFileNodeUIDirective');
goog.require('os.ui.state.IStateDescriptor');
goog.require('os.ui.state.StateManager');



/**
 * Base descriptor for state files.
 * @extends {os.data.BaseDescriptor}
 * @implements {os.ui.state.IStateDescriptor}
 * @constructor
 */
os.ui.state.AbstractStateDescriptor = function() {
  os.ui.state.AbstractStateDescriptor.base(this, 'constructor');
  this.descriptorType = 'state';
  this.log = os.ui.state.AbstractStateDescriptor.LOGGER_;
  this.setType('Saved States');

  // prevent state descriptors from being cleaned up based on the last active time
  this.setLocal(true);

  /**
   * @type {os.parse.StateParserConfig}
   * @protected
   */
  this.parserConfig = new os.parse.StateParserConfig();

  /**
   * The items to load from the state file
   * @type {Array.<string>}
   * @private
   */
  this.loadItems_ = null;

  /**
   * The application state type.
   * @type {!string}
   * @protected
   */
  this.stateType = os.state.StateType.UNKNOWN;

  /**
   * @type {?string}
   * @protected
   */
  this.url = null;
};
goog.inherits(os.ui.state.AbstractStateDescriptor, os.data.BaseDescriptor);
os.implements(os.ui.state.AbstractStateDescriptor, os.data.IUrlDescriptor.ID);
os.implements(os.ui.state.AbstractStateDescriptor, os.ui.state.IStateDescriptor.ID);


/**
 * Identifier used for state descriptors.
 * @type {string}
 * @const
 */
os.ui.state.AbstractStateDescriptor.ID = 'state';


/**
 * Logger for os.ui.state.AbstractStateDescriptor
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.state.AbstractStateDescriptor.LOGGER_ = goog.log.getLogger('os.ui.state.AbstractStateDescriptor');


/**
 * @inheritDoc
 */
os.ui.state.AbstractStateDescriptor.prototype.setActiveInternal = function() {
  if (this.isActive()) {
    this.activateState();
  } else {
    this.deactivateState();
  }

  return true;
};


/**
 * Activates the state.
 * @param {os.file.File=} opt_file The state file to load
 * @protected
 */
os.ui.state.AbstractStateDescriptor.prototype.activateState = function(opt_file) {
  try {
    if (!opt_file) {
      var url = this.getUrl();
      if (url) {
        this.setLoading(true);

        if (os.file.isLocal(url)) {
          var fs = os.file.FileStorage.getInstance();
          fs.getFile(url).addCallbacks(this.onFileReady_, this.onFileError_, this);
        } else {
          var method = new os.ui.file.method.UrlMethod();
          method.setUrl(url);
          method.listen(os.events.EventType.COMPLETE, this.onUrlComplete_, false, this);
          method.listen(os.events.EventType.CANCEL, this.onUrlError_, false, this);
          method.listen(os.events.EventType.ERROR, this.onUrlError_, false, this);
          method.loadUrl();
        }
      } else {
        this.logError('No URL provided for state file!');
      }
    } else {
      this.setLoading(false);

      var content = opt_file.getContent();
      goog.asserts.assertString(content, 'State file content must be a string!');

      // decide whether it's a JSON file or an XML
      var doc = goog.json.isValid(content) ? JSON.parse(content) : goog.dom.xml.loadXml(content);

      var list = os.ui.stateManager.analyze(doc);
      var loadItems = this.getLoadItems();
      if (loadItems) {
        for (var i = 0, n = list.length; i < n; i++) {
          var state = list[i];
          state.setEnabled(goog.array.contains(loadItems, state.toString()));
        }
      }

      os.ui.stateManager.loadState(doc, list, this.getId() + '-', this.getTitle());
    }
  } catch (e) {
    this.logError('Unable to activate state: ' + e.message, e);
  }
};


/**
 * Handler for file storage file load success.
 * @param {?os.file.File} file
 * @private
 */
os.ui.state.AbstractStateDescriptor.prototype.onFileReady_ = function(file) {
  if (file) {
    this.activateState(file);
  } else {
    this.logError('State file not found in local storage!');
  }
};


/**
 * Handler for file storage file load error.
 * @param {*} error
 * @private
 */
os.ui.state.AbstractStateDescriptor.prototype.onFileError_ = function(error) {
  var msg;
  if (goog.isString(error)) {
    msg = 'Unable to load state file from storage: ' + error;
  } else {
    msg = 'State file not found in local storage!';
  }

  this.logError(msg);
};


/**
 * Handler for URL load success.
 * @param {goog.events.Event} event
 * @private
 */
os.ui.state.AbstractStateDescriptor.prototype.onUrlComplete_ = function(event) {
  var method = /** @type {os.ui.file.method.UrlMethod} */ (event.target);
  var file = method.getFile();
  method.dispose();

  if (file) {
    this.activateState(file);
  } else {
    this.logError('Unable to load state file from URL!');
  }
};


/**
 * Handler for URL load error.
 * @param {goog.events.Event} event
 * @private
 */
os.ui.state.AbstractStateDescriptor.prototype.onUrlError_ = function(event) {
  var method = /** @type {os.ui.file.method.UrlMethod} */ (event.target);
  method.dispose();

  this.logError('Unable to load state file from URL!');
};


/**
 * @param {string} msg The error message.
 * @param {Error=} opt_e The error
 * @protected
 */
os.ui.state.AbstractStateDescriptor.prototype.logError = function(msg, opt_e) {
  goog.log.error(this.log, msg, opt_e);
  this.setLoading(false);
  this.setActive(false);
};


/**
 * Deactivates the state.
 * @protected
 */
os.ui.state.AbstractStateDescriptor.prototype.deactivateState = function() {
  os.ui.stateManager.removeState(this.getId() + '-');
};


/**
 * @inheritDoc
 */
os.ui.state.AbstractStateDescriptor.prototype.getIcons = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.ui.state.AbstractStateDescriptor.prototype.getStateType = function() {
  return this.stateType;
};


/**
 * @inheritDoc
 */
os.ui.state.AbstractStateDescriptor.prototype.getNodeUI = function() {
  return '<defaultfilenodeui></defaultfilenodeui>';
};


/**
 * @inheritDoc
 */
os.ui.state.AbstractStateDescriptor.prototype.getLoadItems = function() {
  return this.loadItems_ ? this.loadItems_.slice() : null;
};


/**
 * @inheritDoc
 */
os.ui.state.AbstractStateDescriptor.prototype.setLoadItems = function(value) {
  this.loadItems_ = value;
  this.parserConfig['loadItems'] = value;
};


/**
 * @inheritDoc
 */
os.ui.state.AbstractStateDescriptor.prototype.getUrl = function() {
  return this.url;
};


/**
 * @inheritDoc
 */
os.ui.state.AbstractStateDescriptor.prototype.setUrl = function(value) {
  this.url = value;
};


/**
 * @inheritDoc
 */
os.ui.state.AbstractStateDescriptor.prototype.matchesURL = function(url) {
  return url == this.getUrl();
};


/**
 * @return {os.parse.StateParserConfig}
 */
os.ui.state.AbstractStateDescriptor.prototype.getParserConfig = function() {
  return this.parserConfig;
};


/**
 * @param {os.parse.StateParserConfig} config
 */
os.ui.state.AbstractStateDescriptor.prototype.setParserConfig = function(config) {
  this.parserConfig = config;
};


/**
 * @inheritDoc
 */
os.ui.state.AbstractStateDescriptor.prototype.setColor = function(value) {
  this.parserConfig['color'] = value;
  os.ui.state.AbstractStateDescriptor.base(this, 'setColor', value);
};


/**
 * @inheritDoc
 */
os.ui.state.AbstractStateDescriptor.prototype.setDescription = function(value) {
  this.parserConfig['description'] = value;
  os.ui.state.AbstractStateDescriptor.base(this, 'setDescription', value);
};


/**
 * @inheritDoc
 */
os.ui.state.AbstractStateDescriptor.prototype.setTags = function(value) {
  this.parserConfig['tags'] = value ? value.join(', ') : '';
  os.ui.state.AbstractStateDescriptor.base(this, 'setTags', value);
};


/**
 * @inheritDoc
 */
os.ui.state.AbstractStateDescriptor.prototype.setTitle = function(value) {
  this.parserConfig['title'] = value;
  os.ui.state.AbstractStateDescriptor.base(this, 'setTitle', value);
};


/**
 * @inheritDoc
 */
os.ui.state.AbstractStateDescriptor.prototype.clearData = function() {
  // permanently remove associated file contents from the application/storage
  var url = this.getUrl();
  if (url && os.file.isLocal(url)) {
    var fs = os.file.FileStorage.getInstance();
    fs.deleteFile(url);
  }
};


/**
 * @inheritDoc
 */
os.ui.state.AbstractStateDescriptor.prototype.persist = function(opt_obj) {
  opt_obj = os.ui.state.AbstractStateDescriptor.base(this, 'persist', opt_obj);

  opt_obj['loadItems'] = this.getLoadItems();
  opt_obj['url'] = this.getUrl();

  return opt_obj;
};


/**
 * @inheritDoc
 */
os.ui.state.AbstractStateDescriptor.prototype.restore = function(conf) {
  this.setLoadItems(conf['loadItems'] || null);
  this.url = conf['url'] || null;

  os.ui.state.AbstractStateDescriptor.base(this, 'restore', conf);
};


/**
 * @inheritDoc
 */
os.ui.state.AbstractStateDescriptor.prototype.getMenuGroup = function() {
  return '1:Saved States';
};
