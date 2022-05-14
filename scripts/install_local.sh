#!/bin/sh

dfx deploy --argument "(principal \"$(dfx identity get-principal)\")"
