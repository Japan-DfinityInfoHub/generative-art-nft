#!/bin/sh

dfx deploy

dfx canister call GenerativeArtNFT setTokenImage "(1, \"$(base64 src/dummyImages/dummy_1.png)\")"