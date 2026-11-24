# scoring

Readiness score 0-100 (PRD §3.4). `compute_readiness_score(ScoreInput)` is pure: weights from `rules/{track}.yaml`, Decimal maths, every lost point has a bilingual reason. Overridden failures cost nothing.

TODO(PRD §6.2): `GET /claims/{id}/score` router + `score_snapshots` repository.
