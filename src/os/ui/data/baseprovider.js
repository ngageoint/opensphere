goog.provide('os.ui.data.BaseProvider');

goog.require('os.data.IDataProvider');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * The base implementation of a provider
 * @extends {os.ui.slick.SlickTreeNode}
 * @implements {os.data.IDataProvider}
 * @constructor
 */
os.ui.data.BaseProvider = function() {
  os.ui.data.BaseProvider.base(this, 'constructor');

  /**
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = os.ui.data.BaseProvider.LOGGER_;

  /**
   * @type {boolean}
   * @private
   */
  this.enabled_ = false;

  /**
   * @type {boolean}
   * @private
   */
  this.editable_ = false;

  /**
   * @type {boolean}
   * @protected
   */
  this.listInServers = true;

  /**
   * @type {string}
   * @protected
   */
  this.providerType = os.ui.data.BaseProvider.TYPE;
};
goog.inherits(os.ui.data.BaseProvider, os.ui.slick.SlickTreeNode);


/**
 * Logger for os.ui.data.BaseProvider
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.data.BaseProvider.LOGGER_ = goog.log.getLogger('os.ui.data.BaseProvider');


/**
 * @type {string}
 * @const
 */
os.ui.data.BaseProvider.ID_DELIMITER = '#';


/**
 * @type {string}
 * @const
 */
os.ui.data.BaseProvider.TYPE = 'default';


/**
 * @inheritDoc
 */
os.ui.data.BaseProvider.prototype.configure = function(config) {
  this.setEnabled(/** @type {boolean} */ (config['enabled']));
  this.setLabel(/** @type {string} */ (config['label']));
};


/**
 * @inheritDoc
 */
os.ui.data.BaseProvider.prototype.load = function(opt_ping) {
};


/**
 * @inheritDoc
 */
os.ui.data.BaseProvider.prototype.getEnabled = function() {
  return this.enabled_;
};


/**
 * @inheritDoc
 */
os.ui.data.BaseProvider.prototype.setEnabled = function(value) {
  var changed = this.enabled_ !== value;
  this.enabled_ = value;

  if (changed) {
    this.dispatchEvent(new os.events.PropertyChangeEvent('children', null, value));
  }
};


/**
 * @inheritDoc
 */
os.ui.data.BaseProvider.prototype.getEditable = function() {
  return this.editable_;
};


/**
 * @inheritDoc
 */
os.ui.data.BaseProvider.prototype.setEditable = function(value) {
  this.editable_ = value;
};


/**
 * @inheritDoc
 */
os.ui.data.BaseProvider.prototype.includeInServers = function() {
  return this.listInServers;
};


/**
 * @inheritDoc
 */
os.ui.data.BaseProvider.prototype.getError = function() {
  return false;
};


/**
 * @inheritDoc
 */
os.ui.data.BaseProvider.prototype.getCheckboxDisabled = function() {
  return true;
};


/**
 * @inheritDoc
 */
os.ui.data.BaseProvider.prototype.getErrorMessage = goog.abstractMethod;


/**
 * Get a unique identifier for a child of this provider.
 * @return {string}
 */
os.ui.data.BaseProvider.prototype.getUniqueId = function() {
  var id = this.getId() + os.ui.data.BaseProvider.ID_DELIMITER + goog.string.getRandomString();
  var done = false;
  while (!done) {
    var children = this.getChildren();
    if (children) {
      done = !goog.array.some(children, function(child) {
        return child.getId() == id;
      });
    } else {
      done = true;
    }

    id = this.getId() + os.ui.data.BaseProvider.ID_DELIMITER + goog.string.getRandomString();
  }

  return id;
};
