goog.declareModuleId('os.ui.onboarding.OnboardingManager');

import Settings from '../../config/settings.js';
import Request from '../../net/request.js';
import {isObject} from '../../object/object.js';
import {ROOT} from '../../os.js';
import RouteManager from '../route/routemanager.js';
import OnboardingEvent from './onboardingevent.js';
import OnboardingUrlHandler from './onboardingurlhandler.js';

const EventTarget = goog.require('goog.events.EventTarget');
const log = goog.require('goog.log');
const EventType = goog.require('goog.net.EventType');

const GoogEvent = goog.requireType('goog.events.Event');
const Logger = goog.requireType('goog.log.Logger');


/**
 * @typedef {{
 *   title: string,
 *   config: (Object|undefined),
 *   steps: Array<Object>
 * }}
 */
let OnboardingConfig;

/**
 * Manager for user onboarding display.
 */
export default class OnboardingManager extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * Map of onboarding uri's to configurations.
     * @type {Object<string, (OnboardingConfig|boolean)>}
     * @private
     */
    this.onboardingMap_ = {};

    /**
     * Map of onboarding contexts to the associated steps.
     * @type {Object<string, Array<Object>>}
     * @private
     */
    this.contextMap_ = {};

    // register the onboarding URL handler
    RouteManager.getInstance().registerUrlHandler(new OnboardingUrlHandler());
  }

  /**
   * Displays onboarding if the user hasn't seen it yet, or if forced.
   *
   * @param {string} uri Path to the onboarding configuration.
   * @param {boolean=} opt_force Force onboarding to display.
   */
  displayOnboarding(uri, opt_force) {
    var alreadyDisplayed = Settings.getInstance().get(['onboarding', uri]);
    var show = opt_force || (this.isEnabled() && !alreadyDisplayed);
    this.initOnboarding_(uri, show);
  }

  /**
   * If onboarding is enabled in the application.
   *
   * @return {boolean}
   */
  isEnabled() {
    return /** @type {boolean} */ (Settings.getInstance().get('onboarding.showOnboarding', true));
  }

  /**
   * Asks whether a particular set of onboarding has been displayed yet or not.
   *
   * @param {string} uri Path to the onboarding configuration.
   * @return {boolean}
   */
  hasDisplayed(uri) {
    var ob = Settings.getInstance().get(['onboarding', uri]);
    return !!ob;
  }

  /**
   * Gets onboarding to add to the map. Called when onboarding is not needed to be displayed,
   * but still needed for context-specific onboarding.
   *
   * @param {string} uri Path to the onboarding configuration
   * @param {boolean} show If the onboarding should also be displayed
   * @private
   */
  initOnboarding_(uri, show) {
    var ob = this.onboardingMap_[uri];
    if (!ob) {
      // temporarily set the key so the onboarding isn't requested more than once
      this.onboardingMap_[uri] = true;

      // request the onboarding config
      var request = new Request(uri);
      request.setHeader('Accept', 'application/json, text/plain, */*');
      request.listenOnce(EventType.SUCCESS, goog.partial(this.onLoad_, show), false, this);
      request.listenOnce(EventType.ERROR, this.onError_, false, this);
      request.load();
    } else if (show && isObject(ob)) {
      // only display the onboarding if the value isn't the placeholder boolean
      this.launchOnboarding_(uri, /** @type {OnboardingConfig} */ (ob));
    }
  }

  /**
   * @param {string} uri The onboarding uri
   * @param {OnboardingConfig} ob The onboarding configuration
   * @private
   */
  launchOnboarding_(uri, ob) {
    Settings.getInstance().set(['onboarding', uri], true);
    this.dispatchEvent(new OnboardingEvent(ob['title'], ob['steps'], ob['config'] || null));
  }

  /**
   * Handles request completion
   *
   * @param {boolean} show If the onboarding should also be displayed
   * @param {GoogEvent} event The event
   * @private
   */
  onLoad_(show, event) {
    var req = /** @type {Request} */ (event.target);
    var resp = /** @type {string} */ (req.getResponse());

    var folders = OnboardingManager.FOLDERS;
    var path = OnboardingManager.PATH;

    for (var i = 0, n = folders.length; i < n; i++) {
      resp = resp.replace(new RegExp(folders[i], 'g'), path + folders[i]);
    }

    var ob = /** @type {OnboardingConfig} */ (JSON.parse(resp));
    var uri = req.getUri().toString();
    req.dispose();

    if (ob['title'] && ob['steps']) {
      this.processContext_(ob['steps']);
      this.onboardingMap_[uri] = ob;

      if (show) {
        this.launchOnboarding_(uri, ob);
      }
    } else {
      log.error(logger, 'Onboarding configuration at "' + uri + '" does not contain required information.');
    }
  }

  /**
   * Handles request errors
   *
   * @param {GoogEvent} event The event
   * @private
   */
  onError_(event) {
    var req = /** @type {Request} */ (event.target);
    var uri = req.getUri().toString();
    req.dispose();

    log.warning(logger, 'Unable to load onboarding with URI: ' + uri);
  }

  /**
   * Adds all contextual onboarding steps to the map.
   *
   * @param {Array<Object>} steps
   * @private
   */
  processContext_(steps) {
    for (var i = 0, n = steps.length; i < n; i++) {
      var step = steps[i];
      var context = step['context'];
      if (context) {
        if (!(context in this.contextMap_)) {
          this.contextMap_[context] = [step];
        } else {
          this.contextMap_[context].push(step);
        }
      }
    }
  }

  /**
   * Show contextual onboarding
   *
   * @param {string} context The context for the onboarding
   */
  showContextOnboarding(context) {
    var steps = this.contextMap_[context];
    if (steps) {
      this.dispatchEvent(new OnboardingEvent(steps[0]['title'], steps, {'width': 350}));
    } else {
      log.fine(logger, 'No onboarding registered for ' + context + '.');
    }
  }

  /**
   * Get the global instance.
   * @return {!OnboardingManager}
   */
  static getInstance() {
    if (!instance) {
      instance = new OnboardingManager();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {OnboardingManager} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {OnboardingManager|undefined}
 */
let instance;

/**
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.onboarding.OnboardingManager');

/**
 * @type {Array<string>}
 */
OnboardingManager.FOLDERS = ['images/'];

/**
 * @type {string}
 */
OnboardingManager.PATH = ROOT;
