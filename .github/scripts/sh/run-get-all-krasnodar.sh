#!/bin/bash
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi
export CSV_URL=$CSV_URL_AUTOHOLDING
pnpm run get-jetour-krasnodar
pnpm run get-kaiyi-krd
pnpm run get-baic-krasnodar