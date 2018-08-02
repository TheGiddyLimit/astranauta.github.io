#!/bin/bash

echo "Making js ugly."
for f in js/*.js ; do npm run uglifyjs -- --compress --mangle -o "$f" -- "$f" ; done
