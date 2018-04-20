goog.provide('os.ui.history.HistoryViewCtrl');

goog.require('os.command.CommandEvent');
goog.require('os.command.CommandProcessor');
goog.require('os.command.ICommand');
goog.require('os.ui');
goog.require('os.ui.WindowEventType');
goog.require('os.ui.window');



/**
 * Controller function for the history-view directive.
 * @param {angular.Scope} $scope
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
os.ui.history.HistoryViewCtrl = function($scope, $timeout) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {?angular.$timeout}
   * @private
   */
  this.timeout_ = $timeout;

  /**
   * Reference to the command processor singleton, used for receiving command events
   * @type {os.command.CommandProcessor}
   * @private
   */
  this.cp_ = os.command.CommandProcessor.getInstance();
  this.cp_.listen(os.command.EventType.COMMAND_ADDED, this.commandAdded_, false, this);
  this.cp_.listen(os.command.EventType.COMMAND_EXECUTING, this.commandExecuting_, false, this);
  this.cp_.listen(os.command.EventType.COMMAND_EXECUTED, this.commandExecuted_, false, this);
  this.cp_.listen(os.command.EventType.COMMAND_REVERTING, this.commandReverting_, false, this);
  this.cp_.listen(os.command.EventType.COMMAND_REVERTED, this.commandReverted_, false, this);
  this.cp_.listen(os.command.EventType.HISTORY_LIMIT_CHANGED, this.limitChanged_, false, this);

  /**
   * Whether the history window is showing or not
   * @type {boolean}
   */
  this['showHistoryView'] = false;

  /**
   * The current index of the command in the command stack
   * @type {number}
   */
  this['current'] = this.cp_.getCurrent();

  /**
   * The history index of the current processing command
   * @type {boolean}
   */
  this['processingIndex'] = -1;

  /**
   * A command that will be added pending successful execution
   * @type {os.command.ICommand}
   */
  this['newCommand'] = null;

  /**
   * Array of commands executed by the command processor
   * @type {Array.<os.command.CommandEvent>}
   */
  this['commandHistory'] = this.cp_.getHistory();

  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clear references to Angular/DOM elements.
 * @private
 */
os.ui.history.HistoryViewCtrl.prototype.destroy_ = function() {
  this.cp_.unlisten(os.command.EventType.COMMAND_ADDED, this.commandAdded_, false, this);
  this.cp_.unlisten(os.command.EventType.COMMAND_EXECUTING, this.commandExecuting_, false, this);
  this.cp_.unlisten(os.command.EventType.COMMAND_EXECUTED, this.commandExecuted_, false, this);
  this.cp_.unlisten(os.command.EventType.COMMAND_REVERTING, this.commandReverting_, false, this);
  this.cp_.unlisten(os.command.EventType.COMMAND_REVERTED, this.commandReverted_, false, this);
  this.cp_.unlisten(os.command.EventType.HISTORY_LIMIT_CHANGED, this.limitChanged_, false, this);

  this.timeout_ = null;
  this.scope_ = null;
};


/**
 * Prompts the user to clear the application history.
 */
os.ui.history.HistoryViewCtrl.prototype.clearHistory = function() {
  os.ui.window.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
    confirm: this.clearHistoryInternal_.bind(this),
    prompt: 'Are you sure you want to clear the application history? This action cannot be undone.',
    yesText: 'Clear',
    yesIcon: 'fa fa-trash-o',
    yesButtonClass: 'btn-danger',
    noText: 'Cancel',
    noIcon: 'fa fa-ban',
    windowOptions: {
      'label': 'Clear History',
      'icon': 'fa fa-trash-o',
      'headerClass': 'bg-danger u-bg-danger-text',
      'x': 'center',
      'y': 'center',
      'width': '325',
      'height': 'auto',
      'modal': 'true',
      'noScroll': 'true'
    }
  }));
};
goog.exportProperty(
    os.ui.history.HistoryViewCtrl.prototype,
    'clearHistory',
    os.ui.history.HistoryViewCtrl.prototype.clearHistory);


/**
 * Clears application history.
 * @private
 */
os.ui.history.HistoryViewCtrl.prototype.clearHistoryInternal_ = function() {
  var oldLimit = this.cp_.getHistoryLimit();
  this.cp_.setHistoryLimit(0);
  this.cp_.setHistoryLimit(oldLimit);
};


/**
 * Toggles the history view
 */
os.ui.history.HistoryViewCtrl.prototype.toggleHistoryView = function() {
  this['showHistoryView'] = !this['showHistoryView'];
};
goog.exportProperty(
    os.ui.history.HistoryViewCtrl.prototype,
    'toggleHistoryView',
    os.ui.history.HistoryViewCtrl.prototype.toggleHistoryView);


/**
 * Called on clicking an element in the history view. Takes the index of the
 * clicked item and calls os.command.CommandProcessor.setIndex() with the
 * index as the argument.  Also manipulates the DOM to highlight that item.
 * @param {number} index
 */
os.ui.history.HistoryViewCtrl.prototype.setIndex = function(index) {
  if (this['current'] == index) {
    return;
  }
  this.scope_.$emit('historyProcessing', true);
  this.cp_.setIndex(index);
};
goog.exportProperty(
    os.ui.history.HistoryViewCtrl.prototype,
    'setIndex',
    os.ui.history.HistoryViewCtrl.prototype.setIndex);


/**
 * Called when a command is added to the Command Processor.  This adds the command
 * to the historyview and handles whether or not to slice off elements at the top
 * of the queue if the queue is currently not at the most recent command
 * @param {os.command.CommandEvent} e
 * @private
 */
os.ui.history.HistoryViewCtrl.prototype.commandAdded_ = function(e) {
  this.timeout_(goog.bind(function() {
    this['current'] = this.cp_.getCurrent();

    var objDiv = document.getElementById('js-history__scroll');
    objDiv.scrollTop = objDiv.scrollHeight;
  }, this));
};


/**
 * Fires when the command processor begins executing an event. Sets processing
 * to true which starts the spinner icons if the command is asynchronous. Also
 * sets the current index.
 * @param {os.command.CommandEvent} e The event
 * @private
 */
os.ui.history.HistoryViewCtrl.prototype.commandExecuting_ = function(e) {
  this.timeout_(goog.bind(function() {
    if (this['current'] == this['commandHistory'].length - 1) {
      this['newCommand'] = e.getCommand();
    } else {
      this['processingIndex'] = this['current'] + 1;
    }
    this.scope_.$emit('historyProcessing', true);
  }, this));
};


/**
 * Fires when the command processor begins reverting an event. Sets processing
 * to true which starts the spinner icons if the command is asynchronous. Also
 * sets the current index
 * @param {os.command.CommandEvent} e The event
 * @private
 */
os.ui.history.HistoryViewCtrl.prototype.commandReverting_ = function(e) {
  this.timeout_(goog.bind(function() {
    this['processingIndex'] = this['current'] = this.cp_.getCurrent();
    this.scope_.$emit('historyProcessing', true);
  }, this));
};


/**
 * Fires when the command processor finishes executing an event. Sets processing
 * to false which stops the spinner icons if the command is asynchronous. Also
 * sets the current index.
 * @param {goog.events.Event} e The event
 * @private
 */
os.ui.history.HistoryViewCtrl.prototype.commandExecuted_ = function(e) {
  this.timeout_(goog.bind(function() {
    this['newCommand'] = null;
    this['processingIndex'] = -1;
    this['current'] = this.cp_.getCurrent();
    this.scope_.$emit('historyProcessing', false);
  }, this));
};


/**
 * Fires when the command processor finishes reverting an event. Sets processing
 * to false which stops the spinner icons if the command is asynchronous. Also
 * sets the current index.
 * @param {goog.events.Event} e The event
 * @private
 */
os.ui.history.HistoryViewCtrl.prototype.commandReverted_ = function(e) {
  this.timeout_(goog.bind(function() {
    this['processingIndex'] = -1;
    this['current'] = this.cp_.getCurrent();
    this.scope_.$emit('historyProcessing', false);
  }, this));
};


/**
 * Fires when the command processor changes the history size limit.
 * @param {goog.events.Event} e The event
 * @private
 */
os.ui.history.HistoryViewCtrl.prototype.limitChanged_ = function(e) {
  this.timeout_(goog.bind(function() {
    var objDiv = document.getElementById('historyScroll');
    objDiv.scrollTop = this['commandHistory'].length > 0 ? objDiv.scrollHeight : 0;
  }, this));
};
