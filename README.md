# Stellar Voting

Election voting system backed by [stellar blockchain
network](http://stellar.org/).

Live demo: [voting.stasbar.com](https://voting.stasbar.com/)

## Overview

Blockchain as a technology provide two major properties that are highly desirable in applications like election voting. Those properties are: _immutability_ which ensures that noone can modify the data once wrote into blockchain, there might be concerns if this property is trully desirable for everyone, but I assume this system is designed for healthly subjects. Another property is _transparency_ that allow everyone validate the election correctness and calculate results by it's own.
In consequences one can distrust authorities, while trust voting
results.

## Introduction

Blockchain initialy introduced by Satoshi Nakamoto in [Bitcoin
Whitepaper](https://bitcoin.org/bitcoin.pdf) offered one simple application, i.e. ledger for transfering Bitcoin cryptocurrency. 5 years later Vitalik Buterin [proposed](https://bitcointalk.org/index.php?topic=428589.0) generalization to this concept by allowing to process not only transactions, but also so called _smart contracts_ which are in fact scripts run on ethereum platform. Those "scripts" are executed and validated by all ethereum node, and use blockchain as a persistant storage. This innovation allowed to create domain specific behaviour on top of ethereum blockchain, levereging already existing infrastructure.

## Tokens

Currently the most popular application of smart contract is token
issuance. Those tokens can represent any arbitrary asset either in virtual or physical world. One can create tokens for funding his startup; hence token represent company shares. This pattern is called ICO (Initial Coin Offering) or STO (Security Token Offering), alluding to IPO (Initial Public Offering).
Another one can issue tokens backed by physical asset like national currency; bypassing slow and expensive international transfers and taxes from exchanging cryptocurrencies with national currencies. This pattern is called Stable Coin.
There are many other token applications particulary _vote as a token_ used here in this survey.

## Stellar platform

Ethereum provide high flexibility, mainly because it's fully fledged smart contracts ecosystem, particulary it's turing-complete Solidity language.
[Stellar](https://www.stellar.org/) on the other hand is blockchain platform specializing just in one application that is asset tokenization. Thus becoming easier, cheaper and faster than general purpose ethereum smart contracts.
Here I will try to fit this simple election system into Stellar functionality boundaries.

## System design

The goal of the system is to provide the highest level of transparency, while keeping sensitive data private. Additionaly it should be illegal to issue more than one vote token to one elector. Hence there should be way of identyfying and authorizing voters. I decided to use government authorized polish system "Profil Zaufany" as an identification provider, with the assumption that every eligable voter is registered there.
The total number of vote tokens should be limited to total number of eligable voters. I assume that this number is publictly available in the day of election. In consequences everyone is able to verify that there were no more token issued.
Vote token exchanging is permited intentionally, and treated as a feature. It's no different from traditional election system where some people deleage thier vote decision to one family member who tell them what should they vote on. In this system it's possible to send the token and let the receiver to perform vote on thy behalf. This decision can possible allow unhealthly vote trading, so this feature can be easly prohibited by disabling _manual path_ described in following chapters. 
Stellar is capable of [limiting users](https://www.stellar.org/developers/guides/issuing-assets.html#requiring-or-revoking-authorization) who are eligable to receive tokens, but I can not see any benefits from using it in proposed system, where user authentication is done by external service (Profil Zaufany), and authorization is done by our backend, which verify if user is eligable for token issuance.

## System architecture

```
                        +---------------+
       +----------------+ Client Webapp +--------+
       |                +--------+------+        |
       |                         |               |
+------v----------+              |               |
| Identity        |              |             +-v-------+
| Provider        |              |             | Stellar |
| (Profil Zaufany)|              |             | Network |
+------+----------+              |             +-^-------+
       |            +------------v-----------+   |
       |            | Issuance/Authorization |   |
       +------------+        Server          +---+
                    |                        |
                    +------------------------+
```

Ideally the system should only consist of client webpage that allows users to interact with stellar network, getting rid of centralized identity provider and issuance/authorization server. Unfortunatelly proposed system require central authorization server for _vote token_ issuance, thus becoming single point of failure. This flaw has been addressed at the end of this survey. There are also many proposals on how to achieve identification in blockchian ecosystem, but I assume it away and leave to future work.

## Authorization

In order to protect from double token issuance, proposed system link each token issuance transaction with user identifier e.g. national identification number. Link is achieved by attaching HMAC of user identifier in transaction MEMO field. Thus all informations required to perform authorization are contained in blockchain itself. In consequence, such system become more transparent. We use HMAC of user identifier to prevent private data exposure, while still allowing to perform authorization check on public blockchain. User is eligable to issue token only if his user identifier hmac is not present in any issuance transaction made from distribution account.

## Vote Token

We assume that the number of eligable voters is public information. Hence becoming value of maximum number of tokens in this election. After asset creation, issuing account have to lockout from creating new asset, so all participants can be sure that no more tokens are ever created. Additionally, it should be impossible to perform vote, after the end of election. Unfortunately Stellar doesn't have such feature build-in, although it can be done by blocking all new token issuance on  issuance/authorization server, and by revoking all accounts that received token. This would require [setting `AUTHORIZATION REVOCABLE` flag on issuing account](https://www.stellar.org/developers/guides/concepts/accounts.html#flags).

Assets in stellar blockchain, are divisible to 7 decimal points. This is unwanted feature since we don't want to allow users to vote by just one tenth of thier vote. To prevent from it, we will treat 1 vote token as the smallest indivisible amount possible in
[XDR](https://www.stellar.org/developers/guides/concepts/xdr.html) which is 1 scaled down by a factor of 10,000,000 (this format allows to represent decimal numbers in 7 digts precision, without introduction floating-point arithmetics and it's innate errors).


## Token distribution

Each user who authenticate itself by Profil Zaufany and authorize by our issuance/authorization server will be able to issue 1 _voting token_ (seen by user as 0.0000001). One can do with this token whatever he want, ideally vote for one of eligible parties, but
nothing prevent him for transfering this token to any other account, such as
family member. Since it already happends in current traditional voting system,
it should not be considered as system flaw, rather as a feature.

## Voting paths

// TODO MERGING
// TODO DOUBLE PUBLISH BECAUSE DISTRUST
Our system allow two paths of voting: simplified and manual. In _manual path_, user already posses stellar account and want to take control of whole process, which involve [creating trustline](https://www.stellar.org/developers/guides/concepts/assets.html#trustlines) to distribution account and issuing vote token.
_Simplified path_ create new keypair on frontend side, not releaving private key to backend. Client prepare one [ACID](https://en.wikipedia.org/wiki/ACID) transaction that include five operations: 

1. [Fund newly created account](https://www.stellar.org/developers/learn/concepts/list-of-operations.html#create-account) with minimum required amount of lumens to process next operations. 1 XLM (cryptocurrency used in stellar blockchain) for minimum acocunt balance, 0.5 XLM for creating trustline and 0.0000200XLM for transactions fee.
2. [Create trustline](https://www.stellar.org/developers/learn/concepts/list-of-operations.html#change-trust) to _vote token_ asset issuer.
3. [Send](https://www.stellar.org/developers/learn/concepts/list-of-operations.html#payment) 1 _vote token_ from distribution account to newly created account.
4. [Send](https://www.stellar.org/developers/learn/concepts/list-of-operations.html#payment) 1 _vote token_ from newly created account to one of chosen parties.
5. [Merge](https://www.stellar.org/developers/learn/concepts/list-of-operations.html#account-merge) newly created account to distribution account, bringing back remained XLM.

User of such path is completely abstracted from technology used underneath, while still leverageing all blockchain benefits. Simplified path could be enhanced by allowing user to releave his keypair, hence allowing him to send his vote token to other user, instead of voting by thier own, same as on manual path. But just for sake of proposed system, two separate paths are available.

## Bootstrapping

In order to create such election we need issuer and distribution account, new vote token, and accounts for all registered parties. Creating issuer and distribution account and creating new token is multi-step process; well described on official stellar documentation [Issuing
Assets](https://www.stellar.org/developers/guides/issuing-assets.html) and
[Custom
Assets](https://www.stellar.org/developers/guides/walkthroughs/custom-assets.html)
Each party account is created simillar to _simplified path_ described above, but limited to first two operations.
See `bootstrap.js` for whole flow implementation.
Variables that need to be propagated in backend and webpage code are:

- asset name, asset issuer public key
- limit of possible vote tokens (number of eligible voters). 
- token expiration (end of election).
- distribution account public key.
- list of (party name, party account public key).

In backend those environment variables are injected from `.env` file.
In fronted we could do simillar using e.g. Webpack DefinePlugin, but for simplicity I decided to not use any bundler.

Now the application is ready to be published. 

## Fully Decentralized Blockchain Application

In blockchain world in order to ensure absolute trust, everything should be blockchain contained, which is often hard, impractical and/or expensive. For example one could encode all eligable user addresses (or better hash of addresses) in smart contract and then allow redeeming vote token only to addresses which are present in there, very simillar to traditional election system where all eligable voters are listed on paper, vote form is issued only if elector is present on such list.  While this might work for small list of adresses, can become overkill for election when cost of such huge smart contract are taken into account. Fortunatelly there are already blockchains that allow linking data from outside the blockchian, i.e. [ethereum oracle](http://www.oraclize.it/). In order to ensure immutability and integrity, such data can be hosted on IPFS (Content Addessed Network) where data is identified by it's hash [example](https://www.tooploox.com/blog/using-ipfs-with-ethereum-for-data-storage).

## Demo

Demo represent parlament election of 2019. Number of eligable voters equals 100. Created token is called Vote01122019.
Demo can be accessed on `https://voting.stasbar.com` or locally

## Demo locally

Install

`npm install`

Start

`npm run start`

Open

`http://localhost:3000`

## Results

Proposed system prototype satisfies core expectations. Authorities can not falsify election results. There is limit on how much votes can be issued. Each vote is recorded on Blockchain, and everyone can calculate election results without trusting authorities. What we get is a system where Blockchain is only subject who need to be trusted. Both government and electoral can distrust each other, while still perform valid election (assuming that they trust Blockchain).
We confirmed that Blockchain can be used not only for cryptocurrencies, but also in assets tokenization, and building dapps (decentralized applications). 
Stellar is just one of many platforms which could be used in such cases, but it turns out that it handles it very well.
It would be advisable to test this system under heavy overload.


## Resources

- [Source Code](https://github.com/stasbar/stellar-voting)
