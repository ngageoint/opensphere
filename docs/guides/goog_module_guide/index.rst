Using ES Modules in OpenSphere
===============================

Modules have a number of key differences from files using ``goog.provide`` that are important for developers to keep in mind.

Module Scope
************

Every module has its own local scope. This prevents polluting the global ``window`` context because all variables defined in the module are local by default.

Consider the following code at the root level of a JavaScript file:

.. code-block:: javascript

    const myString = 'Hello, World!';

If this were loaded in a normal script, ``window.myString`` would be set to the string ``Hello, World!``. When loaded in a module, the variable is only accessible locally in the module. ``window.myString`` will still be ``undefined``.

Module Exports
**************

.. note:: This documentation is a basic export example. For more complete documentation, see the MDN `import`_ and `export`_ documentation.

.. _import: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import
.. _export: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export

To provide functions, classes, etc to external files, a module may use the ``export`` keyword to define what to expose from its local scope. To make the above string available externally, a module could do the following:

.. code-block:: javascript

    goog.declareModuleId('my.module');

    export const myString = 'Hello, World!';

    exports = {myString};

Then to reference that string in another module:

.. code-block:: javascript

    import {myString} from './path/to/my/module.js';

    console.log(myString);

Requiring an ES Module in Legacy Code
--------------------------------------

In a legacy ``goog.provide`` file, ``goog.require`` always returns ``null`` and should never be assigned to a variable. Doing so would pollute the global context by adding the variable name to ``window``. To reference an ES module from a ``goog.provide`` type file, you must use ``goog.module.get`` in a restricted scope and assign the exports.

For example:

.. code-block:: javascript

    goog.provide('my.legacy');

    goog.require('my.module');

    my.legacy.printTheString = function() {
      const {myString} = goog.module.get('my.module');
      console.log(myString);
    };

In a ``goog.module`` file, ``goog.require`` returns the exports so this can be simplified a bit.

.. code-block:: javascript

    goog.module('my.legacy');

    const {myString} = goog.require('my.module');

    const printTheString = function() {
      console.log(myString);
    };

    exports = {printTheString};

Type Only Imports
*****************

If an ``import`` or ``goog.require`` is only needed to access types in a module, use ``goog.requireType``. This will only be used by the compiler for type checking and does not create a hard dependency on the required module. These calls will also be discarded from the compiled output.

.. code-block:: javascript

    // SomeEvent is a dependency and programmatically used in the file.
    import SomeEvent from './path/to/someevent.js';

    // The SomeEvent type is referenced in JSDoc, and is not a dependency.
    const {default: SomeEvent} = goog.requireType('os.SomeEvent');

.. note:: When using ``goog.requireType`` with an ES module, Closure will assign the default export to a ``default`` property on the exports, and any named exports to like-named properties. This is why the above example reassigns the ``default`` property to a more friendly name. This is also necessary when using ``goog.module.get`` with an ES module.

Typedefs
********

``@typedef`` declarations are only used by the compiler, but must be exported if they're used outside the file that declares them. Alternatively they can be moved to an extern to avoid the need for ``goog.requireType`` to use them.

.. code-block:: javascript

    /**
     * @typedef {{
     *   prop1: string,
     *   prop2: number
     * }}
     */
    export let MyType;
