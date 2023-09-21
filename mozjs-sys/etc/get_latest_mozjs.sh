#!/usr/bin/env bash

REPO=mozilla-esr115

# get commit and appropriet mozjs tar
jobs=( $(curl "https://treeherder.mozilla.org/api/project/$REPO/push/?full=true&count=20" | jq '.results[].id') )
for i in "${jobs[@]}"
do
  task_id=$(curl "https://treeherder.mozilla.org/api/jobs/?push_id=$i" | jq -r '.results[] | select(.[] == "spidermonkey-sm-package-linux64/opt") | .[14]')
  echo "Task id $task_id"
  if [ ! -z "${task_id}" ]; then
    tar_file=$(curl "https://firefox-ci-tc.services.mozilla.com/api/queue/v1/task/$task_id/runs/0/artifacts" | jq -r '.artifacts[] | select(.name | contains("tar.xz")) | .name')
    echo "Tar at https://firefox-ci-tc.services.mozilla.com/api/queue/v1/task/$task_id/runs/0/artifacts/$tar_file"
    curl -L --output mozjs.tar.xz "https://firefox-ci-tc.services.mozilla.com/api/queue/v1/task/$task_id/runs/0/artifacts/$tar_file"
    break
  fi
done
