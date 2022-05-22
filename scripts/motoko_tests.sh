#!/bin/bash

# Motoko module test script
# Write your Motoko tests with file name: *.test.mo

set -eu

MOTOKO_TEST_DIR=src/GenerativeArtNFT
WASM_OUTDIR=_wasm_out

rm -rf ${WASM_OUTDIR}
mkdir ${WASM_OUTDIR}
trap "rm -rf ${WASM_OUTDIR}" EXIT

for i in ${MOTOKO_TEST_DIR}/*.test.mo; do
    echo ==== Run Motoko module tests: ${i} ====
    wasm_out_name=${WASM_OUTDIR}/$(basename $i .mo).wasm
    $(dfx cache show)/moc $(vessel sources) -wasi-system-api -o ${wasm_out_name} $i
    wasmtime ${wasm_out_name}
done

echo "SUCCEED: All module tests passed"
exit 0
