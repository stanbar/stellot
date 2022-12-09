#!/bin/bash
openssl genrsa -out jwt_rs256_priv.pem 4096
openssl rsa -in jwt_rs256_priv.pem -pubout > jwt_rs256_pub.pem

cp jwt_rs256_priv.pem ../tds/
cp jwt_rs256_priv.pem ../emails-auth/

cp jwt_rs256_pub.pem ../tds/
cp jwt_rs256_pub.pem ../emails-auth/