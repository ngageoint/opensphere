.. _app-index-guide:

Application Index
=================

This guide will walk through the application's ``index.js``. This file is used by opensphere-build-index_ to generate the application's `index.html` (both debug and compiled versions), and by opensphere-build-resolver_'s ``resources`` plugin to identify/copy resources for the distribution. Everything in this file is documented in the README, but we'll quickly go over everything here.

Exports
-------

The ``module.exports`` must provide the following:

* ``appVersion``: Path to the application's version directory. This is output to ``.build/version`` by the build, so we read it from there.
* ``packageVersion``: The version number for the application, typically read from the ``package.json``.
* ``basePath``: The base directory of the project, typically ``__dirname``.
* ``distPath``: The base directory of the distribution, typically ``dist/<app>``. This is treated as relative to ``basePath``.
* ``templates``: HTML template files to process. This will generally be an ``index-template.html`` used to generate an ``index.html``, but other templates can be specified as well.
* ``debugCss``: Path to the compiled debug CSS output file.
* ``compiledCss``: Path to the compiled CSS output file.
* ``compiledJs``: Path to the compiled JS output file.

Debug JavaScript files will be determined by opensphere-build-closure-helper_ and automatically added to the ``index.html`` in the base directory.

Resources
---------

Each template has a ``resources`` array that identifies what to include in the distribution. This should be an array of objects with the following properties:

* ``source``: **[required]** Base path to locate specified resoures.
* ``target``: **[required]** Base path under ``appVersion`` to copy specified resources.
* ``scripts``: *(optional)* JavaScript files to copy *and* include as ``<script>`` tags in the HTML file.
* ``css``: *(optional)* CSS files to copy *and* include as ``<link>`` tags in the HTML file.
* ``files``: *(optional)* Additional files to copy, but not include. These are typically files referenced by the application.

.. note::

  Resources often come from npm dependencies and are located in the ``node_modules`` folder. When using a Yarn workspace, this folder may exist at various levels in the folder structure. opensphere-build-resolver_ provides a utility function, ``resolveModulePath``, that will locate these modules for you.

.. _opensphere-build-closure-helper: https://github.com/ngageoint/opensphere-build-closure-helper
.. _opensphere-build-index: https://github.com/ngageoint/opensphere-build-index
.. _opensphere-build-resolver: https://github.com/ngageoint/opensphere-build-resolver
