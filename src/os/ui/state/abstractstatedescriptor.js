goog.declareModuleId('os.ui.state.AbstractStateDescriptor');

import UrlMethod from '../file/method/urlmethod.js';
import {directiveTag as nodeUi} from '../file/ui/defaultfilenodeui.js';
import IStateDescriptor from './istatedescriptor.js';

const {assertString} = goog.require('goog.asserts');
const {loadXml} = goog.require('goog.dom.xml');
const {isValid} = goog.require('goog.json');
const log = goog.require('goog.log');
const BaseDescriptor = goog.require('os.data.BaseDescriptor');
const IUrlDescriptor = goog.require('os.data.IUrlDescriptor');
const OSEventType = goog.require('os.events.EventType');
const {isLocal} = goog.require('os.file');
const FileStorage = goog.require('os.file.FileStorage');
const osImplements = goog.require('os.implements');
const StateParserConfig = goog.require('os.parse.StateParserConfig');
const StateType = goog.require('os.state.StateType');
const {getStateManager} = goog.require('os.state.instance');

const GoogEvent = goog.requireType('goog.events.Event');
const Logger = goog.requireType('goog.log.Logger');
const OSFile = goog.requireType('os.file.File');


/**
 * Base descriptor for state files.
 *
 * @implements {IStateDescriptor}
 * @implements {IUrlDescriptor}
 * @abstract
 */
export default class AbstractStateDescriptor extends BaseDescriptor {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.descriptorType = 'state';
    this.log = logger;
    this.setType('Saved States');

    // prevent state descriptors from being cleaned up based on the last active time
    this.setLocal(true);

    /**
     * @type {StateParserConfig}
     * @protected
     */
    this.parserConfig = new StateParserConfig();

    /**
     * The items to load from the state file
     * @type {Array<string>}
     * @private
     */
    this.loadItems_ = null;

    /**
     * The application state type.
     * @type {!string}
     * @protected
     */
    this.stateType = StateType.UNKNOWN;

    /**
     * @type {?string}
     * @protected
     */
    this.url = null;
  }

  /**
   * @inheritDoc
   */
  setActiveInternal() {
    if (this.isActive()) {
      this.activateState();
    } else {
      this.deactivateState();
    }

    return true;
  }

  /**
   * Activates the state.
   *
   * @param {OSFile=} opt_file The state file to load
   */
  activateState(opt_file) {
    try {
      if (!opt_file) {
        var url = this.getUrl();
        if (url) {
          this.setLoading(true);

          if (isLocal(url)) {
            var fs = FileStorage.getInstance();
            fs.getFile(url).addCallbacks(this.onFileReady_, this.onFileError_, this);
          } else {
            var method = new UrlMethod();
            method.setUrl(url);
            method.listen(OSEventType.COMPLETE, this.onUrlComplete, false, this);
            method.listen(OSEventType.CANCEL, this.onUrlError_, false, this);
            method.listen(OSEventType.ERROR, this.onUrlError_, false, this);
            method.loadUrl();
          }
        } else {
          this.logError('No URL provided for state file!');
        }
      } else {
        this.setLoading(false);

        opt_file.convertContentToString();
        var content = opt_file.getContent();
        assertString(content, 'State file content must be a string!');

        // decide whether it's a JSON file or an XML
        var doc = isValid(content) ? JSON.parse(content) : loadXml(content);

        var list = getStateManager().analyze(doc);
        var loadItems = this.getLoadItems();
        if (loadItems) {
          for (var i = 0, n = list.length; i < n; i++) {
            var state = list[i];
            state.setEnabled(loadItems.includes(state.toString()));
          }
        }

        getStateManager().loadState(doc, list, this.getId() + '-', this.getTitle());
      }
    } catch (e) {
      this.logError('Unable to activate state: ' + e.message, e);
    }
  }

  /**
   * Handler for file storage file load success.
   *
   * @param {?OSFile} file
   * @private
   */
  onFileReady_(file) {
    if (file) {
      this.activateState(file);
    } else {
      this.logError('State file not found in local storage!');
    }
  }

  /**
   * Handler for file storage file load error.
   *
   * @param {*} error
   * @private
   */
  onFileError_(error) {
    var msg;
    if (typeof error === 'string') {
      msg = 'Unable to load state file from storage: ' + error;
    } else {
      msg = 'State file not found in local storage!';
    }

    this.logError(msg);
  }

  /**
   * Handler for URL load success.
   *
   * @param {GoogEvent} event
   */
  onUrlComplete(event) {
    var method = /** @type {UrlMethod} */ (event.target);
    var file = method.getFile();
    method.dispose();

    var active = this.isActive();
    if (active && file) {
      this.activateState(file);
    } else {
      this.logError(active ? 'Unable to load state file from URL!' : 'Descriptor deactivated before file loaded.');
    }
  }

  /**
   * Handler for URL load error.
   *
   * @param {GoogEvent} event
   * @private
   */
  onUrlError_(event) {
    var method = /** @type {UrlMethod} */ (event.target);
    method.dispose();

    this.logError('Unable to load state file from URL!');
  }

  /**
   * @param {string} msg The error message.
   * @param {Error=} opt_e The error
   * @protected
   */
  logError(msg, opt_e) {
    log.error(this.log, msg, opt_e);
    this.setLoading(false);
    this.setActive(false);
  }

  /**
   * Deactivates the state.
   */
  deactivateState() {
    getStateManager().removeState(this.getId() + '-');
  }

  /**
   * @inheritDoc
   */
  getStateType() {
    return this.stateType;
  }

  /**
   * @inheritDoc
   */
  getNodeUI() {
    return `<${nodeUi}></${nodeUi}>`;
  }

  /**
   * @inheritDoc
   */
  getLoadItems() {
    return this.loadItems_ ? this.loadItems_.slice() : null;
  }

  /**
   * @inheritDoc
   */
  setLoadItems(value) {
    this.loadItems_ = value;
    this.parserConfig['loadItems'] = value;
  }

  /**
   * @inheritDoc
   */
  getUrl() {
    return this.url;
  }

  /**
   * @inheritDoc
   */
  setUrl(value) {
    this.url = value;
  }

  /**
   * @inheritDoc
   */
  matchesURL(url) {
    return url == this.getUrl();
  }

  /**
   * @return {StateParserConfig}
   */
  getParserConfig() {
    return this.parserConfig;
  }

  /**
   * @param {StateParserConfig} config
   */
  setParserConfig(config) {
    this.parserConfig = config;
  }

  /**
   * @inheritDoc
   */
  setColor(value) {
    this.parserConfig['color'] = value;
    super.setColor(value);
  }

  /**
   * @inheritDoc
   */
  setDescription(value) {
    this.parserConfig['description'] = value;
    super.setDescription(value);
  }

  /**
   * @inheritDoc
   */
  setTags(value) {
    this.parserConfig['tags'] = value ? value.join(', ') : '';
    super.setTags(value);
  }

  /**
   * @inheritDoc
   */
  setTitle(value) {
    this.parserConfig['title'] = value;
    super.setTitle(value);
  }

  /**
   * @inheritDoc
   */
  clearData() {
    // permanently remove associated file contents from the application/storage
    var url = this.getUrl();
    if (url && isLocal(url)) {
      var fs = FileStorage.getInstance();
      fs.deleteFile(url);
    }
  }

  /**
   * @inheritDoc
   */
  persist(opt_obj) {
    opt_obj = super.persist(opt_obj);

    opt_obj['loadItems'] = this.getLoadItems();
    opt_obj['url'] = this.getUrl();

    return opt_obj;
  }

  /**
   * @inheritDoc
   */
  restore(conf) {
    this.setLoadItems(conf['loadItems'] || null);
    this.url = conf['url'] || null;

    super.restore(conf);
  }

  /**
   * @inheritDoc
   */
  getMenuGroup() {
    return '1:Saved States';
  }

  /**
   * @inheritDoc
   */
  getDefaultPersister() {
    return 'File';
  }
}

osImplements(AbstractStateDescriptor, IUrlDescriptor.ID);
osImplements(AbstractStateDescriptor, IStateDescriptor.ID);

/**
 * Identifier used for state descriptors.
 * @type {string}
 * @const
 */
AbstractStateDescriptor.ID = 'state';

/**
 * Logger for os.ui.state.AbstractStateDescriptor
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.state.AbstractStateDescriptor');
