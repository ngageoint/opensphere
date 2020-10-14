/**
 * @fileoverview The webpack Closure Compiler build produces output with "ol = {}" inside an IIFE, which fails because
 *               ol is not defined in the local scope. This is caused by confusion with the ol.ext namespace because
 *               ol.ext is never provided. This file provides the namespace to fix the compiler output, and
 *               intentionally uses goog.provide to avoid Closure's issue with modules replacing the global namespace.
 */
goog.provide('ol.ext');
