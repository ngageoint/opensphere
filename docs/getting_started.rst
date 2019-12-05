.. _getting_started:

Getting Started
###############

Setup
*****

Prerequisites
=============

- git
- Java 1.7.0+
- Node 6+ and npm
- Yarn_
- Python
- Sphinx (optional, used to generate these docs)
- POSIX-compatible shell environment

  - Along with ``cat``, ``cp``, ``echo``, ``grep``, ``perl``, ``xargs``

- Chrome Browser (59+ required in default tests; plus you probably want this for development)
- Firefox Browser (57+ required in default tests)

Windows developers see `Windows Development`_

.. _Yarn: https://yarnpkg.com
.. _Windows Development: windows_development.html

Ensure that the executables ``git``, ``node``, and ``java`` are in your ``PATH``.

Workspace Setup
===============

Yarn
----

Clone opensphere-yarn-workspace_, and change directory into ``opensphere-yarn-workspace/workspace``.

Clone opensphere_, then run ``yarn install``.

.. _opensphere-yarn-workspace: https://github.com/ngageoint/opensphere-yarn-workspace
.. _opensphere: https://github.com/ngageoint/opensphere

NPM
---

(Not necessary if you followed the yarn instructions above)

Clone opensphere_, then change directory to the clone. Run ``npm install``.

Linking
^^^^^^^

If you are working on several plugins and config projects, you may end up with a workspace like:

.. code-block:: none

  workspace/
    opensphere/
    opensphere-config-developer/
    some-common-lib/
    opensphere-plugin-x/
    opensphere-plugin-y/

``npm link`` is designed to help with this, but can get cumbersome to maintain manually with many projects. We recommend Yarn_ with opensphere-yarn-workspace_ to automate the links. If you prefer to use NPM, npm-workspace_ can be used instead.

.. _npm-workspace: https://www.npmjs.com/package/npm-workspace

Serving the application
-----------------------

While not required, we highly recommend setting up nginx or Apache httpd to serve up your workspace from your local machine. This will allow you to easily proxy remote servers and mock up services to develop against in addition to serving the application exactly as it will be served from production rather than accessing it via a file path in the browser or serving it with a node-based server.

The Build
*********

.. note:: The build does not work natively in Windows. See `Windows Development`_ for instructions.

OpenSphere has all of its build targets as npm scripts. Therefore you can run any particular target by running:

.. code-block:: none

  $ npm run <target>

The most common targets are:

.. code-block:: none

  $ npm run build       # runs the full build for both debug and compiled mode
  $ npm run build:debug # runs the debug build only
  $ npm run test        # runs the unit tests
  $ npm run test:debug  # runs the unit tests with a configuration more suited to debugging
  $ npm run apidoc      # generates api documentation
  $ npm run guide       # generates this documentation

Each target runs its individual pieces through npm scripts as well. Several of those pieces are highly useful when run by themselves just to see if you fixed an error in that part of the build before restarting the entire thing.

.. code-block:: none

  $ npm run lint             # runs the linter to check code style
  $ npm run compile:resolve  # runs the resolver to check dependency/plugin/config resolution
  $ npm run compile:gcc      # runs the google-closure-compiler to produce the compiled JS
  $ npm run compile:css      # runs node-sass to produce the minified/combined css

If you are using yarn (recommended), replace ``npm run`` with ``yarn`` in those targets.

The Resolver
============

opensphere-build-resolver_ runs through all of an application's dependencies, plugins (opensphere-plugin-x), or config projects (opensphere-config-y) and then the resolver's plugins produce arguments for the compiler, arguments for node-sass, page templates for conversion, and more! All of these files are written to the ``.build`` directory and used later in the build.

.. _opensphere-build-resolver: https://github.com/ngageoint/opensphere-build-resolver

The Google Closure Compiler
===========================

Use of the `Closure Compiler`_ has been limited among the open source community. However, unlike other projects which produce minified Javascript, the `Closure Compiler`_ is a true compiler. It does type checking, optimizations, and dead code removal. Type checking is essential to any large project, and the other optimizations allow our compiled code (in some cases) to perform three times better than our unminified code.

.. _Closure Compiler: https://developers.google.com/closure/compiler/

We use the compiler's ``ADVANCED`` compilation level, which is `described in detail here`_. Also check out the annotations_ available for the compiler.

.. _described in detail here: https://developers.google.com/closure/compiler/docs/api-tutorial3
.. _annotations: https://developers.google.com/closure/compiler/docs/js-for-compiler

Because the `Closure Compiler`_ does so much more than just minification, the build takes a non-trivial amount of time to run. To help with developer productivity, we have produced a build system which does not need to be rerun when files change. Instead, it only needs to be run when files are added or dependencies change.

Some of the intricacies from using the compiler are documented in the `Compiler Caveats`_ section below.

The debug build output
======================

The ``index-template.html`` and its corresponding ``index.js`` file define how the main page is packaged up by opensphere-build-index_. That script produces ``index.html``, which is the debug instance. It contains all of the vendor scripts and css in addition to source files that load the application using Closure's debug loader.

.. _opensphere-build-index: https://github.com/ngageoint/opensphere-build-index

If you set up nginx or httpd as recommended above, accessing it might be accomplished by pointing your browser at http://localhost:8080/workspace/opensphere

.. note:: The debug instance references each individual Javascript file in place, resulting in the debug page loading thousands of individual files. Modern browsers tend to handle this well, but debugging on older browsers can be an unpleasant experience.

Once you have run the build once, you can make changes to files in the workspace and pick them up on the page by merely refreshing it. The build only has to be run if dependencies (``goog.require/provide``) change or if files are added or removed.

The compiled build output
=========================

The compiled build output is available in ``dist/opensphere``. You will need to test your changes in both places, but generally compiled mode should be checked after you have largely completed the feature on which you are working. It does contain source maps for debugging, and also loads much quicker in Firefox and IE since all the code is compiled and minified to a single file.

Testing
*******

All of our unit tests for opensphere are written in Jasmine_ and run with karma_ via ``npm test``. Detailed coverage reports are available in ``.build/test/coverage``. If you are writing a plugin or standalone application, you are free to use whatever testing framework you like, but you'll get more for free if you use what we've set up for you already. If you want to switch out Jasmine_ with something else (or a newer version of Jasmine_), that should also be doable.

.. _Jasmine: https://jasmine.github.io/
.. _karma: https://karma-runner.github.io/1.0/index.html

End to end tests are written in Mocha_ and run with Cypress_.  Tests can be started either from the command line via ``yarn test:cypress-all``, or interactively via ``yarn test:cypress``.  To run a single spec from the command line, use ``yarn test:cypress-spec folder/test.spec.js``. Test artifacts are available at ``/cypress/screenshots``, ``/cypress/comparisons`` and ``/cypress/videos``.  The test configuration can be adjusted in Cypress' 'configuration_file'_.  Selectors for all elements present in the GUI can be found in selectors.js_.

.. _Mocha: https://github.com/mochajs/mocha
.. _Cypress: https://github.com/cypress-io/cypress
.. _configuration_file: https://github.com/ngageoint/opensphere/blob/master/cypress.json
.. _selectors.js: https://github.com/ngageoint/opensphere/blob/master/cypress/support/selectors.js
.. _selectors.js: https://github.com/ngageoint/opensphere/blob/master/cypress/support/selectors.js

See :doc:`/guides/cypress_artifacts` for information on accessing Cypress artifacts generated from a CI environment.

Any contributions to OpenSphere should avoid breaking current tests and should include new tests that fully cover the changed areas.

Git Commits
***********

When making local commits, there are checks (implemented as git pre-commit hooks) to verify that your commit message matches the `Conventional Commits`_ conventions.
Basically, you need use the form ``<type>(<scope>): <subject>``, for example something like: ``fix(docs): Updated Getting Started to describe git commits``.
The valid types are: ``feat``, ``fix``, ``docs``, ``style``, ``refactor``, ``perf``, ``test``, ``build``, ``ci``, ``chore`` and ``revert``. Scope is optional, and
should cover the particular part of opensphere that you are working on.

.. _Conventional Commits: https://www.conventionalcommits.org

If your change is an API break, or would otherwise affect external projects, please add a ``BREAKING CHANGE:`` part to the commit message body (per conventions) that describes what external users need to do to adapt to the change.

Developing plugins
******************

See our `plugin guide`_ to get started developing plugins.

.. _plugin guide: guides/plugin_guide.html

Using OpenSphere as a library
*****************************

See our `application guide`_ to get started using OpenSphere as a library for your own application.

.. _application guide: guides/app_guide.html

Building the Read the Docs Guide
********************************

When modifying this guide, we recommend building it locally to ensure there are no errors/warnings in the build, and that everything displays correctly. The guide is built using Sphinx and the Read the Docs theme, which requires Python to install. To install the build dependencies:

.. code-block:: none

  pip install sphinx sphinx_rtd_theme sphinx-autobuild

Once dependencies are installed, generate the guide with ``npm run guide``. The output will be available in ``docs/_build/html``.

If you would like to automatically rebuild the guide as files change, use ``npm run guide:auto``. This starts the ``sphinx-autobuild`` application to monitor the ``docs`` directory for changes and update the documentation accordingly. It also starts a live reload enabled web server to view changes as you make them, accessible at http://127.0.0.1:8000.

Compiler Caveats
****************

The compiler will attempt to minify/rename everything not in a string. For the most part, this is fine. However, when working with Angular templates, the variable/function names used in the template itself will not be replaced. To combat this, we use bracket notation for variables such as ``$scope['value'] = 0f``, and we use ``goog.exportProperty()`` on controller methods that should be made available to the UI.

Broken Example:

.. code-block:: javascript
   :linenos:

    /**
     * @param {!angular.Scope} $scope The scope
     */
    package.DirCtrl = function($scope, $element) {
      $scope.value = 3;
    };

    /**
     * @param {number} value
     */
    package.DirCtrl.prototype.isPositive = function(value) {
      return value > 0;
    };

.. code-block:: html
   :linenos:

    <!-- Angular template -->
    <span ng-show="ctrl.isPositive(value)">{{value}} is positive</span>

This will work great in debug mode (no minification), but will fail in compiled mode. To fix this, we need to ensure that the compiled build does not minify the two items we used in the template.

Fixed Example:

.. code-block:: javascript
   :linenos:
   :emphasize-lines: 5, 10

    /**
     * @param {!angular.Scope} $scope The scope
     */
    package.DirCtrl = function($scope, $element) {
      $scope['value'] = 3;
    };

    /**
     * @param {number} value
     * @export
     */
    package.DirCtrl.prototype.isPositive = function(value) {
      return value > 0;
    };

.. code-block:: html
   :linenos:

    <!-- Angular template -->
    <span ng-show="ctrl.isPositive(value)">{{value}} is positive</span>

Now it works in compiled mode! Note that UI templates is not the only place where bracket notation is useful. It is useful wherever you want to have the compiler skip minification.

