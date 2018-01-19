goog.provide('os.ui.help');
goog.provide('os.ui.help.EventType');
goog.provide('os.ui.help.HelpCtrl');
goog.provide('os.ui.help.helpDirective');

goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.config.Settings');
goog.require('os.defines');
goog.require('os.ui');
goog.require('os.ui.EventType');
goog.require('os.ui.Module');
goog.require('os.ui.events.UIEvent');
goog.require('os.ui.help.controlsDirective');
goog.require('os.ui.menu.Menu');
goog.require('os.ui.menu.MenuButtonCtrl');
goog.require('os.ui.menu.MenuItem');
goog.require('os.ui.menu.MenuItemType');
goog.require('os.ui.menu.windows');
goog.require('os.ui.modal.aboutModalDirective');
goog.require('os.ui.onboarding.OnboardingManager');
goog.require('os.ui.util.ResetSettings');


/**
 * @enum {string}
 */
os.ui.help.EventType = {
  ABOUT: 'about',
  CONTROLS: 'controlsHelp',
  HELP: 'help',
  HELP_VIDEO: 'help_video',
  SHOW_TIPS: 'showTips',
  VIDEO_CARD: 'videoCard',
  VIEW_ALERTS: 'viewAlerts',
  VIEW_LOG: 'viewLog'
};


/**
 * Application help menu.
 * @type {os.ui.menu.Menu<undefined>}
 */
os.ui.help.MENU = new os.ui.menu.Menu(new os.ui.menu.MenuItem({
  type: os.ui.menu.MenuItemType.ROOT,
  children: []
}));


/**
 * A directive to display the help menu
 * @return {angular.Directive}
 */
os.ui.help.helpDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'showLabel': '='
    },
    templateUrl: os.ROOT + 'views/help/help.html',
    controller: os.ui.help.HelpCtrl,
    controllerAs: 'help'
  };
};


/**
 * Register the directive.
 */
os.ui.Module.directive('help', [os.ui.help.helpDirective]);


/**
 * Controller for the help directive.
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @extends {os.ui.menu.MenuButtonCtrl}
 * @constructor
 * @ngInject
 */
os.ui.help.HelpCtrl = function($scope, $element) {
  os.ui.help.HelpCtrl.base(this, 'constructor', $scope, $element);
  this.menu = os.ui.help.MENU;

  /**
   * The logger.
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = os.ui.help.HelpCtrl.LOGGER_;

  this.initialize();
};
goog.inherits(os.ui.help.HelpCtrl, os.ui.menu.MenuButtonCtrl);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.help.HelpCtrl.LOGGER_ = goog.log.getLogger('os.ui.help.HelpCtrl');


/**
 * @inheritDoc
 */
os.ui.help.HelpCtrl.prototype.disposeInternal = function() {
  os.ui.help.HelpCtrl.base(this, 'disposeInternal');

  this.menu.removeAllListeners();
  this.menu = undefined;
};


/**
 * Initialize the help menu.
 * @protected
 */
os.ui.help.HelpCtrl.prototype.initialize = function() {
  var appName = os.config.getAppName('the application');
  var root = this.menu.getRoot();

  var helpUrl = /** @type {string} */ (os.settings.get('helpPagesUrl'));
  if (helpUrl) {
    root.addChild({
      label: 'Help Pages',
      eventType: os.ui.help.EventType.HELP,
      tooltip: 'View help pages for ' + appName,
      icons: ['<i class="fa fa-fw fa-question-circle"></i>'],
      sort: 10
    });

    this.menu.listen(os.ui.help.EventType.HELP, this.onHelpAction_, false, this);
  }

  var videoUrl = /** @type {string} */ (os.settings.get('helpVideoUrl'));
  if (videoUrl) {
    root.addChild({
      eventType: os.ui.help.EventType.HELP_VIDEO,
      label: 'Help Videos',
      tooltip: 'View help videos for ' + appName,
      icons: ['<i class="fa fa-fw fa-question-circle"></i>'],
      sort: 20
    });
    this.menu.listen(os.ui.help.EventType.HELP_VIDEO, this.onHelpAction_, false, this);
  }

  root.addChild({
    type: os.ui.menu.MenuItemType.SEPARATOR,
    sort: 100
  });

  root.addChild({
    eventType: os.ui.help.EventType.ABOUT,
    label: 'About',
    tooltip: 'About ' + appName,
    icons: ['<i class="fa fa-fw fa-info-circle"></i>'],
    sort: 101
  });
  this.menu.listen(os.ui.help.EventType.ABOUT, this.onHelpAction_, false, this);

  // If there are controls set, display them
  if (!goog.object.isEmpty(os.ui.help.Controls.getInstance().getControls())) {
    root.addChild({
      eventType: os.ui.help.EventType.CONTROLS,
      label: 'Controls',
      tooltip: 'Keyboard and mouse controls',
      icons: ['<i class="fa fa-fw fa-keyboard-o"></i>'],
      sort: 110
    });
    this.menu.listen(os.ui.help.EventType.CONTROLS, this.onHelpAction_, false, this);
  }

  var videoCardUrl = os.ui.help.getVideoCardHelpUrl_();
  if (videoCardUrl) {
    root.addChild({
      eventType: os.ui.help.EventType.VIDEO_CARD,
      label: 'Graphics Card Help',
      tooltip: 'Troubleshoot 3D view',
      icons: ['<i class="fa fa-fw fa-desktop"></i>'],
      sort: 120
    });
    this.menu.listen(os.ui.help.EventType.VIDEO_CARD, function() {
      window.open(videoCardUrl);
    }, false, this);
  }

  if (os.settings.get('onboarding') && os.settings.get('onboarding')['hideTips'] !== true) {
    root.addChild({
      eventType: os.ui.help.EventType.SHOW_TIPS,
      label: 'Show Tips',
      tooltip: 'Reset help tips, and show the initial set of tips',
      icons: ['<i class="fa fa-fw fa-question"></i>'],
      sort: 130
    });
    this.menu.listen(os.ui.help.EventType.SHOW_TIPS, this.onHelpAction_, false, this);
  }

  root.addChild({
    eventType: os.ui.help.EventType.VIEW_ALERTS,
    label: 'View Alerts',
    tooltip: 'Display the alert log',
    icons: ['<i class="fa fa-fw fa-bell"></i>'],
    sort: 140
  });
  os.dispatcher.listen(os.ui.help.EventType.VIEW_ALERTS, os.ui.help.showAlertsWindow_);
  this.menu.listen(os.ui.help.EventType.VIEW_ALERTS, this.onHelpAction_, false, this);

  root.addChild({
    eventType: os.ui.help.EventType.VIEW_LOG,
    label: 'View Log',
    tooltip: 'Display the application log',
    icons: ['<i class="fa fa-fw fa-terminal"></i>'],
    sort: 150
  });
  this.menu.listen(os.ui.help.EventType.VIEW_LOG, this.onHelpAction_, false, this);

  root.addChild(os.ui.util.resetSettingsOptions);
  this.menu.listen(os.ui.EventType.DISPLAY_CLEAR_LOCALSTORAGE, function() {
    os.ui.util.resetSettings();
  });
};


/**
 * Handle help events.
 * @param {os.ui.action.ActionEvent} event
 * @private
 */
os.ui.help.HelpCtrl.prototype.onHelpAction_ = function(event) {
  switch (event.type) {
    case os.ui.help.EventType.ABOUT:
      os.ui.modal.AboutModalCtrl.launch();
      break;
    case os.ui.help.EventType.SHOW_TIPS:
      // enable onboarding and reset so none are flagged as being viewed
      os.settings.set('onboarding', {'showOnboarding': true});

      // launch the initial onboarding
      var initialOnboarding = /** @type {string} */ (os.settings.get('initialOnboarding'));
      if (initialOnboarding) {
        var initialPath = os.ui.onboarding.OnboardingManager.PATH + initialOnboarding;
        os.ui.onboarding.OnboardingManager.getInstance().displayOnboarding(initialPath);
      }
      break;
    case os.ui.help.EventType.HELP:
      var helpUrl = /** @type {string} */ (os.settings.get('helpPagesUrl'));
      window.open(helpUrl);
      break;
    case os.ui.help.EventType.VIEW_LOG:
      this.scope.$emit(os.ui.help.EventType.VIEW_LOG);
      break;
    case os.ui.help.EventType.VIEW_ALERTS:
      this.scope.$emit(os.ui.help.EventType.VIEW_ALERTS);
      break;
    case os.ui.help.EventType.HELP_VIDEO:
      var videoUrl = /** @type {string} */ (os.settings.get('helpVideoUrl'));
      window.open(videoUrl);
      break;
    case os.ui.help.EventType.CONTROLS:
      os.ui.help.ControlsCtrl.launch();
      break;
    default:
      break;
  }
};


/**
 * Show the Alerts window.
 * @private
 */
os.ui.help.showAlertsWindow_ = function() {
  var flag = 'alerts';
  if (flag && !os.ui.menu.windows.openWindow(flag)) {
    var evt = new os.ui.events.UIEvent(os.ui.events.UIEventType.TOGGLE_UI, flag);
    os.dispatcher.dispatchEvent(evt);
  }
};


/**
 * Retrieve the URL for video card help
 * @return {string}
 * @private
 */
os.ui.help.getVideoCardHelpUrl_ = function() {
  return /** @type {string} */ (os.settings.get('helpVideoCardUrl'));
};
