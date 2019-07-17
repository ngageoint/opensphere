goog.provide('os.ui.AbstractMainContent');
goog.provide('os.ui.AbstractMainCtrl');

goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.userAgent');
goog.require('os.alert.AlertEvent');
goog.require('os.alert.AlertManager');
goog.require('os.config');
goog.require('os.config.Settings');
goog.require('os.metrics');
goog.require('os.metrics.Metrics');
goog.require('os.net');
goog.require('os.net.CertNazi');
goog.require('os.net.ProxyHandler');
goog.require('os.net.URLModifier');
goog.require('os.plugin.PluginManager');
goog.require('os.ui');
goog.require('os.ui.alert.alertPopupDirective');
goog.require('os.ui.consentDirective');
goog.require('os.ui.globalMenuDirective');
goog.require('os.ui.help.EventType');
goog.require('os.ui.metrics.MetricsManager');
goog.require('os.ui.notification.NotificationManager');
goog.require('os.ui.onboarding.OnboardingManager');
goog.require('os.ui.onboarding.contextOnboardingDirective');
goog.require('os.ui.onboarding.onboardingDirective');


/**
 * Key for injecting into the main-content list
 * @type {string}
 */
os.ui.AbstractMainContent = 'main-content';



/**
 * Controller function for the Main directive
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.$injector} $injector
 * @param {string} rootPath
 * @param {string} defaultAppName
 * @constructor
 * @ngInject
 */
os.ui.AbstractMainCtrl = function($scope, $injector, rootPath, defaultAppName) {
  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  /**
   * set injector for global use (for when things outside of angular need to use services)
   * @type {angular.$injector}
   */
  os.ui.injector = $injector;

  /**
   * @type {?os.net.CertNazi}
   * @private
   */
  this.certNazi_ = null;

  /**
   * @type {string}
   */
  $scope['path'] = rootPath;

  /**
   * @type {string}
   */
  $scope['appName'] = /** @type {string} */ (os.config.getAppName(defaultAppName));

  /**
   * Are the plugins ready?
   * @type {boolean}
   */
  $scope['pluginsReady'] = false;

  /**
   * Are the plugins loading? Wait for a time to display loading spinner
   * @type {boolean}
   */
  $scope['pluginsLoading'] = false;
  this.pluginLoadingTimer_ = goog.Timer.callOnce(function() {
    $scope['pluginsLoading'] = true;
    os.ui.apply($scope);
  }, 1500);

  // add window close handler
  window.addEventListener(goog.events.EventType.BEFOREUNLOAD, this.onClose.bind(this));

  // Initialize singletons
  this.initInstances();

  $scope.$on(os.ui.help.EventType.VIEW_LOG, this.onLogWindow.bind(this));
  $scope.$on('$destroy', this.destroy.bind(this));
};


/**
 * Clean up references to Angular/DOM elements and listeners.
 *
 * @protected
 */
os.ui.AbstractMainCtrl.prototype.destroy = function() {
  this.removeListeners();
  window.removeEventListener(goog.events.EventType.BEFOREUNLOAD, this.onClose.bind(this), true);
  this.scope = null;
};


/**
 * Executes the certNazi check.
 *
 * @protected
 */
os.ui.AbstractMainCtrl.prototype.doCertNazi = function() {
  var certCheckUrls = /** @type {Array.<string>} */ (os.settings.get(['certUrls']));
  var certPostUrl = /** @type {string} */ (os.settings.get(['certPostUrl']));

  if (certCheckUrls) {
    this.certNazi_ = new os.net.CertNazi(certCheckUrls);

    if (goog.userAgent.IE && certPostUrl) {
      // if we're in IE and have a POST URL to test, do it
      this.certNazi_.setPostUrl(certPostUrl);
    }

    this.certNazi_.listen(goog.net.EventType.ERROR, this.onCertNazi_, false, this);
    this.certNazi_.listen(goog.net.EventType.SUCCESS, this.onCertNazi_, false, this);
    this.certNazi_.inspect();
  }
};


/**
 * @param {goog.events.Event} event
 * @private
 */
os.ui.AbstractMainCtrl.prototype.onCertNazi_ = function(event) {
  if (event.type === goog.net.EventType.ERROR || event.type === os.net.CertNazi.POST_ERROR) {
    this.onCertNaziFailure(event);
  }

  this.certNazi_.unlisten(goog.net.EventType.ERROR, this.onCertNazi_, false, this);
  this.certNazi_.unlisten(goog.net.EventType.SUCCESS, this.onCertNazi_, false, this);
};


/**
 * @param {goog.events.Event} event
 * @protected
 */
os.ui.AbstractMainCtrl.prototype.onCertNaziFailure = function(event) {
  var label = 'Certificate Authority Issues';
  var url = /** @type {string} */ (os.settings.get(['caInstructions']));
  var text = 'Your browser does not have the proper certificate authorities installed correctly. ' +
      'Some features and base maps may fail to work properly. ' +
      'Please <a class="important-link" target="_blank" href="' + url + '">click here</a> ' +
      'for instructions on how to fix this.';

  if (event.type === os.net.CertNazi.POST_ERROR) { // IE failure
    label = 'Internet Explorer Issues';
    url = /** @type {string} */ (os.settings.get(['ieCertIssuesUrl']));
    text = 'You appear to be using a version of Internet Explorer that has problems with getting ' +
        'data from cross-domain remote servers. ' +
        'Please <a class="important-link" target="_blank" href="' + url + '">click here</a> ' +
        'for instructions on how to fix this.';
  }

  os.ui.window.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
    confirm: goog.nullFunction,
    prompt: text,
    noText: '',
    noIcon: '',
    windowOptions: {
      'label': label,
      'icon': 'fa fa-frown-o',
      'x': 'center',
      'y': 'center',
      'width': '350',
      'height': 'auto',
      'modal': 'true',
      'no-scroll': 'true',
      'headerClass': 'bg-warning u-bg-warning-text'
    }
  }));
};


/**
 * Initialize all the instances.
 * Some mainctrls will inherit most instances from the parent window.
 */
os.ui.AbstractMainCtrl.prototype.initInstances = function() {
  // Instantiate Singletons
  os.metrics.Metrics.getInstance();

  os.peer = os.xt.Peer.getInstance();

  os.ui.metricsManager = os.ui.metrics.MetricsManager.getInstance();

  os.ui.notificationManager = os.ui.notification.NotificationManager.getInstance();
  os.ui.notificationManager.setAppTitle(this.scope['appName']);

  os.ui.onboarding.OnboardingManager.PATH = this.scope['path'];
  os.ui.onboardingManager = os.ui.onboarding.OnboardingManager.getInstance();

  os.ui.pluginManager = os.plugin.PluginManager.getInstance();
  os.ui.pluginManager.listenOnce(goog.events.EventType.LOAD, this.onPluginsLoaded, false, this);
};


/**
 * Initializes the application.
 *
 * @protected
 */
os.ui.AbstractMainCtrl.prototype.initialize = function() {
  if (!os.settings.get(['sessionStart'])) {
    os.settings.set(['sessionStart'], new Date().getTime());
  }
  if (!os.settings.get(['about', 'version'])) {
    os.settings.set(['about', 'version'], this.scope['version']);
  }

  // set the proxy url
  os.net.ProxyHandler.PROXY_URL = /** @type {string} */ (os.settings.get(['proxyUrl'], os.net.ProxyHandler.PROXY_URL));

  // set up the proxy the new way
  os.net.ProxyHandler.configure(/** @type {?Object} */ (os.settings.get(['proxy'])));

  // set up URL replacements
  os.net.URLModifier.configure(/** @type {Object<string, string>} */ (os.settings.get('urlReplace')));

  // set if mixed content should be enabled
  os.net.ExtDomainHandler.MIXED_CONTENT_ENABLED = /** @type {boolean} */ (os.settings.get('mixedContent', false));

  // set if file:// URL's should be supported
  os.file.FILE_URL_ENABLED = /** @type {boolean} */ (os.settings.get('fileUrls', false));

  // set up cross origin config
  os.net.loadCrossOriginCache();

  // set up trusted URI's
  os.net.loadTrustedUris();

  os.ui.Consent.launch();

  this.doCertNazi();
  this.registerListeners();

  // Firefox < 38 doesnt support nested flexboxes very well. Moderizer checks dont help because it technically does
  // support flexbox but just not well until 38
  var versionArray = goog.labs.userAgent.browser.getVersion().split('.');
  var version = (versionArray && versionArray.length > 1) ? Number(versionArray[0]) : 0;
  var minVersion = /** @type {number} */(os.settings.get('minPerformatFFVersion', 38));
  var deprecatedFirefoxMessage = /** @type {string} */ (os.settings.get('deprecatedFirefoxMessage',
      '<h3>You are using an unsupported version of the Firefox browser!</h3>' +
      'For the best experience, please consider updating your browser.'));

  if (goog.labs.userAgent.browser.isFirefox() && version < minVersion) {
    $('body').addClass('c-main__slowBrowser');
    os.alert.AlertManager.getInstance().sendAlert(deprecatedFirefoxMessage,
        os.alert.AlertEventSeverity.WARNING, undefined, 1, new goog.events.EventTarget());
  }

  /**
   * Expose the ability to get a unique string.
   * This is useful for custom-check where you need a unqiueID to the whole DOM
   *
   * @return {string}
   */
  os.ui.injector.get('$rootScope')['getUniqueString'] = function() {
    return goog.string.getRandomString();
  };
};


/**
 * Init plugins
 *
 * @protected
 */
os.ui.AbstractMainCtrl.prototype.initPlugins = function() {
  this.addMetricsPlugins();
  this.addPlugins();
  os.ui.pluginManager.init();
};


/**
 * Tasks that should run after plugins have finished loading.
 *
 * @param {?goog.events.Event=} opt_e The optional event
 * @protected
 */
os.ui.AbstractMainCtrl.prototype.onPluginsLoaded = function(opt_e) {
  // send browser info metric
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.BROWSER + '.' + os.browserVersion(), 1);
  os.metrics.Metrics.getInstance().updateMetric(os.operatingSystem(), 1);
  this.scope['pluginsReady'] = true;
  goog.Timer.clear(this.pluginLoadingTimer_);
  this.scope['pluginsLoading'] = false;
  os.ui.apply(this.scope);

  this.initXt();
};


/**
 * What we do when the window closes
 * @protected
 */
os.ui.AbstractMainCtrl.prototype.onClose = goog.nullFunction;


/**
 * @param {Object} event
 * @protected
 */
os.ui.AbstractMainCtrl.prototype.onLogWindow = goog.nullFunction;


/**
 * Registers event listeners for the controller.
 * @protected
 */
os.ui.AbstractMainCtrl.prototype.registerListeners = goog.nullFunction;


/**
 * Removes event listeners for the controller.
 * @protected
 */
os.ui.AbstractMainCtrl.prototype.removeListeners = goog.nullFunction;


/**
 * Initialize the peer
 * @protected
 */
os.ui.AbstractMainCtrl.prototype.initXt = goog.nullFunction;


/**
 * Add the plugins for this app
 * @protected
 */
os.ui.AbstractMainCtrl.prototype.addPlugins = goog.nullFunction;


/**
 * Add the metrics plugins for this app
 * @protected
 */
os.ui.AbstractMainCtrl.prototype.addMetricsPlugins = goog.nullFunction;
