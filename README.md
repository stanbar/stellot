# Stellar Voting

Election voting system backed by [stellar blockchain network](http://stellar.org/).
Created by Stanislaw Baranski.

Voter -> Issuer: Request 100 sessions (tokenId)
Issuer -> Issuer: Create 100 sessions, generate random K save in DB with userId.
Voter <- Issuer: Return 100 sessions (K)
Voter <- Voter: Generate 100 random transactions using (K, P)
Voter -> Issuer: Send 100 random challenges

