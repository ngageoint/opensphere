Migrating from goog.modules to ES modules
=========================================

The primary difference between a ``goog.module`` and an ES module is how imports/exports are defined. With ``goog.module``, we solely use ``goog.require`` to import dependencies and use the ``exports`` keyword to assign either a single default export or an object listing named exports. ES modules use the ``import`` and ``export`` keywords, which are part of the JavaScript specification. MDN's JavaScript guide has an excellent reference on `JavaScript modules`_ with details on how these keywords work.

.. _JavaScript modules: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
.. _Migrating from goog.modules to ES modules: https://github.com/google/closure-compiler/wiki/Migrating-from-goog.modules-to-ES-modules

Transform Script
****************

To convert ``goog.module`` files to ES modules, we'll use the ``moduletoes6.js`` transform in `opensphere-jscodeshift`_. This transform is based on the Closure Compiler's `Migrating from goog.modules to ES modules`_ guide.

.. _opensphere-jscodeshift: https://github.com/schmidtk/opensphere-jscodeshift/

To run the transform, clone ``opensphere-jscodeshift`` to your workspace and ``yarn upgrade``. Then run the transform on a ``goog.module`` file:

.. code-block:: none

    $ cd /path/to/opensphere-jscodeshift
    $ yarn run shift -t src/transforms/es6/moduletoes6.js <target file or directory>

The transform can be run against a single file or a directory. In the case of a directory, it will recursively run against any ``.js`` files it finds under the base path. The transform will make the following changes:

- Replace the ``goog.module`` expression with ``goog.declareModuleId``.
- Replace ``exports`` with inline ``export`` and ``export default`` declarations.
- If ``export default`` is used, creates a ``<filename>.shim.js`` file to maintain backwards compatibility with ``const TheDefaultExport = goog.require(<module name>)``.
- Remove the ``goog.module.declareLegacyNamespace`` statement, if present.

goog.declareModuleId
********************

To make ES modules accessible to ``goog.module`` or ``goog.provide`` files, the Closure Library provides the ``goog.declareModuleId`` function to declare a Closure module ID. This is analagous to ``goog.module``, and makes the ES module's exports available via ``goog.require`` or ``goog.module.get``.

.. note:: While ``goog.declareModuleId`` is not necessary for source files, it does allow tests to load module exports via ``goog.module.get``. Unless tests are migrated to fully support loading modules, this statement should be included in every file.

Referencing ES Modules
***********************

The code used to reference an ES module varies based on the file type referencing the module. For these examples, assume we have the following ES modules in OpenSphere.

.. literalinclude:: src/os/index.js
  :caption: An index module with named exports at ``src/os/index.js``.
  :linenos:
  :language: javascript

.. literalinclude:: src/os/myclass.js
  :caption: A class with a default export at ``src/os/myclass.js``.
  :linenos:
  :language: javascript

From an ES Module
++++++++++++++++++

To import these files from another ES module, use ``import`` statements with a path to the file. Within OpenSphere, use a relative path. From external projects, use a Node path. The file's ``.js`` extension is not required in the path, and for ``index.js`` files the path can end at the containing directory.

.. code-block:: javascript

  // From OpenSphere
  import {MY_CONSTANT} from '../path/to/os';
  import MyClass from '../path/to/os/myclass';

  // From another project
  import {MY_CONSTANT} from 'opensphere/src/os';
  import MyClass from 'opensphere/src/os/myclass';

From a Goog Module
++++++++++++++++++

To import these files from a ``goog.module``, use ``goog.require`` assignments.

.. code-block:: javascript

  const {MY_CONSTANT} = goog.require('os');
  const {default: MyClass} = goog.require('os.MyClass');

.. note:: The default export from an ES module will be assigned to the ``default`` property on the object returned by ``goog.require``. This is why the transform script creates a shim file, so existing references to the module do not need to be updated. You do not need to create this shim for new files, simply use the above syntax to reference the default export properly.

From Legacy Files/Tests
+++++++++++++++++++++++

To import the modules from a legacy file using ``goog.provide`` or from tests, use a combination of ``goog.require`` to add the dependency and ``goog.module.get`` to reference the module.

.. code-block:: javascript

  // Add a dependency on the module
  goog.require('os');
  goog.require('os.MyClass');

  // Load the module
  const {MY_CONSTANT} = goog.module.get('os');
  const {default: MyClass} = goog.module.get('os.MyClass');

Legacy Namespaces
*****************

With ``goog.module`` files, the ``goog.module.declareLegacyNamespace`` function is called to export the module's namespace to the global ``window`` object. This function cannot be used in an ES module because it violates a core principle of modules, that they do not pollute the global scope. The transform script will remove this function from converted files, so prior to running the transform please ensure the module is no longer referenced using the global namespace.
