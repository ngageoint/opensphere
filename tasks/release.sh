#!/usr/bin/env bash
set -e

echo "This script will run a release build of OpenSphere via Travis"
echo "Prereqs:"
echo "  * install the travis cli utility (https://github.com/travis-ci/travis.rb#installation)"
echo "  * login via: travis login --org"

token=$(travis token --org | awk '{print $NF}')

# The git.depth = false thing is because Travis, by default, clones with --depth 50. The
# semantic-release scripts will be examining git for previous release tags, and we need
# to be sure the local clone has them
body='{
  "request": {
    "branch": "master",
    "config": {
      "merge_mode": "deep_merge",
      "git": {
        "depth": false
      },
      "env": {
        "global": {
          "RELEASE": true
        }
      }
    }
  }
}'

echo ""
echo "API Response:"

curl -X POST \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -H 'Travis-API-Version: 3' \
  -H "Authorization: token $token" \
  -d "$body" \
  https://api.travis-ci.org/repo/ngageoint%2Fopensphere/requests

echo ""
