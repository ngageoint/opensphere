Testing Goog Modules
====================

Files using ``goog.module`` along with ``goog.module.declareLegacyNamespace()`` can be tested largely the same as the old ``goog.provides`` files by using the legacy namespace in Jasmine test code. However, new code which does not use the legacy namespace will need to use a call to retrieve a module outside of the ``goog.module`` context.

.. literalinclude:: src/example.test.js
  :language: javascript
