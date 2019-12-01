# Stellar Voting

Votting dapp on stellar network.
Live demo: [voting.stasbar.com](https://voting.stasbar.com/)

## Concept overview

We assume that the number of eligible voters is equal to 100 (it will be easier
to demonstrate), thus we should create 100 tokens.
In order to prevent spending only part of token we will issue the smallest
indivisible amount possible in
[XDR](https://www.stellar.org/developers/guides/concepts/xdr.html) which is 1
scaled down by a factor of 10,000,000 (It allows to represent decimal numbers
in 7 diigts precision in human-friendly form).

## Token distribution

Votes can exchange thier ID for 1 (seen by user as 0.0000001) _VOTE_ token.
User can do with this token whatever he want, ideally vote for one of eligible
parties, but nothing prevent him for transfering this token to any other
account, such as family member. Since it already happends in current "analog"
voting model, it should not be considered as system flaw, rather as a feature.


smallest value: 0.0000001
max value: 922,337,203,685.4775807

## Resources

- [Source Code](https://github.com/stasbar/stellar-voting)
- [Stellar Lab](https://www.stellar.org/laboratory/)
- [Creating custom
  asset](https://www.stellar.org/developers/guides/walkthroughs/custom-assets.html)

