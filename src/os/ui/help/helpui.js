goog.module('os.ui.help.HelpUI');
goog.module.declareLegacyNamespace();

const log = goog.require('goog.log');
const {isEmpty} = goog.require('goog.object');
const dispatcher = goog.require('os.Dispatcher');
const {getAppName} = goog.require('os.config');
const Settings = goog.require('os.config.Settings');
const {DISPLAY_CLEAR_LOCALSTORAGE} = goog.require('os.ui.EventType');
const Module = goog.require('os.ui.Module');
const {MENU, showWindow} = goog.require('os.ui.help');
const Controls = goog.require('os.ui.help.Controls');
const {launchControlsHelp} = goog.require('os.ui.help.ControlsUI');
const EventType = goog.require('os.ui.help.EventType');
const MenuButtonCtrl = goog.require('os.ui.menu.MenuButtonCtrl');
const MenuItemType = goog.require('os.ui.menu.MenuItemType');
const {launchAboutModal} = goog.require('os.ui.modal.AboutModalUI');
const OnboardingManager = goog.require('os.ui.onboarding.OnboardingManager');
const ResetSettings = goog.require('os.ui.util.ResetSettings');

const Logger = goog.requireType('goog.log.Logger');
const ActionEvent = goog.requireType('os.ui.action.ActionEvent');


/**
 * A directive to display the help menu
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  controller: Controller,
  controllerAs: 'ctrl',
  template: '<button class="btn btn-info" ng-class="{\'dropdown-toggle\': !puny}" title="Support"' +
      ' ng-click="ctrl.openMenu()" ng-right-click="ctrl.openMenu()" ng-class="{active: menu}">' +
      '<i class="fa fa-question-circle" ng-class="{\'fa-fw\': puny}"></i> ' +
      '<span ng-class="{\'d-none\': puny}">Support</span>' +
      '</button>'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'help';

/**
 * Register the directive.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the help directive.
 * @unrestricted
 */
class Controller extends MenuButtonCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);
    this.menu = MENU;

    /**
     * The logger.
     * @type {Logger}
     * @protected
     */
    this.log = logger;

    this.initialize();
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    this.menu.removeAllListeners();
    this.menu = undefined;
  }

  /**
   * Initialize the help menu.
   *
   * @protected
   */
  initialize() {
    var appName = getAppName('the application');
    var root = this.menu.getRoot();

    var videoUrl = /** @type {string} */ (Settings.getInstance().get('helpVideoUrl'));
    if (videoUrl) {
      root.addChild({
        eventType: EventType.HELP_VIDEO,
        label: 'Help Videos',
        tooltip: 'View help videos for ' + appName,
        icons: ['<i class="fa fa-fw fa-question-circle"></i>'],
        sort: 20
      });
      this.menu.listen(EventType.HELP_VIDEO, this.onHelpAction_, false, this);
    }

    root.addChild({
      type: MenuItemType.SEPARATOR,
      sort: 100
    });

    root.addChild({
      eventType: EventType.ABOUT,
      label: 'About',
      tooltip: 'About ' + appName,
      icons: ['<i class="fa fa-fw fa-info-circle"></i>'],
      sort: 101
    });
    this.menu.listen(EventType.ABOUT, this.onHelpAction_, false, this);

    // If there are controls set, display them
    if (!isEmpty(Controls.getInstance().getControls())) {
      root.addChild({
        eventType: EventType.CONTROLS,
        label: 'Controls',
        tooltip: 'Keyboard and mouse controls',
        icons: ['<i class="fa fa-fw fa-keyboard-o"></i>'],
        sort: 110
      });
      this.menu.listen(EventType.CONTROLS, this.onHelpAction_, false, this);
    }

    var videoCardUrl = getVideoCardHelpUrl();
    if (videoCardUrl) {
      root.addChild({
        eventType: EventType.VIDEO_CARD,
        label: 'Graphics Card Help',
        tooltip: 'Troubleshoot 3D view',
        icons: ['<i class="fa fa-fw fa-desktop"></i>'],
        sort: 120
      });
      this.menu.listen(EventType.VIDEO_CARD, () => {
        window.open(videoCardUrl);
      }, false);
    }

    if (Settings.getInstance().get('onboarding') && Settings.getInstance().get('onboarding')['hideTips'] !== true) {
      root.addChild({
        eventType: EventType.SHOW_TIPS,
        label: 'Show Tips',
        tooltip: 'Reset help tips, and show the initial set of tips',
        icons: ['<i class="fa fa-fw fa-question"></i>'],
        sort: 130
      });
      this.menu.listen(EventType.SHOW_TIPS, this.onHelpAction_, false, this);
    }

    root.addChild({
      eventType: EventType.VIEW_ALERTS,
      label: 'View Alerts',
      tooltip: 'Display the alert log',
      icons: ['<i class="fa fa-fw fa-bell"></i>'],
      sort: 140
    });
    dispatcher.getInstance().listen(EventType.VIEW_ALERTS, showAlertsWindow);
    this.menu.listen(EventType.VIEW_ALERTS, this.onHelpAction_, false, this);

    root.addChild({
      eventType: EventType.VIEW_LOG,
      label: 'View Log',
      tooltip: 'Display the application log',
      icons: ['<i class="fa fa-fw fa-terminal"></i>'],
      sort: 150
    });
    this.menu.listen(EventType.VIEW_LOG, this.onHelpAction_, false, this);


    root.addChild(ResetSettings.resetSettingsOptions);
    this.menu.listen(DISPLAY_CLEAR_LOCALSTORAGE, function() {
      ResetSettings.resetSettings();
    });
  }

  /**
   * Handle help events.
   *
   * @param {ActionEvent} event
   * @private
   */
  onHelpAction_(event) {
    switch (event.type) {
      case EventType.ABOUT:
        launchAboutModal();
        break;
      case EventType.SHOW_TIPS:
        // enable onboarding and reset so none are flagged as being viewed
        Settings.getInstance().set('onboarding', {'showOnboarding': true});

        // launch the initial onboarding
        var initialOnboarding = /** @type {string} */ (Settings.getInstance().get('initialOnboarding'));
        if (initialOnboarding) {
          var initialPath = OnboardingManager.PATH + initialOnboarding;
          OnboardingManager.getInstance().displayOnboarding(initialPath);
        }
        break;
      case EventType.VIEW_LOG:
        this.scope.$emit(EventType.VIEW_LOG);
        break;
      case EventType.VIEW_ALERTS:
        this.scope.$emit(EventType.VIEW_ALERTS);
        break;
      case EventType.HELP_VIDEO:
        var videoUrl = /** @type {string} */ (Settings.getInstance().get('helpVideoUrl'));
        window.open(videoUrl);
        break;
      case EventType.CONTROLS:
        launchControlsHelp();
        break;
      default:
        break;
    }
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.help.HelpUI');

/**
 * Show the Alerts window.
 *
 */
const showAlertsWindow = function() {
  showWindow('alerts');
};

/**
 * Retrieve the URL for video card help
 *
 * @return {string}
 */
const getVideoCardHelpUrl = function() {
  return /** @type {string} */ (Settings.getInstance().get('helpVideoCardUrl'));
};

exports = {
  Controller,
  directive,
  directiveTag
};
