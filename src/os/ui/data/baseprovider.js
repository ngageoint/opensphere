goog.declareModuleId('os.ui.data.BaseProvider');

import {getAuth} from '../../auth.js';
import IDataProvider from '../../data/idataprovider.js';
import PropertyChangeEvent from '../../events/propertychangeevent.js';
import osImplements from '../../implements.js';
import SlickTreeNode from '../slick/slicktreenode.js';

const log = goog.require('goog.log');
const {getRandomString} = goog.require('goog.string');

const {AuthEntry} = goog.requireType('os.auth');


/**
 * The base implementation of a provider
 *
 * @abstract
 * @implements {IDataProvider}
 */
export default class BaseProvider extends SlickTreeNode {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {goog.log.Logger}
     * @protected
     */
    this.log = logger;

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
     * @type {boolean}
     * @protected
     */
    this.showWhenEmpty = false;

    /**
     * @type {string}
     * @protected
     */
    this.providerType = BaseProvider.TYPE;
  }

  /**
   * @inheritDoc
   */
  configure(config) {
    this.setEnabled(!!config['enabled']);

    var label = /** @type {string|undefined} */ (config['label']);
    if (label) {
      this.setLabel(label);
    }
  }

  /**
   * @inheritDoc
   */
  load(opt_ping) {
  }

  /**
   * @inheritDoc
   */
  getEnabled() {
    return this.enabled_;
  }

  /**
   * @inheritDoc
   */
  setEnabled(value) {
    var changed = this.enabled_ !== value;
    this.enabled_ = value;

    if (changed) {
      this.dispatchEvent(new PropertyChangeEvent('children', null, value));
    }
  }

  /**
   * @inheritDoc
   */
  getEditable() {
    return this.editable_;
  }

  /**
   * @inheritDoc
   */
  setEditable(value) {
    this.editable_ = value;
  }

  /**
   * @inheritDoc
   */
  includeInServers() {
    return this.listInServers;
  }

  /**
   * @inheritDoc
   */
  getShowWhenEmpty() {
    return this.showWhenEmpty;
  }

  /**
   * @inheritDoc
   */
  getInfo() {
    const auth = this.getAuth();

    if (auth) {
      let message = auth.message;
      if (auth.link) {
        // if a link is available, add a link to open the auth page
        message += `<br><br><a href="${auth.link}" target="_blank">Click here to go to the login page</a>`;
      }

      return message;
    }

    return '';
  }

  /**
   * @inheritDoc
   */
  getError() {
    return false;
  }

  /**
   * @inheritDoc
   */
  getCheckboxDisabled() {
    return true;
  }

  /**
   * Get a unique identifier for a child of this provider.
   *
   * @return {string}
   */
  getUniqueId() {
    var id = this.getId() + BaseProvider.ID_DELIMITER + getRandomString();
    var done = false;
    while (!done) {
      var children = this.getChildren();
      if (children) {
        done = !children.some((child) => child.getId() == id);
      } else {
        done = true;
      }

      id = this.getId() + BaseProvider.ID_DELIMITER + getRandomString();
    }

    return id;
  }

  /**
   * Gets the authentication info for the server (if any).
   *
   * @return {?AuthEntry}
   */
  getAuth() {
    return getAuth(this.getLabel());
  }

  /**
   * @inheritDoc
   */
  formatIcons() {
    let icons = '';

    const auth = this.getAuth();
    if (auth) {
      icons = `<i class="fas fa-sign-in-alt" title="${auth.tooltip}"></i>`;

      if (auth.link) {
        // if a link is available, make the icon clickable
        icons = `<a class="c-glyph" href="${auth.link}" target="_blank">${icons}</a>`;
      }
    }

    return icons;
  }

  /**
   * The server type.
   * @type {string}
   */
  static get TYPE() {
    return 'default';
  }
}

osImplements(BaseProvider, IDataProvider.ID);

/**
 * Logger for os.ui.data.BaseProvider
 * @type {goog.log.Logger}
 */
const logger = log.getLogger('os.ui.data.BaseProvider');

/**
 * @type {string}
 * @const
 */
BaseProvider.ID_DELIMITER = '#';
