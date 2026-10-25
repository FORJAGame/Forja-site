#!/bin/sh
# Container start: the image is built without a database, so everything that needs one happens here.
set -e

node scripts/check-database.ts
node_modules/.bin/payload migrate
# Prerenders the public pages with this environment's content (the image was built with `--experimental-build-mode compile`).
node_modules/.bin/next build --experimental-build-mode generate
exec node_modules/.bin/next start
