goog.provide('os.ui.window.confirmColumnDirective');
goog.require('os.ui.window');
goog.require('os.ui.window.ConfirmColumnUI');

/**
 * @type {function(!osx.window.ConfirmColumnOptions)}
 * @deprecated Please use os.ui.window.ConfirmColumnUI.launchConfirmColumn.
 */
os.ui.window.launchConfirmColumn = os.ui.window.ConfirmColumnUI.launchConfirmColumn;
