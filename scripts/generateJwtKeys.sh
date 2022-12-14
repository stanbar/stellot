#!/bin/bash
openssl ecparam -name prime256v1 -genkey -out jwt_rs256_priv.pem
openssl ec -in jwt_rs256_priv.pem -pubout -out jwt_rs256_pub.pem

cp jwt_rs256_priv.pem ../tds/
cp jwt_rs256_priv.pem ../emails-auth/

cp jwt_rs256_pub.pem ../tds/
cp jwt_rs256_pub.pem ../emails-auth/