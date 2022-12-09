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
- [ ] Q1.2023 - Implement the cohersion-resitant layer on top of current protocol.
- [ ] Q2.2023 - Reserach the possibilities of running the nodes on end-user devices like smartphones and laptops.
- [ ] Q3.2023 - Design a protocol for end-user devices.
- [ ] Q4.2023 - Implement the protocol for end-user devices.

- [ ] Q1.2024 - Create a framework for creating domain-specific standalone votings.
- [ ] Q1.2024 - Find academic/government votings where such a system could be used.
- [ ] Q1.2024 - Host dean elections of the Gdańsk Tech with Stellot.


**Description**: Stellot is a privacy-first i-voting system powered by the Stellar network. We argue that the proposed system satisfies all requirements stated for robust i-voting systems such as transparency, verifiability, and voter anonymity/privacy. The system is designed in such a way, that voter is completely abstracted from blockchain technology used underneath. Open Stellar blockchain allows everyone to verify the election results without having to trust a central authority.

I believe that this project is valuable for Stellar, mainly because it proves that Stellar can be used not only for asset tokenization and payments but also as a robust i-voting system backbone.
Starting with the general-purpose voting platform, we would like to target all kinds of votings including domain-specific elections, straw polls, referendums, plebiscites. It would be amazing to host the next SCF voting with Stellot, proving its self-contained ecosystem. Since we have connections with our University, we will start here with annual elections every February. When applied successfully, we will scale the product to other domains, bringing Stellar high notability.

The voter privacy is achieved by the blind-signature technique on the stellar transaction.  Deeper technical details are available in [whitepaper](https://www.mdpi.com/2076-3417/10/21/7606/pdf). We provide demo implementation for the proposed system under [https://stellot.com](https://stellot.com). This general-purpose voting service is great for end-users votings, but we believe that our goal is also to digitize the academic/government votings. Such elections require domain-specific applications, and so we would like to create a framework for these types of solutions. Especially the Auth-Server is something that will differ in every institution.

**Links**:
- Article: https://www.mdpi.com/2076-3417/10/21/7606/pdf
- Repository: https://github.com/stanbar/stellot
- Demo: https://stellot.com
