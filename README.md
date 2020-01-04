# Stellar Voting

Election voting system backed by decentralized [stellar blockchain
network](http://stellar.org/).

Live demo: [voting.stasbar.com](https://voting.stasbar.com/)

## Overview

Blockchain as a technology provide three major properties that are highly
desirable in applications like election voting. Those properties are:
_immutability_ which ensures that noone can modify the data once wrote into
blockchain\*, there might be concerns if this property is trully desirable for
everyone, but I assume this system is designed for healthly subjects, thus I'll
not focus on this topic. Another property is _transparency_ that allow everyone
validate the election correctness and calculate results by it's own. 
In consequences one can __distrust authorities__, while __trust voting
results__.

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

