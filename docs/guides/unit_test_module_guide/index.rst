Testing Goog Modules
====================

When referencing a Closure or ES module in a test, the ``goog.module.get`` call must be used to retrieve the exports. This call should be made within a closure such as the ``describe`` function. The test will also need to use a bare ``goog.require`` on the module ID from ``goog.declareModuleId`` or ``goog.module``.

.. literalinclude:: src/example.test.js
  :language: javascript
