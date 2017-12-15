goog.provide('os.ui.onboarding.OnboardingManager');

goog.require('goog.Uri');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.net.EventType');
goog.require('os.config.Settings');
goog.require('os.net.Request');
goog.require('os.ui.onboarding.OnboardingEvent');
goog.require('os.ui.onboarding.OnboardingUrlHandler');
goog.require('os.ui.route.RouteManager');


/**
 * @typedef {{
 *   title: string,
 *   config: (Object|undefined),
 *   steps: Array<Object>
 * }}
 */
os.ui.onboarding.OnboardingConfig;



/**
 * Manager for user onboarding display.
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.ui.onboarding.OnboardingManager = function() {
  os.ui.onboarding.OnboardingManager.base(this, 'constructor');

  /**
   * Map of onboarding uri's to configurations.
   * @type {Object<string, (os.ui.onboarding.OnboardingConfig|boolean)>}
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
  os.ui.route.RouteManager.getInstance().registerUrlHandler(new os.ui.onboarding.OnboardingUrlHandler());
};
goog.inherits(os.ui.onboarding.OnboardingManager, goog.events.EventTarget);
goog.addSingletonGetter(os.ui.onboarding.OnboardingManager);


/**
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.onboarding.OnboardingManager.LOGGER_ = goog.log.getLogger('os.ui.onboarding.OnboardingManager');


/**
 * @type {Array<string>}
 */
os.ui.onboarding.OnboardingManager.FOLDERS = ['images/'];


/**
 * @type {string}
 */
os.ui.onboarding.OnboardingManager.PATH = os.ROOT;


/**
 * Displays onboarding if the user hasn't seen it yet, or if forced.
 * @param {string} uri Path to the onboarding configuration.
 * @param {boolean=} opt_force Force onboarding to display.
 */
os.ui.onboarding.OnboardingManager.prototype.displayOnboarding = function(uri, opt_force) {
  var alreadyDisplayed = os.settings.get(['onboarding', uri]);
  var show = opt_force || (this.isEnabled() && !alreadyDisplayed);
  this.initOnboarding_(uri, show);
};


/**
 * If onboarding is enabled in the application.
 * @return {boolean}
 */
os.ui.onboarding.OnboardingManager.prototype.isEnabled = function() {
  return /** @type {boolean} */ (os.settings.get('onboarding.showOnboarding', true));
};


/**
 * Asks whether a particular set of onboarding has been displayed yet or not.
 * @param {string} uri Path to the onboarding configuration.
 * @return {boolean}
 */
os.ui.onboarding.OnboardingManager.prototype.hasDisplayed = function(uri) {
  var ob = os.settings.get(['onboarding', uri]);
  return !!ob;
};


/**
 * Gets onboarding to add to the map. Called when onboarding is not needed to be displayed,
 * but still needed for context-specific onboarding.
 * @param {string} uri Path to the onboarding configuration
 * @param {boolean} show If the onboarding should also be displayed
 * @private
 */
os.ui.onboarding.OnboardingManager.prototype.initOnboarding_ = function(uri, show) {
  var ob = this.onboardingMap_[uri];
  if (!ob) {
    // temporarily set the key so the onboarding isn't requested more than once
    this.onboardingMap_[uri] = true;

    // request the onboarding config
    var request = new os.net.Request(uri);
    request.setHeader('Accept', 'application/json, text/plain, */*');
    request.listenOnce(goog.net.EventType.SUCCESS, goog.partial(this.onLoad_, show), false, this);
    request.listenOnce(goog.net.EventType.ERROR, this.onError_, false, this);
    request.load();
  } else if (show && goog.isObject(ob)) {
    // only display the onboarding if the value isn't the placeholder boolean
    this.launchOnboarding_(uri, /** @type {os.ui.onboarding.OnboardingConfig} */ (ob));
  }
};


/**
 * @param {string} uri The onboarding uri
 * @param {os.ui.onboarding.OnboardingConfig} ob The onboarding configuration
 * @private
 */
os.ui.onboarding.OnboardingManager.prototype.launchOnboarding_ = function(uri, ob) {
  os.settings.set(['onboarding', uri], true);
  this.dispatchEvent(new os.ui.onboarding.OnboardingEvent(ob['title'], ob['steps'], ob['config'] || null));
};


/**
 * Handles request completion
 * @param {boolean} show If the onboarding should also be displayed
 * @param {goog.events.Event} event The event
 * @private
 */
os.ui.onboarding.OnboardingManager.prototype.onLoad_ = function(show, event) {
  var req = /** @type {os.net.Request} */ (event.target);
  var resp = /** @type {string} */ (req.getResponse());

  var folders = os.ui.onboarding.OnboardingManager.FOLDERS;
  var path = os.ui.onboarding.OnboardingManager.PATH;

  for (var i = 0, n = folders.length; i < n; i++) {
    resp = resp.replace(new RegExp(folders[i], 'g'), path + folders[i]);
  }

  var ob = /** @type {os.ui.onboarding.OnboardingConfig} */ (JSON.parse(resp));
  var uri = req.getUri().toString();
  req.dispose();

  if (ob['title'] && ob['steps']) {
    this.processContext_(ob['steps']);
    this.onboardingMap_[uri] = ob;

    if (show) {
      this.launchOnboarding_(uri, ob);
    }
  } else {
    goog.log.error(os.ui.onboarding.OnboardingManager.LOGGER_, 'Onboarding configuration at "' + uri +
        '" does not contain required information.');
  }
};


/**
 * Handles request errors
 * @param {goog.events.Event} event The event
 * @private
 */
os.ui.onboarding.OnboardingManager.prototype.onError_ = function(event) {
  var req = /** @type {os.net.Request} */ (event.target);
  var uri = req.getUri().toString();
  req.dispose();

  goog.log.warning(os.ui.onboarding.OnboardingManager.LOGGER_, 'Unable to load onboarding with URI: ' + uri);
};


/**
 * Adds all contextual onboarding steps to the map.
 * @param {Array<Object>} steps
 * @private
 */
os.ui.onboarding.OnboardingManager.prototype.processContext_ = function(steps) {
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
};


/**
 * Show contextual onboarding
 * @param {string} context The context for the onboarding
 */
os.ui.onboarding.OnboardingManager.prototype.showContextOnboarding = function(context) {
  var steps = this.contextMap_[context];
  if (steps) {
    this.dispatchEvent(new os.ui.onboarding.OnboardingEvent(steps[0]['title'], steps, {'width': 350}));
  } else {
    goog.log.fine(os.ui.onboarding.OnboardingManager.LOGGER_, 'No onboarding registered for ' +
        context + '.');
  }
};
