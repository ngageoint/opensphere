goog.provide('os.ui.datetime.StartEndDateCtrl');
goog.provide('os.ui.datetime.startEndDateDirective');
goog.require('os.ui.datetime.StartEndDateUI');

/**
 * @type {function(new: os.ui.datetime.StartEndDateUI.Controller, ...)}
 * @deprecated Please use goog.require('os.ui.datetime.StartEndDateUI').Controller instead.
 */
os.ui.datetime.StartEndDateCtrl = os.ui.datetime.StartEndDateUI.Controller;

/**
 * @deprecated Please use goog.require('os.ui.datetime.StartEndDateUI').directive instead.
 */
os.ui.datetime.startEndDateDirective = os.ui.datetime.StartEndDateUI.directive;
