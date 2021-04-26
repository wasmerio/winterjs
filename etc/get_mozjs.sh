#!/bin/bash
# get commit and appropriet mozjs tar
COMMIT=$( cat ./etc/COMMIT )
echo "Commit $COMMIT"
job_id=$(curl "https://treeherder.mozilla.org/api/project/mozilla-release/push/?revision=$COMMIT" | jq '.results[0].id')
echo "Job id $job_id"
task_id=$(curl "https://treeherder.mozilla.org/api/jobs/?push_id=$job_id" | jq -r '.results[] | select(.[] == "spidermonkey-sm-package-linux64/opt") | .[14]')
echo "Task id $task_id"
tar_file=$(curl "https://firefox-ci-tc.services.mozilla.com/api/queue/v1/task/$task_id/runs/0/artifacts" | jq -r '.artifacts[] | select(.name | contains("tar.xz")) | .name')
echo "Tar at https://firefox-ci-tc.services.mozilla.com/api/queue/v1/task/$task_id/runs/0/artifacts/$tar_file"
curl -L --output mozjs.tar.xz "https://firefox-ci-tc.services.mozilla.com/api/queue/v1/task/$task_id/runs/0/artifacts/$tar_file"