#!/bin/bash

# Our internal Bitbucket server uses the format:
#
# Merge pull request #{pr_id} in WV/opensphere from ...
#
# when merging. This causes collisions with unrelated issues on Github,
# which is really more of an annoyance than a major issue.
#
# This rewrites that message slightly so that it won't collide. Note
# that this avoids rewriting messages from Github merges because the
# wording is different.

file=$1
if [ -z "$file" ]; then
  file='.git/COMMIT_EDITMSG'
fi

perl -pi -e 's@^Merge pull request #(\d+) in WV/@Merge PR-\1 in WV/@g' "$file"
