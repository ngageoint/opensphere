#!/usr/bin/env bash

set -e

yarn run build
yarn run test

#
# js-dossier does not properly support goog.module and ES6 modules. This has
# been disabled until a functional documentation framework is ready.
#
# yarn run apidoc
