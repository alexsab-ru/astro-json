#!/bin/bash
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi
export CSV_URL=$CSV_URL_ALPHA
# pnpm run get-belgee-samara
# pnpm run get-jac-samara
# pnpm run get-jetour-alpha
# pnpm run get-livan-alpha
# pnpm run get-kaiyi-alpha
# pnpm run get-kaiyi-samara
# pnpm run get-baic-alpha
pnpm run get-baic-samara