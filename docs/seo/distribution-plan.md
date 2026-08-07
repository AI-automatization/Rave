# WeWatch external distribution plan

Date: 2026-08-07  
Status: prepared; external submissions require production deploy and account-owner access

## Principles

- Distribute only canonical, indexable production URLs.
- Lead with verified product facts from `docs/seo/factual-sheet.md`.
- Do not mass-submit duplicate translations or manufacture backlinks/reviews.
- Use a translated URL only when its content is a real equivalent.
- Record owner, submission date, destination and outcome for every action.

## Launch sequence

| Order | Channel | Action | Evidence to save |
|---:|---|---|---|
| 1 | Production | Deploy the validated commit and run the 45-case crawler check | commit SHA, deploy URL, test output |
| 2 | Google Search Console | Verify property, submit `/sitemap.xml`, inspect priority RU/UZ/EN URLs | property screenshot/export, inspection status |
| 3 | Bing Webmaster Tools | Add/import property, submit sitemap, inspect priority URLs | sitemap and URL inspection status |
| 4 | Yandex Webmaster | Verify site, submit sitemap, inspect indexing diagnostics | verification and sitemap status |
| 5 | IndexNow | Submit only changed canonical URLs after successful deploy | accepted response, submitted URL list |
| 6 | Owned channels | Publish one factual launch/update post per relevant audience | post URL, locale, campaign tag |
| 7 | Earned outreach | Contact relevant UZ/RU tech, creator, education and long-distance communities with a useful angle | contact, pitch, response, resulting link |
| 8 | GEO review | Test a fixed set of factual questions in search/assistants and record citations | prompt, date, answer summary, cited URL |

## Priority URL set

- `/ru`, `/uz`, `/en`;
- locale guide hubs;
- the strongest guide per locale;
- factual/about/contact pages that establish entity trust;
- only newly changed URLs for IndexNow.

## Content assets

- one concise product fact sheet;
- RU/UZ/EN product descriptions with identical availability claims;
- screenshots or short product demo with descriptive captions;
- founder/team attribution and contact page;
- a release note linking to the relevant canonical guide, not to parameterized URLs.

## Outreach quality gate

Before any pitch or publication:

- URL returns 200 and is present in the sitemap;
- canonical points to the final locale URL;
- title/H1 match the intended search need;
- product/platform claims match the factual sheet;
- analytics campaign tags do not become canonical URLs;
- the target community explicitly allows the format.

## Tracking register

Use one row per action with: `date`, `owner`, `channel`, `locale`, `canonical_url`, `contact_or_property`, `status`, `evidence_url`, `next_review`. Outcomes are categorized as discovered, indexed, cited, linked, referred visit or conversion.

Paid placements, reciprocal-link schemes and bulk directory submissions are out of scope.
