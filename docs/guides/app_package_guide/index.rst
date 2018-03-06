.. _app-package-guide:

Application Package
===================

Here we will walk through the necessary properties in the application's ``package.json``. These properties are necessary for opensphere-build-resolver_ to determine how to build the application and package it for distribution.

Build
-----

The ``build`` property is used to instruct the resolver during the build. For the example application, it looks like this:

.. literalinclude:: package/build.json
  :caption: ``build`` property for ``package.json``
  :linenos:
  :language: json

* ``type``: This should be set to ``app`` so the resolver knows it's building an application.
* ``config``: Where to find the application's main configuration file.
* ``index``: The index file used by opensphere-build-index_.
* ``scss``: The root SCSS file for the application.
* ``gcc``: Additional instructions for the `Google Closure Compiler`_.
* ``moduleDefines``: ``goog.define`` properties that should be resolved to a ``node_module`` path in uncompiled mode.

GCC
***

The ``build.gcc`` object has a number of properties available that affect what arguments are passed to the `Google Closure Compiler`_.

* ``define``: Overrides for ``goog.define`` calls within the application code. For the example app, we define where to find the settings file and replace the application namespace used for browser storage so it differs from OpenSphere.
* ``entry_point``: The main ``goog.provide`` entry point for the application. This instructs the compiler on where to start resolving dependencies, and will include source files as needed by analyzing the ``goog.require`` dependency tree from there.
* ``hide_warnings_for``: This hides errors/warnings from source files matching a pattern. This is useful if you don't care to see warnings from dependencies during the build.

.. note::

  2.x versions of the resolver will automatically add source files in the ``<app>/src`` directory. A future major release will likely change this behavior to explicitly define where to find source files with the ``build.gcc.js`` option. This ties in with the compiler ``--js`` flags that the resolver generates.


Module Defines
**************

When using Yarn workspaces, dependencies may be hoisted to a parent ``node_modules`` directory. This makes the location of the module unpredictable and we must resolve it. This can be done directly for resources included via ``index.js``, but any resources that need to be accessed programmatically will need their path resolved and defined for the uncompiled (debug) build.

This is accomplished by defining a ``moduleDefines`` property in the ``build`` section of the ``package.json``. This property is a map of ``goog.define`` property names to the path of the resource being accessed. The path *must* begin with the module's package name (or it will not be resolved, resulting in an error), and any additional path is optional. In the example, we resolve the entire path to a minified JS file that could be lazily loaded in the application. The path could also be the root path of the package (just the package name), a directory, etc.

For the compiled build, set the default ``goog.define`` property value to the location you intend to copy the required resources to in ``index.js``. For lazily loaded scripts, ``index.js`` should reference them in the ``files`` list instead of ``scripts`` so they aren't included in the ``index.html``.

Directories
-----------

The ``directories`` property tells the resolver where certain resources for the application can be found. These are used by some of the resolver's plugins.

.. literalinclude:: package/directories.json
  :caption: ``build`` property for ``package.json``
  :linenos:
  :language: json

For the example app, we're providing:

* ``scss``: Tells the ``scss`` plugin where to find files to include in the ``node-sass`` build.
* ``views``: Tells the ``copy-views`` plugin where to find HTML templates to copy for the distribution.

Scripts
-------

These scripts are largely copied from OpenSphere's, and you will primarily use ``yarn build`` to build the application. The other scripts are all used by different parts of the build.

Dev Dependencies
----------------

The ``devDependencies`` section in the example app uses the same build tooling as OpenSphere, but you're welcome to change how your application is linted, tested, etc. The only dev dependencies required to build your code with OpenSphere's are ``opensphere-build-resolver`` and ``google-closure-compiler``.

While it's possible to package up your distribution using something like `Webpack <https://webpack.js.org/>`_, the example uses opensphere-build-index_ for simplicity and to stay in parity with OpenSphere. It also uses ``eslint`` for linting, and ``node-sass`` to compile SCSS, but again these are optional. For generating a debug build (the `index.html` in the root project directory), opensphere-build-closure-helper_ is also required.

The remaining dev dependencies are for project management tasks like git hooks and npm scripts.

Dependencies
------------

The primary dependencies here are ``opensphere`` as our app dependency and ``google-closure-library`` to use ``goog.provide/require``. Openlayers is already an inherited dependency from OpenSphere, but made implicit since the code makes direct references to its API.

The example app sticks with Angular 1.5 to maintain compatibility with the numerous directives offered by OpenSphere, as well as ease of compilation with the Closure Compiler. Other frameworks (React, Vue.js, etc) may be used, but compatibility with the compiler may be limited.

`Modernizr <https://modernizr.com/>`_ is included so the library can be built from a local config file. This library is used by OpenSphere to detect browser capabilities, and thus is required by any application using OpenSphere.

.. _opensphere-build-closure-helper: https://github.com/ngageoint/opensphere-build-closure-helper
.. _opensphere-build-index: https://github.com/ngageoint/opensphere-build-index
.. _opensphere-build-resolver: https://github.com/ngageoint/opensphere-build-resolver
.. _Google Closure Compiler: https://developers.google.com/closure/compiler/
