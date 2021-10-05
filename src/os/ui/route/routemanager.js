goog.declareModuleId('os.ui.route.RouteManager');

import * as ui from '../ui.js';

const Uri = goog.require('goog.Uri');
const {toObject} = goog.require('goog.collections.maps');
const {isEmpty} = goog.require('goog.object');

const {default: AbstractUrlHandler} = goog.requireType('os.url.AbstractUrlHandler');


/**
 * Class for managing route handlers. Handlers can be registered by any part of the application to handle particular
 * key value pairs in the query data of the application.
 */
export default class RouteManager {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {angular.Scope}
     * @private
     */
    this.rootScope_ = /** @type {angular.Scope} */ (ui.injector.get('$rootScope'));

    /**
     * @type {angular.$location}
     * @private
     */
    this.location_ = /** @type {angular.$location} */ (ui.injector.get('$location'));

    /**
     * Object representing the current URL's query data.
     * @type {?Object<string, string>}
     * @private
     */
    this.search_ = null;

    /**
     * Map of keys to arrays of route handlers that handle them.
     * @type {Object<string, Array<AbstractUrlHandler>>}
     * @private
     */
    this.routeHandlers_ = {};

    /**
     * Flag for keeping track whether we're initialized or not. If not, the route handlers will not fire yet.
     * @type {boolean}
     * @private
     */
    this.initialized_ = false;
  }

  /**
   * Initialize the route manager. Don't call this until the app is ready to consume the route parameters.
   */
  initialize() {
    this.rootScope_.$on('$routeUpdate', this.onRouteUpdate.bind(this));
    this.initialized_ = true;
    this.onRouteUpdate();
  }

  /**
   * Handler for routeUpdate events.
   */
  onRouteUpdate() {
    if (this.initialized_) {
      var oldSearch = this.search_;
      this.search_ = this.getSearch();

      if (this.search_) {
        // handle any keys in the search terms
        for (var key in this.search_) {
          var handlers = this.routeHandlers_[key];
          if (handlers) {
            handlers.forEach(function(handler) {
              handler.handle(key, this.search_[key]);
            }, this);
          }
        }
      }

      if (oldSearch) {
        // this checks to see if any keys were removed, and if they were, they are fully unhandled
        for (var key in oldSearch) {
          if (!this.search_ || !(key in this.search_)) {
            var handlers = this.routeHandlers_[key];
            if (handlers) {
              handlers.forEach(function(handler) {
                handler.unhandleAll(key);
              });
            }
          }
        }
      }
    }
  }

  /**
   * Register a URL handler. The manager will index it by its handles array and call all handlers
   * that handle a given key when that key is seen.
   *
   * @param {AbstractUrlHandler} handler The handler to register.
   */
  registerUrlHandler(handler) {
    var keys = handler.getKeys();
    keys.forEach(function(key) {
      this.routeHandlers_[key] ? this.routeHandlers_[key].push(handler) : this.routeHandlers_[key] = [handler];
    }, this);

    this.onRouteUpdate();
  }

  /**
   * Gets the search object. This prefers to use the Angular location service, but will fall back to
   * {@code Uri.QueryData} if that fails.
   *
   * @return {?Object} The search object
   *
   * @suppress {accessControls} For convenience. {@code goog.Uri.QueryData} doesn't expose its keymap for some reason.
   */
  getSearch() {
    var search = this.location_.search();

    if (search && !isEmpty(search)) {
      return search;
    }

    // sigh... the location service doesn't consider query data before the hash, so we have to do it the old fashioned way
    var uri = new Uri(window.location);
    var qd = uri.getQueryData();
    qd.ensureKeyMapInitialized_();
    var obj = qd.keyMap_ ? toObject(qd.keyMap_) : {};
    var retObj = {};
    for (var key in obj) {
      retObj[key] = obj[key].join(',');
    }
    return retObj;
  }

  /**
   * Get the global instance.
   * @return {!RouteManager}
   */
  static getInstance() {
    if (!instance) {
      instance = new RouteManager();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {RouteManager} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {RouteManager|undefined}
 */
let instance;
