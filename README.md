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

## Introduction

Blockchain initialy introduced by Satoshi Nakamoto in [Bitcoin
Whitepaper](https://bitcoin.org/bitcoin.pdf) offered one simple application,
i.e. ledger for transfering Bitcoin. 5 years later Vitalik Buterin
[proposed](https://bitcointalk.org/index.php?topic=428589.0) generalization to
this concept by allowing to process not only transactions, but also so called
"smart contracts" which are in fact scripts run on ethereum platform. Those
"scripts" are executed and validated by all ethereum node, and use blockchain as
a persistant storage. This innovation allowed to create domain specific
behaviour top of ethereum blockchain, levereging already existing
infrastructure.

## Tokens

Currently the most popular application of smart contract is token
issuance. Those tokens can represent any arbitrary asset either in virtual or
physical world. One can create tokens for funding his startup; hence token
represent company shares. This pattern is called ICO (Initial Coin Offering) or
STO (Security Token Offering), alluding to IPO (Initial Public Offering).
Another one can issue tokens backed by physical asset like national currency;
bypassing slow and expensive international transfers and taxes from
exchanging cryptocurrencies with physical national currencies. This pattern is
called Stable Coin.
There are many other applications to tokens particulary _vote as a token_ used
here in this survey.

## Stellar platform

Ethereum provide high flexibility, mainly because it's fully fledged smart
contracts ecosystem, particulary it's turing-complete Solidity language.
While Stellar is blockchain platform specializing in asset tokenization, it's
easier, cheaper, faster and provide facilities for restricting token
distribution only to eligable users. I don't state that Stellar is better for
vote tokenization, but it's enought for this simple election system.

## System design

The goal of the system is to provide the highest level of transparency, while
keeping sensitive data private. Additionaly it should be illegal to issue more
than one vote token to one person. Thus it should be way of identyfying and
authorizing voters. I decided to use government authorized polish system "Profil
Zaufany" as an identification provider, with the assumption that every eligable
voter is registered there.
The total number of vote tokens should be limited to total number of eligable
voters. I assume that this number is publictly available in the day of election.
In consequences everyone is able to verify that there were no more token issued.
Vote token exchanging is permited intentionally, and treated as a feature.
It's no different from traditional election system that some people deleage thier
vote decision to one family member. Here it's possible to send the token and let
the receiver to perform vote on thy behalf. This decition can possible allow
unhealthly vote trading, but it is possible in traditional system anyway.
Stellar is capable of [limiting
users](https://www.stellar.org/developers/guides/issuing-assets.html#requiring-or-revoking-authorization)
who are eligable to receive tokens, but I can not see any benefits from using
it. Additionaly user authorization is done by external service (Profil Zaufany)
which verify users who are eligable for token issuance.

## Implementation description

I assume that the number of eligible voters is equal to 100 (it will be easier
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

