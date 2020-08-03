![image preview](https://raw.githubusercontent.com/stasbar/stellar-voting/master/img/stellot-scf.png)

# Stellot

**Summary**: Privacy-first i-Voting platform powered by Stellar.

**Category**: Applications

**Goals**:
- Inherit open blockchain trust in the i-voting system.
- Lower operational costs by leveraging existing blockchain infrastructure.
- Achieve privacy and verifiability for all voters.

**Timeline**:
- Q4.2019 - Start blockchain-based i-voting systems research. ✓

- Q1.2020 - Create a journal article draft. ✓
- Q1.2020 - Create a proof-of-concept application. ✓
- Q1.2020 - Create a proof-of-concept service for creating general-purpose votings. ✓

- Q2.2020 - Add keybase auth via jwt and keybase-bot (similar how https://stellarcommunity.fund works) ✓
- Q2.2020 - Add basic authN & authZ methods (cookie, IP address, codes, email, domain etc.) ✓
- Q2.2020 - Add vote encryption (preventing partial results before the end of voting). ✓
- Q2.2020 - Add multi-select voting.

- Q3.2020 - Store voting meta-data on IPFS content-addressable network. ✓
- Q3.2020 - Solve the scalability problems ✓
- Q3.2020 - Add stake-weighted votings.
- Q3.2020 - Finish service for creating general-purpose votings. ✓
- Q3.2020 - Publish a journal article.
- Q3.2020 - Add domain-specific auth with OpenID Connect.

- Q4.2020 - Add metamask support for stake-weighted votings.
- Q4.2020 - Create a framework for creating domain-specific standalone votings.
- Q4.2020 - Find academic/government votings where such a system could be used.

- Q1.2021 - Host dean elections of the Gdańsk University of Technology with Stellot.


**Description**: Stellot is a privacy-first i-voting system powered by the Stellar network. We argue that the proposed system satisfies all requirements stated for robust i-voting systems such as transparency, verifiability, and voter anonymity/privacy. The system is designed in such a way, that voter is completely abstracted from blockchain technology used underneath. Open Stellar blockchain allows everyone to verify the election results without having to trust a central authority.

I believe that this project is valuable for Stellar, mainly because it proves that Stellar can be used not only for asset tokenization and payments but also as a robust i-voting system backbone.
Starting with the general-purpose voting platform, we would like to target all kinds of votings including domain-specific elections, straw polls, referendums, plebiscites. It would be amazing to host the next SCF voting with Stellot, proving its self-contained ecosystem. Since we have connections with our University, we will start here with annual elections every February. When applied successfully, we will scale the product to other domains, bringing Stellar high notability.

The voter privacy is achieved by the blind-signature technique on the stellar transaction, while the signer is protected by a cut-and-choose method.  Deeper technical details are available in [this **draft** of the article](https://github.com/stasbar/stellot/releases/download/0.0.1/draft_evoting_on_stellar.pdf) (should be finished in about month or two). We provide demo implementation for the proposed system under [https://stellot.com](https://stellot.com). This general-purpose voting service is great for end-users votings, but we believe that our goal is also to digitize the academic/government votings. Such elections require domain-specific applications, and so we would like to create a framework for these types of solutions. Especially the Auth-Server is something that will differ in every institution.

**Links**:
- Article: https://github.com/stasbar/stellot/releases/download/0.0.1/draft_evoting_on_stellar.pdf
- Repository: https://github.com/stasbar/stellot
- Demo: https://stellot.com

**Diagram**:
![Sequence diagram](https://raw.githubusercontent.com/stasbar/stellar-voting/master/img/sequence-diagram.png)

Tags: voting, i-voting, privacy, platform
