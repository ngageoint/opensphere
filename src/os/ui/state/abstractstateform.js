goog.module('os.ui.state.AbstractStateFormCtrl');

goog.require('os.ui.state.stateTitleDirective');

const {close} = goog.require('os.ui.window');

const IPersistenceMethod = goog.requireType('os.ex.IPersistenceMethod');
const IState = goog.requireType('os.state.IState');


/**
 * Abstract controller for state forms.
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    /**
     * @type {?angular.JQLite}
     * @protected
     */
    this.element = $element;

    /**
     * ng-model to toggle all states on/off
     * @type {boolean}
     */
    this['all'] = false;

    /**
     * @type {IPersistenceMethod}
     */
    this['persister'] = null;

    /**
     * @type {Object<string, IPersistenceMethod>}
     */
    this['persisters'] = {};

    /**
     * ng-model for the 'Choose which parts to import/save' checkbox
     * @type {boolean}
     */
    this['showOptions'] = false;

    /**
     * states to show in the chooser
     * @type {Array<IState>}
     */
    this['states'] = [];

    /**
     * if this is a form to save state - determines language used in the form
     * @type {boolean}
     */
    this['isSaving'] = false;

    $scope.$on('$destroy', this.onDestroy.bind(this));
  }

  /**
   * Clean up references/listeners.
   *
   * @protected
   */
  onDestroy() {
    this.scope = null;
    this.element = null;
  }

  /**
   * Save the state
   *
   * @export
   */
  accept() {
    this.close();
  }

  /**
   * Close the window
   *
   * @export
   */
  close() {
    close(this.element);
  }

  /**
   * Toggle all options
   *
   * @export
   */
  toggleAll() {
    for (var i = 0, n = this['states'].length; i < n; i++) {
      if (this['states'][i].getSupported()) {
        this['states'][i].setEnabled(this['all']);
      }
    }
  }

  /**
   * Get the state's description.
   *
   * @param {IState} state The state
   * @return {string} The description
   * @export
   */
  getDescription(state) {
    var description = state.getDescription();
    if (!this['isSaving']) {
      description = description.replace('Saves', 'Sets');
    }

    return description;
  }

  /**
   * Get the state's title.
   *
   * @param {IState} state The state
   * @return {string} The title
   * @export
   */
  getTitle(state) {
    return state.getTitle();
  }
}

exports = Controller;
