#!/bin/bash
openssl ecparam -genkey -name prime256v1 | tee >(openssl ec -pubout)