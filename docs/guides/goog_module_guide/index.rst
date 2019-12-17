Using goog.module in OpenSphere
===============================

Modules have a number of key differences from files using ``goog.provide`` that are important for developers to keep in mind.

Module Scope
************

Every module has its own local scope. This prevents polluting the global ``window`` context because all variables defined in the module are local by default.

Consider the following code at the root level of a JavaScript file:

.. code-block:: javascript

    const myString = 'Hello, World!';

If this were loaded in a normal script, ``window.myString`` would be set to the string ``Hello, World!``. When loaded in a module, the variable is only accessible locally in the module. ``window.myString`` will still be ``undefined``.

To provide functions, classes, etc to external files, a module may use the ``exports`` object to define what to expose from its local scope. To make the above string available externally, a module could do the following:

.. code-block:: javascript

    goog.module('my.ns');

    const myString = 'Hello, World!';

    exports = {myString};

Then to reference that string in another file:

.. code-block:: javascript

    const {myString} = goog.require('my.ns');
    console.log(myString);

.. note:: Within a module, ``goog.require`` now has a return value. It returns the exports of the required module.

.. note:: This example makes use of `destructuring assignment <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment>`_ both in the exports and the ``goog.require`` statement. This expression is particularly convenient with module imports/exports.

Global Namespace
****************

The ``goog.module`` call does not add anything to the global context on its own. Consider the following code:

.. code-block:: javascript

    goog.provide('my.Class');

This line defines ``window.my.Class`` on the global scope. ``goog.module('my.Class')`` does not do this. It simply makes a module by that name available to another module calling ``goog.require('my.Class')``.

To allow legacy ``goog.provide`` files to reference a module by that namespace, a module must call ``goog.module.declareLegacyNamespace()`` after the ``goog.module`` call. Closure's module loader will process that call and set the global namespace to the module's exports.

.. code-block:: javascript

    goog.module('my.Class');
    goog.module.declareLegacyNamespace();

Multiple goog.provide's
***********************

A single ``goog.module`` statement is allowed per file. When converting a file with multiple ``goog.provide`` statements, they either need to be split out into separate files or consolidated to a single module. Splitting into separate files is useful to preserve existing namespaces and avoid breaking changes, but some cases may benefit from consolidating down to one namespace. Angular directive/controller pairs are a good example where consolidation and refactor might be preferred.

Type Only Imports
*****************

If a ``goog.require`` is only needed to access types in a module, use ``goog.requireType``. This will only be used by the compiler for type checking and does not create a hard dependency on the required module. These calls will also be discarded from the compiled output.

.. code-block:: javascript

    // SomeEvent is a dependency and programmatically used in the file.
    const SomeEvent = goog.require('os.SomeEvent');

    // The SomeEvent type is referenced in JSDoc, and is not a dependency.
    const SomeEvent = goog.requireType('os.SomeEvent');

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
    const MyType;

    // Required if MyType is referenced outside the file.
    exports = {MyType};
