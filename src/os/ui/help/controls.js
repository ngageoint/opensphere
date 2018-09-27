goog.provide('os.ui.help.Controls');
goog.provide('os.ui.help.ControlsCtrl');
goog.provide('os.ui.help.controlsDirective');

goog.require('goog.events.KeyCodes');
goog.require('goog.events.KeyNames');
goog.require('os.ui');
goog.require('os.ui.Module');
goog.require('os.ui.window');


/**
 * A directive to display the help menu
 * @return {angular.Directive}
 */
os.ui.help.controlsDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/help/controls.html',
    controller: os.ui.help.ControlsCtrl,
    controllerAs: 'controlsHelp'
  };
};


/**
 * Register the directive.
 */
os.ui.Module.directive('controlshelp', [os.ui.help.controlsDirective]);



/**
 * Display the controls for this application
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.help.ControlsCtrl = function($scope) {
  var controls = os.ui.help.Controls.getInstance().getControls();
  goog.array.sort(controls, function(a, b) {
    return a['order'] > b['order'] ? 1 : a['order'] < b['order'] ? -1 : 0;
  });

  var splitIndex = (controls.length / 2) + 1;

  /**
   * List of controls
   * @type {Object}
   */
  this['controls'] = {
    'left': goog.array.slice(controls, 0, splitIndex),
    'right': goog.array.slice(controls, splitIndex, controls.length)
  };
};


/**
 * Launch the controls window
 */
os.ui.help.ControlsCtrl.launch = function() {
  var id = 'controlsHelp';
  if (os.ui.window.exists(id)) {
    os.ui.window.bringToFront(id);
  } else {
    os.ui.window.create({
      'id': id,
      'x': 'center',
      'y': 'center',
      'label': 'Controls',
      'show-close': true,
      'no-scroll': false,
      'min-width': 850,
      'min-height': 750,
      'max-width': 900,
      'max-height': 800,
      'modal': false,
      'width': 850,
      'height': 750,
      'icon': 'fa fa-keyboard-o'
    }, 'controlshelp');
  }
};


/**
 * Get the key text
 * @param {goog.events.KeyCodes} key
 * @return {string}
 */
os.ui.help.ControlsCtrl.prototype.getKey = function(key) {
  if (key === goog.events.KeyCodes.META && os.isOSX()) {
    return 'Command';
  }

  return goog.string.toTitleCase(goog.events.KeyNames[key]);
};
goog.exportProperty(
    os.ui.help.ControlsCtrl.prototype,
    'getKey',
    os.ui.help.ControlsCtrl.prototype.getKey);


/**
 * Get the key text
 * @param {string} other
 * @return {?string}
 */
os.ui.help.ControlsCtrl.prototype.getMouse = function(other) {
  var mouse = os.ui.help.Controls.MOUSE_IMAGE[other];
  if (mouse) {
    return mouse;
  }
  return null;
};
goog.exportProperty(
    os.ui.help.ControlsCtrl.prototype,
    'getMouse',
    os.ui.help.ControlsCtrl.prototype.getMouse);


/**
 * Get the key text
 * @param {string} other
 * @return {?string}
 */
os.ui.help.ControlsCtrl.prototype.getFont = function(other) {
  var font = os.ui.help.Controls.FONT_CLASS[other];
  if (font) {
    return os.ui.help.Controls.FONT_CLASS[other]['font'];
  }
  return null;
};
goog.exportProperty(
    os.ui.help.ControlsCtrl.prototype,
    'getFont',
    os.ui.help.ControlsCtrl.prototype.getFont);


/**
 * Get the key text
 * @param {string} other
 * @return {?string}
 */
os.ui.help.ControlsCtrl.prototype.getFontClass = function(other) {
  var font = os.ui.help.Controls.FONT_CLASS[other];
  if (font) {
    return os.ui.help.Controls.FONT_CLASS[other]['class'];
  }
  return null;
};
goog.exportProperty(
    os.ui.help.ControlsCtrl.prototype,
    'getFontClass',
    os.ui.help.ControlsCtrl.prototype.getFontClass);



/**
 * Singleton for application to add controls
 * @constructor
 */
os.ui.help.Controls = function() {
  /**
   * List of controls
   * @type {Array}
   * @private
   */
  this.controls_ = [];
};
goog.addSingletonGetter(os.ui.help.Controls);


/**
 * Mouse Pictures
 * @type {Object}
 */
os.ui.help.Controls.MOUSE = {
  LEFT_MOUSE: 'LEFT_MOUSE',
  MIDDLE_MOUSE: 'MIDDLE_MOUSE',
  RIGHT_MOUSE: 'RIGHT_MOUSE'
};


/**
 * Mouse Pictures
 * @type {Object}
 */
os.ui.help.Controls.MOUSE_IMAGE = {
  'LEFT_MOUSE': os.ROOT + 'images/MouseLeft.png',
  'MIDDLE_MOUSE': os.ROOT + 'images/MouseMiddle.png',
  'RIGHT_MOUSE': os.ROOT + 'images/MouseRight.png'
};


/**
 * Mouse Pictures
 * @type {Object}
 */
os.ui.help.Controls.FONT = {
  HORIZONTAL: 'HORIZONTAL',
  VERTICAL: 'VERTICAL',
  ALL: 'ALL',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  UP: 'UP',
  DOWN: 'DOWN'
};


/**
 * Mouse Pictures
 * @type {Object}
 */
os.ui.help.Controls.FONT_CLASS = {
  'HORIZONTAL': {
    'font': 'fa fa-arrows-h',
    'class': 'control-drag'
  },
  'VERTICAL': {
    'font': 'fa fa-arrows-v',
    'class': 'control-drag'
  },
  'ALL': {
    'font': 'fa fa-arrows',
    'class': 'control-drag'
  },
  'LEFT': {
    'font': 'fa fa-long-arrow-left',
    'class': 'control-key'
  },
  'RIGHT': {
    'font': 'fa fa-long-arrow-right',
    'class': 'control-key'
  },
  'UP': {
    'font': 'fa fa-long-arrow-up',
    'class': 'control-key'
  },
  'DOWN': {
    'font': 'fa fa-long-arrow-down',
    'class': 'control-key'
  }
};


/**
 * @return {Array}
 */
os.ui.help.Controls.prototype.getControls = function() {
  return this.controls_;
};


/**
 * Allow application to add controls
 * @param {string} section
 * @param {number} order
 * @param {string} text
 * @param {Array<goog.events.KeyCodes>=} opt_keys
 * @param {Array<string>=} opt_other
 */
os.ui.help.Controls.prototype.addControl = function(section, order, text, opt_keys, opt_other) {
  var ctrlGroup = goog.array.find(this.controls_, function(group) {
    return group['section'] == section;
  });
  if (!ctrlGroup) {
    ctrlGroup = {
      'section': section,
      'order': order,
      'controls': []
    };
    this.controls_.push(ctrlGroup);
  }
  // Add this control to the list of controls
  ctrlGroup.controls.push({
    'text': text,
    'keys': opt_keys,
    'other': opt_other
  });
};
