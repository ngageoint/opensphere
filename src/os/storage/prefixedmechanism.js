// Copyright 2011 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Wraps an iterable storage mechanism and creates artificial
 * namespaces using a prefix in the global namespace.
 *
 */

goog.provide('os.storage.PrefixedMechanism');

goog.require('goog.iter.Iterator');
goog.require('goog.storage.mechanism.PrefixedMechanism');
goog.require('os.implements');
goog.require('os.storage.IMechanism');



/**
 * Wraps an iterable storage mechanism and creates artificial namespaces.
 *
 * @param {!goog.storage.mechanism.PrefixedMechanism} mechanism Underlying
 *     iterable storage mechanism.
 * @param {string} prefix Prefix for creating an artificial namespace.
 *
 * @extends {goog.storage.mechanism.PrefixedMechanism}
 * @implements {os.storage.IMechanism}
 * @constructor
 *
 * @suppress {accessControls} To ignore the final tag on the parent class.
 */
os.storage.PrefixedMechanism = function(mechanism, prefix) {
  os.storage.PrefixedMechanism.base(this, 'constructor', mechanism, prefix);
};
goog.inherits(os.storage.PrefixedMechanism, goog.storage.mechanism.PrefixedMechanism);
os.implements(os.storage.PrefixedMechanism, os.storage.IMechanism.ID);


/**
 * @inheritDoc
 */
os.storage.PrefixedMechanism.prototype.getAll = function() {
  var values = [];
  goog.iter.forEach(this.__iterator__(false), function(value) {
    values.push(value);
  });
  return values;
};
