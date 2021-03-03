ES6 Transition Guide
====================

.. note:: Please provide any feedback on this guide in `#810`_. Thank you!
.. _#810: https://github.com/ngageoint/opensphere/issues/810

As a step toward modernizing our codebase, OpenSphere plans to migrate all code to use ES6 modules. The Closure Compiler does not allow an incremental transition directly to ES6 modules, given source using ``goog.provide`` cannot directly import them. Closure has however provided a stepping stone for this transition.

``goog.module`` is a replacement for ``goog.provide`` that allows an incremental transition to ES6. Source files using ``goog.module`` may interoperate with both ``goog.provide`` and ES6 modules.

.. toctree::
  :maxdepth: 1
  :caption: Guides

  goog_module_guide/index
  goog_module_to_es6_guide/index
  es6_class_guide/index
  angular_module_guide/index
  unit_test_module_guide/index

External Documentation
**********************

Closure has several Wiki pages on ``goog.module`` and ES6/Closure that are all recommended reading to help understand this process.

- `goog.module: an ES6 module like alternative to goog.provide <https://github.com/google/closure-library/wiki/goog.module:-an-ES6-module-like-alternative-to-goog.provide>`_
- `Migrating from goog.module to ES6 modules <https://github.com/google/closure-compiler/wiki/Migrating-from-goog.modules-to-ES6-modules>`_
- `Closure/ES6 interop <https://github.com/google/closure-library/wiki/ES6-modules-and-Closure-Library>`_
- `ES6 and the Closure Library <https://github.com/google/closure-library/wiki/ES6-modules-and-Closure-Library>`_
