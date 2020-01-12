# Stellar Voting

Election voting system backed by [stellar blockchain
network](http://stellar.org/).

Live demo: [voting.stasbar.com](https://voting.stasbar.com/)

## Overview

Blockchain as a technology provide three major properties that are highly
desirable in applications like election voting. Those properties are:
_immutability_ which ensures that noone can modify the data once wrote into
blockchain, there might be concerns if this property is trully desirable for
everyone, but I assume this system is designed for healthly subjects. Another
property is _transparency_ that allow everyone validate the election correctness
and calculate results by it's own.
In consequences one can __distrust authorities__, while __trust voting
results__.

## Introduction

Blockchain initialy introduced by Satoshi Nakamoto in [Bitcoin
Whitepaper](https://bitcoin.org/bitcoin.pdf) offered one simple application,
i.e. ledger for transfering Bitcoin cryptocurrency. 5 years later Vitalik Buterin
[proposed](https://bitcointalk.org/index.php?topic=428589.0) generalization to
this concept by allowing to process not only transactions, but also so called
"smart contracts" which are in fact scripts run on ethereum platform. Those
"scripts" are executed and validated by all ethereum node, and use blockchain as
a persistant storage. This innovation allowed to create domain specific
behaviour on top of ethereum blockchain, levereging already existing
infrastructure.

## Tokens

Currently the most popular application of smart contract is token
issuance. Those tokens can represent any arbitrary asset either in virtual or
physical world. One can create tokens for funding his startup; hence token
represent company shares. This pattern is called ICO (Initial Coin Offering) or
STO (Security Token Offering), alluding to IPO (Initial Public Offering).
Another one can issue tokens backed by physical asset like national currency;
bypassing slow and expensive international transfers and taxes from
exchanging cryptocurrencies with national currencies. This pattern is
called Stable Coin.
There are many other token applications particulary _vote as a token_ used
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
than one vote token to one person. Thus there should be way of identyfying and
authorizing voters. I decided to use government authorized polish system "Profil
Zaufany" as an identification provider, with the assumption that every eligable
voter is registered there.
The total number of vote tokens should be limited to total number of eligable
voters. I assume that this number is publictly available in the day of election.
In consequences everyone is able to verify that there were no more token issued.
Vote token exchanging is permited intentionally, and treated as a feature.
It's no different from traditional election system where some people deleage thier
vote decision to one family member who tell them what should they vote on. In
this system it's possible to send the token and let the receiver to perform vote
on thy behalf. This decision can possible allow unhealthly vote trading, but it
is possible in traditional system anyway. Stellar is capable of [limiting
users](https://www.stellar.org/developers/guides/issuing-assets.html#requiring-or-revoking-authorization)
who are eligable to receive tokens, but I can not see any benefits from using it
in proposed system, where user authentication is done by external service (Profil
Zaufany), and authorization is done by our backend, which verify if user is
eligable for token issuance.

## System architecture

Ideally the system should only consist of frontend webpage that allows users to
interact with stellar network, getting rid of centralized backend.
Unfortunatelly proposed system require central authorization server for vote
token issuance, thus becoming single point of failure. This flaw is addressed at
the end of this survey.

## Authorization

In order to protect from double token issuance, proposed system link each token
issuance transaction with user identifier e.g. national identification number.
Link is achieved by attaching HMAC of user identifier in transaction MEMO field.
Thus all informations required to perform authorization are contained in
blockchain itself. In consequence, such system become more transparent. We use
HMAC of user identifier to prevent private data exposure, while still allowing
to perform authorization check on public blockchain. User is eligable to issue
token only if his user identifier hash is not present in any issuance
transaction made from distribution account.

## Vote Token

We assume that the number of eligable voters is public information. Thus
becoming value of maximum number of tokens in this election. During asset
creation, issuing account lockout from creating new asset, so we can be sure
that no more tokens are ever created.
Assets in stellar blockchain, are divisible to 7 decimal points. This is
unwanted feature since we don't want to allow users to vote by just one tenth of
thier vote. To prevent from it, we will treat 1 vote token as the smallest
indivisible amount possible in
[XDR](https://www.stellar.org/developers/guides/concepts/xdr.html) which is 1
scaled down by a factor of 10,000,000 (this format allows to represent decimal
numbers in 7 digts precision, without introduction floating-point arithmetics
and it's innate errors).

In example election we assume that the number of eligible voters is equal to
100.

## Token distribution

Each user who authenticate itself by Profil Zaufany and authorize by our backend
will be able to issue 1 voting token (seen by user as 0.0000001). One can do
with this token whatever he want, ideally vote for one of eligible parties, but
nothing prevent him for transfering this token to any other account, such as
family member. Since it already happends in current traditional voting system,
it should not be considered as system flaw, rather as a feature.

## Voting paths

Our system allow two paths of voting: simplified and manual. In _manual path_,
user already posses stellar account and want to take control of whole process,
which involve creating trustline to distribution account and issuing vote token.
_Simplified path_ create new stellar account, create trustline to distribution
account and issue token automatically on the user behalf, leaving it with just
decision what party to vote on. User of such path is completely abstracted from
technology used underneath, while still leverageing all blockchain benefits.  

## Bootstrapping

In order to create such election we need distribution account, new vote token,
and accounts for all registered parties. Creating distribution account and new
token is multi-step process; well described on official stellar
documentation [Issuing
Assets](https://www.stellar.org/developers/guides/issuing-assets.html) and
[Custom
Assets](https://www.stellar.org/developers/guides/walkthroughs/custom-assets.html)
Each party account is created by generating keypair and issuing trustline to
token distribution account.
See `bootstrap.js` for for whole flow implementation.
Variables that need to be propagated in backend and webpage code are:

- asset name, asset issuer public key
- distribution account public key
- list of (party name, party account public key)

In backend those environment variables are injected from `.env` file.
In fronted we could do simillar using e.g. Webpack DefinePlugin, but for
simplicity I decided to not use any bundler.

Now we are ready to publish our application. Here, we have another decentralized
solution called IPFS, where we can publish our webpage on P2P network, protecting
our election system access point from many vector attacks, but this itself if
topic for separate survey so we will end here. Here is
[link](https://ipfs.io/ipfs/QmY5ZcYuBXJ56ZUsNqYXKuLdk5j3i6zWDwuzfV9SBSZviv) to
proposed system on IPFS network.

## Fully Decentralized Application

In blockchain world in order to ensure equal trust, everything should be
blockchain contained, which is often impractical and/or expensive. For
example one could encode all eligable user addresses (or better hash of
addresses) in smart contract and then allow redeeming vote token only to
addresses which are present in there. While this might work for small list of
adresses, can become overkill for election when we take cost of such huge smart
contract into account.  

## Demo

Visit

`https://voting.stasbar.com`

## Installation

Install

`npm install`

Start

`npm run start`

Open

`http://localhost:3000`


## Resources

- [Source Code](https://github.com/stasbar/stellar-voting)
- [Stellar Lab](https://www.stellar.org/laboratory/)
- [Creating custom
  asset](https://www.stellar.org/developers/guides/walkthroughs/custom-assets.html)

