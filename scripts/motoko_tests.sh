#!/bin/bash

# Motoko module test script
# Write your Motoko tests in MOTOKO_TEST_DIR (see below) with file name: *Test.mo

set -eu

MOTOKO_TEST_DIR=src/GenerativeArtNFT/tests
WASM_OUTDIR=_wasm_out

rm -rf ${WASM_OUTDIR}
mkdir ${WASM_OUTDIR}
trap "rm -rf ${WASM_OUTDIR}" EXIT

for i in ${MOTOKO_TEST_DIR}/*Test.mo; do
    echo ==== Run Motoko module tests: ${i} ====
    wasm_out_name=${WASM_OUTDIR}/$(basename $i .mo).wasm
    $(dfx cache show)/moc $(vessel sources) -wasi-system-api -o ${wasm_out_name} $i
    wasmtime ${wasm_out_name}
done

echo "SUCCEED: All module tests passed"
exit 0
