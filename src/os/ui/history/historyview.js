goog.declareModuleId('os.ui.history.HistoryViewUI');

import {ROOT} from '../../os.js';
import Module from '../module.js';
import * as ConfirmUI from '../window/confirm.js';
const CommandProcessor = goog.require('os.command.CommandProcessor');
const EventType = goog.require('os.command.EventType');

const GoogEvent = goog.requireType('goog.events.Event');
const CommandEvent = goog.requireType('os.command.CommandEvent');
const ICommand = goog.requireType('os.command.ICommand');


/**
 * The history directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/windows/history.html',
  controller: Controller,
  controllerAs: 'historyView'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'history';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the history-view directive.
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {angular.Scope} $scope
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $timeout) {
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
     * @type {CommandProcessor}
     * @private
     */
    this.cp_ = CommandProcessor.getInstance();
    this.cp_.listen(EventType.COMMAND_ADDED, this.commandAdded_, false, this);
    this.cp_.listen(EventType.COMMAND_EXECUTING, this.commandExecuting_, false, this);
    this.cp_.listen(EventType.COMMAND_EXECUTED, this.commandExecuted_, false, this);
    this.cp_.listen(EventType.COMMAND_REVERTING, this.commandReverting_, false, this);
    this.cp_.listen(EventType.COMMAND_REVERTED, this.commandReverted_, false, this);
    this.cp_.listen(EventType.HISTORY_LIMIT_CHANGED, this.limitChanged_, false, this);

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
     * @type {ICommand}
     */
    this['newCommand'] = null;

    /**
     * Array of commands executed by the command processor
     * @type {Array<CommandEvent>}
     */
    this['commandHistory'] = this.cp_.getHistory();

    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Clear references to Angular/DOM elements.
   *
   * @private
   */
  destroy_() {
    this.cp_.unlisten(EventType.COMMAND_ADDED, this.commandAdded_, false, this);
    this.cp_.unlisten(EventType.COMMAND_EXECUTING, this.commandExecuting_, false, this);
    this.cp_.unlisten(EventType.COMMAND_EXECUTED, this.commandExecuted_, false, this);
    this.cp_.unlisten(EventType.COMMAND_REVERTING, this.commandReverting_, false, this);
    this.cp_.unlisten(EventType.COMMAND_REVERTED, this.commandReverted_, false, this);
    this.cp_.unlisten(EventType.HISTORY_LIMIT_CHANGED, this.limitChanged_, false, this);

    this.timeout_ = null;
    this.scope_ = null;
  }

  /**
   * Prompts the user to clear the application history.
   *
   * @export
   */
  clearHistory() {
    ConfirmUI.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
      confirm: this.clearHistoryInternal_.bind(this),
      prompt: 'Are you sure you want to clear the application history? This action cannot be undone.',
      yesText: 'Clear',
      yesIcon: 'fa fa-trash-o',
      yesButtonClass: 'btn-danger',
      windowOptions: {
        'label': 'Clear History',
        'icon': 'fa fa-trash-o',
        'x': 'center',
        'y': 'center',
        'width': '325',
        'height': 'auto',
        'modal': 'true',
        'headerClass': 'bg-danger u-bg-danger-text'
      }
    }));
  }

  /**
   * Clears application history.
   *
   * @private
   */
  clearHistoryInternal_() {
    var oldLimit = this.cp_.getHistoryLimit();
    this.cp_.setHistoryLimit(0);
    this.cp_.setHistoryLimit(oldLimit);
  }

  /**
   * Toggles the history view
   *
   * @export
   */
  toggleHistoryView() {
    this['showHistoryView'] = !this['showHistoryView'];
  }

  /**
   * Called on clicking an element in the history view. Takes the index of the
   * clicked item and calls CommandProcessor.setIndex() with the
   * index as the argument.  Also manipulates the DOM to highlight that item.
   *
   * @param {number} index
   * @export
   */
  setIndex(index) {
    if (this['current'] == index) {
      return;
    }
    this.scope_.$emit('historyProcessing', true);
    this.cp_.setIndex(index);
  }

  /**
   * Called when a command is added to the Command Processor.  This adds the command
   * to the historyview and handles whether or not to slice off elements at the top
   * of the queue if the queue is currently not at the most recent command
   *
   * @param {CommandEvent} e
   * @private
   */
  commandAdded_(e) {
    this.timeout_(function() {
      this['current'] = this.cp_.getCurrent();

      var objDiv = document.getElementById('js-history__scroll');
      objDiv.scrollTop = objDiv.scrollHeight;
    }.bind(this));
  }

  /**
   * Fires when the command processor begins executing an event. Sets processing
   * to true which starts the spinner icons if the command is asynchronous. Also
   * sets the current index.
   *
   * @param {CommandEvent} e The event
   * @private
   */
  commandExecuting_(e) {
    this.timeout_(function() {
      if (this['current'] == this['commandHistory'].length - 1) {
        this['newCommand'] = e.getCommand();
      } else {
        this['processingIndex'] = this['current'] + 1;
      }
      this.scope_.$emit('historyProcessing', true);
    }.bind(this));
  }

  /**
   * Fires when the command processor begins reverting an event. Sets processing
   * to true which starts the spinner icons if the command is asynchronous. Also
   * sets the current index
   *
   * @param {CommandEvent} e The event
   * @private
   */
  commandReverting_(e) {
    this.timeout_(function() {
      this['processingIndex'] = this['current'] = this.cp_.getCurrent();
      this.scope_.$emit('historyProcessing', true);
    }.bind(this));
  }

  /**
   * Fires when the command processor finishes executing an event. Sets processing
   * to false which stops the spinner icons if the command is asynchronous. Also
   * sets the current index.
   *
   * @param {GoogEvent} e The event
   * @private
   */
  commandExecuted_(e) {
    this.timeout_(function() {
      this['newCommand'] = null;
      this['processingIndex'] = -1;
      this['current'] = this.cp_.getCurrent();
      this.scope_.$emit('historyProcessing', false);
    }.bind(this));
  }

  /**
   * Fires when the command processor finishes reverting an event. Sets processing
   * to false which stops the spinner icons if the command is asynchronous. Also
   * sets the current index.
   *
   * @param {GoogEvent} e The event
   * @private
   */
  commandReverted_(e) {
    this.timeout_(function() {
      this['processingIndex'] = -1;
      this['current'] = this.cp_.getCurrent();
      this.scope_.$emit('historyProcessing', false);
    }.bind(this));
  }

  /**
   * Fires when the command processor changes the history size limit.
   *
   * @param {GoogEvent} e The event
   * @private
   */
  limitChanged_(e) {
    this.timeout_(function() {
      var objDiv = document.getElementById('historyScroll');
      if (objDiv) {
        objDiv.scrollTop = this['commandHistory'].length > 0 ? objDiv.scrollHeight : 0;
      }
    }.bind(this));
  }
}
