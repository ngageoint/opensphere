goog.provide('os.ui.draw.DrawControlsCtrl');
goog.provide('os.ui.draw.drawControlsDirective');
goog.require('os.ui.draw.DrawControlsUI');

/**
 * @type {function(new: os.ui.draw.DrawControlsUI.Controller, ...)}
 * @deprecated Please use goog.require('os.ui.draw.DrawControlsUI').Controller instead.
 */
os.ui.draw.DrawControlsCtrl = os.ui.draw.DrawControlsUI.Controller;

/**
 * @deprecated Please use goog.require('os.ui.draw.DrawControlsUI').directive instead.
 */
os.ui.draw.drawControlsDirective = os.ui.draw.DrawControlsUI.directive;
