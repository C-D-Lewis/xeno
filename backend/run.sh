#!/bin/env bash

node index.js

aws s3 cp feed-* s3://public-files.chrislewis.me.uk/shared/
