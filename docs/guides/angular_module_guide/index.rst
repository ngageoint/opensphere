Angular Directives in Modules
=============================

A primary use case of having multiple ``goog.provide`` statements per file is with Angular directives and their controller. OpenSphere prefers to pair the directive and controller within the same file given they are coupled to create the UI. This poses a problem for a backward-compatible transition to ``goog.module``, given only one module name is allowed per file.

Our options were to split the original names into separate files, or change our approach to exposing the UI. We decided to use a shim to maintain compatibility with existing code. This seems to result in the best end product, and will be detailed in this guide.

The following example shows how the ``map`` directive was transitioned to a module.

Creating the UI Module
----------------------

- The module can use the original controller name, minus ``Ctrl``. The name can be adjusted if needed, for example if this convention results in a name conflict with another class.
- Export the controller as ``Controller``, and the directive as ``directive``.

.. literalinclude:: src/map.js
  :language: javascript
  :caption: ``src/os/ui/map.js``

Using the Module
----------------

To reference the UI module in other files:

.. code-block:: javascript

    const MapUI = goog.require('os.ui.Map');
    // reference the controller class as MapUI.Controller
    // reference the directive function as MapUI.directive

Backward Compatibility Shim
---------------------------

To avoid a breaking change with the new module, we'll create a shim to provide the old namespaces. The shim needs to accomplish a couple things:

- Make the old namespaces available to ``goog.require`` statements.
- Deprecate the old namespaces so developers are aware of the change.

.. literalinclude:: src/map_shim.js
  :language: javascript
  :caption: ``src/os/ui/map_shim.js``

The shim will be maintained until all code referencing the old namespaces has been transitioned to directly reference the new module. After a suitable (TBD) amount of time has passed for developers to respond to the deprecation warning, the shim will be deleted.

.. warning:: The deprecation warning will not appear as a result of ``goog.require``. The Closure compiler will only issue a warning if the old directive/controller references are invoked in code.
