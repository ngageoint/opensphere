/**
 * @fileoverview The webpack Closure Compiler build produces output with "ol = {}" inside an IIFE, which fails because
 *               ol is not defined in the local scope. This is caused by confusion with the ol.ext namespace because
 *               ol.ext is never provided. This module provides the namespace to fix the compiler output.
 */
goog.module('ol.ext');
goog.module.declareLegacyNamespace();

exports = {};
