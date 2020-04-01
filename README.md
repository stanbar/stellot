# Stellot

![image preview](https://raw.githubusercontent.com/stasbar/stellar-voting/master/img/stellot-scf.png)

Privacy-first e-Voting platform powered by Stellar.

**Goals**:
- Inherit open blockchain trust in the e-voting system.
- Lower operational costs by leveraging existing blockchain infrastructure.
- Achieve privacy and verifiability for all voters.

**Timeline**:

 - 11.2019 - Start blockchain-based e-voting systems research. ✓
 - 02.2020 - Create a journal article draft. ✓
 - 02.2020 - Create a proof-of-concept application. ✓
 - 03.2020 - Create a proof-of-concept service for creating general-purpose votings. ✓
 - 04.2020 - Add keybase auth via one-time codes and keybase-bot (similar how https://stellarcommunity.fund works) ✓
 - 04.2020 - Add vote encryption (preventing partial results before the end of voting).
 - 04.2020 - Add basic authN & authZ methods (cookie, IP address, one-time link, one-time code, email, etc.).
 - 06.2020 - Add stake-weighted votings.
 - 07.2020 - Finish service for creating general-purpose votings.
 - 07.2020 - Solve the scalability problems.
 - 08.2020 - Publish a journal article.
 - 08.2020 - Add domain-specific auth with OpenID Connect.
 - 09.2020 - Add metamask support for stake-weighted votings.
 - 10.2020 - Create a framework for creating domain-specific standalone votings.
 - 11.2020 - Find academic/government votings where such a system could be used.
 - 02.2021 - Host elections of the Gdańsk University of Technology with Stellot.

**Description**: Stellot is a privacy-first e-voting system based on the Stellar network. We argue that the proposed system satisfies all requirements stated for robust e-voting systems such as transparency, verifiability, and voter anonymity/privacy. The system is designed in such a way, that voter is completely abstracted from blockchain technology used underneath. The voter privacy is achieved by the blind-signature technique on the stellar transaction, while the signer is protected by a cut-and-choose method. Open Stellar blockchain allows everyone to verify the election results without having to trust a central authority.

We would like to target all kinds of votings including general elections, domain-specific elections, straw polls, referendums, plebiscites. Maybe next SCF voting would be handled by Stellot?

I believe that this project is valuable for Stellar, mainly because it proves that Stellar can be used not only for asset tokenization and payments but also as a robust e-voting system backbone.

Deeper technical details are available in [this **draft** of the article](https://github.com/stasbar/stellar-voting/releases/download/0.0.1/draft_evoting_on_stellar.pdf) (should be finished in about month or two). We provide demo implementation for the proposed system under [https://voting.stasbar.com](https://voting.stasbar.com). This general-purpose voting service is great for end-users votings, but we believe that our goal is also to digitize the academic/government votings. Such elections require domain-specific applications, and so we would like to create a framework for these types of solutions.

**Links**:
- Article: https://github.com/stasbar/stellar-voting/releases/download/0.0.1/draft_evoting_on_stellar.pdf
- Demo: https://stellot.stasbar.com
