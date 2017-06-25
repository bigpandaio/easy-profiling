#!/bin/bash

if [[ "$1" == "" ]]; then
  echo "Please supply filepath"
  echo "Example $0 /tmp/cpu_profile"
  exit 1
fi

DIR="$( cd "$( dirname "$0" )" && pwd )"
FILE_NAME="$(basename $1)"

pushd /tmp

# apply template on file
echo "sed \"s/TEMPFILE/.\/$FILE_NAME/g\" $DIR/burst_template > $1.html"
sed "s/TEMPFILE/.\/$FILE_NAME/g" $DIR/burst_template > ./$FILE_NAME.html
python -m SimpleHTTPServer 8123

popd
