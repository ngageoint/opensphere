goog.provide('os.ui.feature.FeatureInfoCtrl');
goog.provide('os.ui.feature.featureInfoDirective');
goog.require('os.ui.feature.FeatureInfoUI');

/**
 * @type {function(new: os.ui.feature.FeatureInfoUI.Controller, ...)}
 * @deprecated Please use goog.require('os.ui.feature.FeatureInfoUI').Controller instead.
 */
os.ui.feature.FeatureInfoCtrl = os.ui.feature.FeatureInfoUI.Controller;

/**
 * @deprecated Please use goog.require('os.ui.feature.FeatureInfoUI').directive instead.
 */
os.ui.feature.featureInfoDirective = os.ui.feature.FeatureInfoUI.directive;
