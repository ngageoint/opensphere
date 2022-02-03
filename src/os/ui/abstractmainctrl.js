goog.declareModuleId('os.ui.AbstractMainCtrl');

// import '../../polyfill/chardetng.js';
import './alert/alertpopup.js';
import './globalmenu.js';
import './listui.js';
import './onboarding/contextonboarding.js';
import './onboarding/onboarding.js';
// import ElectronPlugin from '../../plugin/electron/electronplugin.js';
import AlertEventSeverity from '../alert/alerteventseverity.js';
import AlertManager from '../alert/alertmanager.js';
import {getAppName} from '../config/config.js';
import Settings from '../config/settings.js';
import {setFileUrlEnabled} from '../file/index.js';
import Metrics from '../metrics/metrics.js';
import {BROWSER} from '../metrics/metricskeys.js';
import fixInjectorInvoke from '../mixin/fixinjectorinvoke.js';
import CertNazi from '../net/certnazi.js';
import ExtDomainHandler from '../net/extdomainhandler.js';
import {loadCrossOriginCache, loadTrustedUris} from '../net/net.js';
import ProxyHandler from '../net/proxyhandler.js';
import * as RequestHandlerFactory from '../net/requesthandlerfactory.js';
import {browserVersion, operatingSystem, setPeer} from '../os.js';
import PluginManager from '../plugin/pluginmanager.js';
import * as replacers from '../time/timereplacers.js';
import Peer from '../xt/peer.js';
import * as ConsentUI from './consent.js';
import EventType from './help/helpeventtype.js';
import MetricsManager from './metrics/metricsmanager.js';
import NotificationManager from './notification/notificationmanager.js';
import OnboardingManager from './onboarding/onboardingmanager.js';
import {apply, injector, setInjector} from './ui.js';

import * as ConfirmUI from './window/confirm.js';

const Timer = goog.require('goog.Timer');
const EventTarget = goog.require('goog.events.EventTarget');
const GoogEventType = goog.require('goog.events.EventType');
const {getVersion, isFirefox} = goog.require('goog.labs.userAgent.browser');
const NetEventType = goog.require('goog.net.EventType');
const {getRandomString} = goog.require('goog.string');
const {IE} = goog.require('goog.userAgent');

const GoogEvent = goog.requireType('goog.events.Event');


/**
 * Controller function for the Main directive
 * @unrestricted
 */
export default class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.$injector} $injector
   * @param {string} rootPath
   * @param {string} defaultAppName
   * @ngInject
   */
  constructor($scope, $injector, rootPath, defaultAppName) {
    /**
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    // Set injector for global use (for when things outside of Angular need to use services).
    setInjector($injector);
    fixInjectorInvoke($injector);

    /**
     * @type {?CertNazi}
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
    $scope['appName'] = /** @type {string} */ (getAppName(defaultAppName));

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
    this.pluginLoadingTimer_ = Timer.callOnce(function() {
      $scope['pluginsLoading'] = true;
      apply($scope);
    }, 1500);

    // add window close handler
    window.addEventListener(GoogEventType.BEFOREUNLOAD, this.onClose.bind(this));

    // Initialize singletons
    this.initInstances();

    $scope.$on(EventType.VIEW_LOG, this.onLogWindow.bind(this));
    $scope.$on('$destroy', this.destroy.bind(this));
  }

  /**
   * Clean up references to Angular/DOM elements and listeners.
   *
   * @protected
   */
  destroy() {
    this.removeListeners();
    window.removeEventListener(GoogEventType.BEFOREUNLOAD, this.onClose.bind(this), true);
    this.scope = null;
  }

  /**
   * Executes the certNazi check.
   *
   * @protected
   */
  doCertNazi() {
    var certCheckUrls = /** @type {Array.<string>} */ (Settings.getInstance().get(['certUrls']));
    var certPostUrl = /** @type {string} */ (Settings.getInstance().get(['certPostUrl']));

    if (certCheckUrls) {
      this.certNazi_ = new CertNazi(certCheckUrls);

      if (IE && certPostUrl) {
        // if we're in IE and have a POST URL to test, do it
        this.certNazi_.setPostUrl(certPostUrl);
      }

      this.certNazi_.listen(NetEventType.ERROR, this.onCertNazi_, false, this);
      this.certNazi_.listen(NetEventType.SUCCESS, this.onCertNazi_, false, this);
      this.certNazi_.inspect();
    }
  }

  /**
   * @param {GoogEvent} event
   * @private
   */
  onCertNazi_(event) {
    if (event.type === NetEventType.ERROR || event.type === CertNazi.POST_ERROR) {
      this.onCertNaziFailure(event);
    }

    this.certNazi_.unlisten(NetEventType.ERROR, this.onCertNazi_, false, this);
    this.certNazi_.unlisten(NetEventType.SUCCESS, this.onCertNazi_, false, this);
  }

  /**
   * @param {GoogEvent} event
   * @protected
   */
  onCertNaziFailure(event) {
    var label = 'Certificate Authority Issues';
    var url = /** @type {string} */ (Settings.getInstance().get(['caInstructions']));
    var text = 'Your browser does not have the proper certificate authorities installed correctly. ' +
        'Some features and base maps may fail to work properly. ' +
        'Please <a class="important-link" target="_blank" href="' + url + '">click here</a> ' +
        'for instructions on how to fix this.';

    if (event.type === CertNazi.POST_ERROR) { // IE failure
      label = 'Internet Explorer Issues';
      url = /** @type {string} */ (Settings.getInstance().get(['ieCertIssuesUrl']));
      text = 'You appear to be using a version of Internet Explorer that has problems with getting ' +
          'data from cross-domain remote servers. ' +
          'Please <a class="important-link" target="_blank" href="' + url + '">click here</a> ' +
          'for instructions on how to fix this.';
    }

    ConfirmUI.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
      confirm: () => {},
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
        'headerClass': 'bg-warning u-bg-warning-text'
      }
    }));
  }

  /**
   * Initialize all the instances.
   * Some mainctrls will inherit most instances from the parent window.
   */
  initInstances() {
    // Instantiate Singletons
    Metrics.getInstance();
    MetricsManager.getInstance();

    setPeer(Peer.getInstance());

    const notificationManager = NotificationManager.getInstance();
    notificationManager.setAppTitle(this.scope['appName']);

    OnboardingManager.PATH = this.scope['path'];
    OnboardingManager.getInstance();

    const pluginManager = PluginManager.getInstance();
    pluginManager.listenOnce(GoogEventType.LOAD, this.onPluginsLoaded, false, this);
  }

  /**
   * Initializes the application.
   *
   * @protected
   */
  initialize() {
    if (!Settings.getInstance().get(['sessionStart'])) {
      Settings.getInstance().set(['sessionStart'], new Date().getTime());
    }
    if (!Settings.getInstance().get(['about', 'version'])) {
      Settings.getInstance().set(['about', 'version'], this.scope['version']);
    }

    // configure the proxy via settings & only add the handler if it's successful
    var proxyConfig = /** @type {?Object} */ (Settings.getInstance().get(['proxy']));
    var proxyUrl = /** @type {?string} */ (Settings.getInstance().get(['proxyUrl']));

    if (proxyConfig || proxyUrl) {
      ProxyHandler.PROXY_URL = proxyUrl || ProxyHandler.PROXY_URL;
      ProxyHandler.configure(proxyConfig);
      RequestHandlerFactory.addHandler(ProxyHandler);
    }

    // set if mixed content should be enabled -- this should be true if proxy is not configured
    ExtDomainHandler.MIXED_CONTENT_ENABLED = /** @type {boolean} */ (Settings.getInstance().get('mixedContent', false));

    // set if file:// URL's should be supported
    setFileUrlEnabled(/** @type {boolean} */ (Settings.getInstance().get('fileUrls', false)));

    // set up cross origin config
    loadCrossOriginCache();

    // set up trusted URI's
    loadTrustedUris();

    // initialize variable replacers for time values in URI's
    replacers.init();

    ConsentUI.launch();

    this.doCertNazi();
    this.registerListeners();

    // Firefox < 38 doesnt support nested flexboxes very well. Moderizer checks dont help because it technically does
    // support flexbox but just not well until 38
    var versionArray = getVersion().split('.');
    var version = (versionArray && versionArray.length > 1) ? Number(versionArray[0]) : 0;
    var minVersion = /** @type {number} */(Settings.getInstance().get('minPerformatFFVersion', 38));
    var deprecatedFirefoxMessage = /** @type {string} */ (Settings.getInstance().get('deprecatedFirefoxMessage',
        '<h3>You are using an unsupported version of the Firefox browser!</h3>' +
        'For the best experience, please consider updating your browser.'));

    if (isFirefox() && version < minVersion) {
      $('body').addClass('c-main__slowBrowser');
      AlertManager.getInstance().sendAlert(deprecatedFirefoxMessage,
          AlertEventSeverity.WARNING, undefined, 1, new EventTarget());
    }

    /**
     * Expose the ability to get a unique string.
     * This is useful for custom-check where you need a unqiueID to the whole DOM
     *
     * @return {string}
     */
    injector.get('$rootScope')['getUniqueString'] = function() {
      return getRandomString();
    };
  }

  /**
   * Init plugins
   *
   * @protected
   */
  initPlugins() {
    this.addMetricsPlugins();
    this.addPlugins();
    PluginManager.getInstance().init();
  }

  /**
   * Tasks that should run after plugins have finished loading.
   *
   * @param {?GoogEvent=} opt_e The optional event
   * @protected
   */
  onPluginsLoaded(opt_e) {
    // send browser info metric
    Metrics.getInstance().updateMetric(BROWSER + '.' + browserVersion(), 1);
    Metrics.getInstance().updateMetric(operatingSystem(), 1);
    this.scope['pluginsReady'] = true;
    Timer.clear(this.pluginLoadingTimer_);
    this.scope['pluginsLoading'] = false;
    apply(this.scope);

    this.initXt();
  }

  /**
   * Add the plugins for this app
   * @protected
   */
  addPlugins() {
    /* const pm = PluginManager.getInstance();
    pm.addPlugin(new ElectronPlugin()); */
  }

  /**
   * What we do when the window closes
   * @protected
   */
  onClose() {}

  /**
   * @param {Object} event
   * @protected
   */
  onLogWindow(event) {}

  /**
   * Registers event listeners for the controller.
   * @protected
   */
  registerListeners() {}

  /**
   * Removes event listeners for the controller.
   * @protected
   */
  removeListeners() {}

  /**
   * Initialize the peer
   * @protected
   */
  initXt() {}

  /**
   * Add the metrics plugins for this app
   * @protected
   */
  addMetricsPlugins() {}
}
