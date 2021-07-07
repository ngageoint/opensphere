/* Copyright 2011 The Closure Library Authors. All Rights Reserved. */
/**/
/* Licensed under the Apache License, Version 2.0 (the "License"); */
/* you may not use this file except in compliance with the License. */
/* You may obtain a copy of the License at */
/**/
/*      http://www.apache.org/licenses/LICENSE-2.0 */
/**/
/* Unless required by applicable law or agreed to in writing, software */
/* distributed under the License is distributed on an "AS-IS" BASIS, */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. */
/* See the License for the specific language governing permissions and */
/* limitations under the License. */
/**
 * @fileoverview Wraps an iterable storage mechanism and creates artificial
 * namespaces using a prefix in the global namespace.
 *
 */
goog.module('os.storage.PrefixedMechanism');
goog.module.declareLegacyNamespace();

const iter = goog.require('goog.iter');
const GoogPrefixedMechanism = goog.require('goog.storage.mechanism.PrefixedMechanism');
const osImplements = goog.require('os.implements');
const IMechanism = goog.require('os.storage.IMechanism');


/**
 * Wraps an iterable storage mechanism and creates artificial namespaces.
 *
 *
 * @implements {IMechanism}
 *
 * @suppress {accessControls} To ignore the final tag on the parent class.
 */
class PrefixedMechanism extends GoogPrefixedMechanism {
  /**
   * Constructor.
   * @param {!GoogPrefixedMechanism} mechanism Underlying
   *     iterable storage mechanism.
   * @param {string} prefix Prefix for creating an artificial namespace.
   */
  constructor(mechanism, prefix) {
    super(mechanism, prefix);
  }

  /**
   * @inheritDoc
   */
  getAll() {
    var values = [];
    iter.forEach(this.__iterator__(false), function(value) {
      values.push(value);
    });
    return values;
  }
}
osImplements(PrefixedMechanism, IMechanism.ID);

exports = PrefixedMechanism;
