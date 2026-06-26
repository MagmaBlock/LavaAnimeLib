# Bangumi Cache Design

## Goals

- Keep Bangumi data inside the database as a cache of the upstream API, not as application business data.
- Preserve Bangumi facts as completely as practical.
- Keep the Bangumi cache layer ignorant of local application tables.
- Let application data reference Bangumi data only by Bangumi IDs.

## Boundary

The cache stores only Bangumi-derived entities and relationships:

- subject
- episode
- relation between subjects
- character
- person
- subject-character relation
- subject-character-person relation
- auxiliary subject data such as aliases, tags, meta tags, rating counts, and infobox rows

The cache does not know about:

- anime
- files
- uploads
- users
- permissions
- local playback state

Those belong to the application layer and may link to Bangumi data by subject or episode IDs.

## Modeling Approach

The cache uses relational tables because the database is relational, but the model follows upstream Bangumi facts as closely as possible.

Rules:

- store Bangumi entities under a `bangumi_` prefix
- keep upstream ordering where the API provides it
- keep optional fields optional
- do not filter cache data based on whether the local app has already imported the subject
- do not rewrite upstream data to fit local business rules

This means the cache may contain subjects that are not present in the local library.
That is expected and useful, because relations, characters, and episode data can still refer to them.

## Relationships

The important relationship is the subject-scoped one.

A character or a person is not stored only as a global identity. The cache also preserves their appearance within a specific subject, because Bangumi expresses that relationship at the subject level.

That lets the application answer questions like:

- which characters appear in a subject
- which actors are attached to a specific subject-character pair
- which subjects a character or person is linked to through Bangumi facts

## Data Fidelity

The cache aims to minimize loss.

Preferred properties:

- no filtering of relations just because the local library lacks the target subject
- no dropping of episodes by type unless the product explicitly decides to ignore them later
- no host rewriting in the cached facts themselves
- no insertion of local application semantics into Bangumi tables

If local presentation needs transformed data, that transformation should happen when reading or rendering, not when caching.

## Refresh Behavior

Refresh jobs should:

- fetch upstream Bangumi data
- store the upstream facts into the Bangumi cache tables
- update only Bangumi cache state
- leave local business tables untouched

Any local sync from Bangumi to application tables should be a separate concern.

## Naming

All Bangumi cache tables use the `bangumi_` prefix.
That makes the boundary visible in schema, migrations, queries, and debugging.

## Result

This design gives us a cache layer that is:

- clearly separated from local business data
- flexible enough to store subjects not yet imported locally
- close to upstream Bangumi semantics
- still practical to query from relational tables
