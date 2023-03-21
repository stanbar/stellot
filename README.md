![image preview](https://raw.githubusercontent.com/stasbar/stellar-voting/master/img/stellot-scf.png)

# Stellot

**Summary**: Privacy-first i-voting platform powered by Stellar.

**Category**: Applications

**Goals**:
- Inherit open blockchain trust in the i-voting system.
- Lower operational costs by leveraging existing blockchain infrastructure.
- Achieve privacy and verifiability for all voters.

**Timeline**:
- [x] Q4.2019 - Start blockchain-based i-voting systems research. ✓

- [x] Q1.2020 - Create a journal article draft. ✓
- [x] Q1.2020 - Create a proof-of-concept application. ✓
- [x] Q1.2020 - Create a proof-of-concept service for creating general-purpose votings. ✓

- [x] Q2.2020 - Add keybase auth via jwt and keybase-bot (similar how https://stellarcommunity.fund works) ✓
- [x] Q2.2020 - Add basic authN & authZ methods (cookie, IP address, codes, email, domain etc.) ✓
- [x] Q2.2020 - Add vote encryption (preventing partial results before the end of voting). ✓

- [x] Q3.2020 - Store voting meta-data on IPFS content-addressable network. ✓
- [x] Q3.2020 - Solve the scalability problems ✓
- [x] Q3.2020 - Finish service for creating general-purpose votings. ✓
- [x] Q3.2020 - Publish a journal article. ✓

- [x] 2021-22 - Research cohersion-resitant and private blockchain i-voting architectures. Reserach multi-party computation (MPC) and zkSNARK.
- [x] Q2.2022 - Pitch Stellot at [Startup School 2022](https://pg.edu.pl/startup/2022-07/demo-day-2022-relacja).
- [x] Q3.2022 - Redesign the protocol according to [Vitalik's MACI](https://ethresear.ch/t/minimal-anti-collusion-infrastructure/5413) scheme.
- [x] Q4.2022 - Write [reserach statement](https://stan.bar/research-statement).

- [ ] Q1.2023 - Implement the cohersion-resitant layer on top of current protocol.
- [ ] Q1.2023 - Develop an MPC protocol to compute the encryption key using Distributed Key Generation (DKG) schemes.
- [ ] Replace the current storage mechanism based on Stellar transactions, with the new [Stellar's Soroban](https://soroban.stellar.org) smart contract platform.
- [ ] Q1.2023 - Implement the MPC protocol for decryption and tally the votes stored in Soroban smart contract. This will remove the need for trusted-third-party used in the current protocol.
- [ ] Q2.2023 - Reserach the possibilities of running the nodes on end-user devices like smartphones and laptops.
- [ ] Q3.2023 - Design a protocol for end-user devices.
- [ ] Q4.2023 - Implement the protocol for end-user devices.

- [ ] Q1.2024 - Create a framework for creating domain-specific standalone votings.
- [ ] Q1.2024 - Find academic/government votings where such a system could be used.
- [ ] Q1.2024 - Host dean elections of the Gdańsk Tech with Stellot.

**Description**: In this paper, we propose a privacy-preserving i-voting system based on the public Stellar
Blockchain network. We argue that the proposed system satisfies all requirements stated for a robust
i-voting system including transparency, verifiability, and voter anonymity. The practical architecture
of the system abstracts a voter from blockchain technology used underneath. To keep user privacy,
we propose a privacy-first protocol that protects voter anonymity. Additionally, high throughput
and low transaction fees allow handling large scale voting at low costs. As a result we built an
open-source, cheap, and secure system for i-voting that uses public blockchain, where everyone can
participate and verify the election process without the need to trust a central authority. The main
contribution to the field is a method based on a blind signature used to construct reliable voting
protocol. The proposed method fulfills all requirements defined for i-voting systems, which is
challenging to achieve altogether.

Voter privacy is achieved by the blind-signature technique on the stellar transaction.  Deeper technical details are available in [whitepaper](https://www.mdpi.com/2076-3417/10/21/7606/pdf). We provide demo implementation for the proposed system under [https://stellot.com](https://stellot.com). This general-purpose voting service is great for end-users voting, but we believe that our goal is also to digitize academic/government voting. Such elections require domain-specific applications, and so we would like to create a framework for these types of solutions. Especially the Auth-Server is something that will differ in every institution.

**Links**:
- Article: https://www.mdpi.com/2076-3417/10/21/7606/pdf
- Repository: https://github.com/stanbar/stellot
- Demo: https://stellot.com

# Installation

## Keys

1. Generate a new keypair for JWT tokens:

Go to `scripts/` and run: `./generate-jwt-keypair.sh`

2. Sendgrid API key

Get Sendgrid API key from `https://app.sendgrid.com/settings/api_keys`.

Add it to `.env` file `SENDGRID_API_KEY=`

3. Update `.env` files

Update `.env` files for each submodule accordingly, using `.env.example` as a template.

# Reverse Proxy - Caddy/Traefik/NGINX

Expose services using reverse proxy. We recommend using Caddy or Traefik.

The configuration files for Caddy are available in [https://github.com/stanbar/caddy](https://github.com/stanbar/caddy).

# Usage

Start services with
```
docker compose up -d
```

# Administration

You can remove votings from listing with
```
curl -X DELETE -H "authorization:<MASTER_SECRET_KEY>" https://stellot/api/voting/<voting slug>
```

Where:

- `<MASTER_SECRET_KEY>` is the master account key, same as in `tds/.env`.
- `<voting slug> is the voting's id.


