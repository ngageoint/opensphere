goog.provide('os.ui.wiz.WizardCtrl');
goog.provide('os.ui.wiz.wizardDirective');
goog.require('os.ui.wiz.WizardUI');

/**
 * @type {function(new: os.ui.wiz.WizardUI.Controller, ...)}
 * @deprecated Please use goog.require('os.ui.wiz.WizardUI').Controller instead.
 */
os.ui.wiz.WizardCtrl = os.ui.wiz.WizardUI.Controller;

/**
 * @deprecated Please use goog.require('os.ui.wiz.WizardUI').directive instead.
 */
os.ui.wiz.wizardDirective = os.ui.wiz.WizardUI.directive;
