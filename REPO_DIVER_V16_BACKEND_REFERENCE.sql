/*
 REPO DIVER V16 — BACKEND REFERENCE ONLY
 ========================================
 DO NOT RUN THIS FILE.
 The V16 migrations below have already been applied to production project hvdrwmjieguurxvrgzfu.

 Live migrations:
   repo_diver_v16_living_postgame_20260815
   repo_diver_v16_master_checkpoint_20260815
   repo_diver_v16_crew_legacy_profile_20260815
   repo_diver_v16_master_replay_antifarm_20260815
   repo_diver_v16_master_site_proof_20260815

 Persistent V16 tables:
   public.repo_diver_postgame_state_2026
   public.repo_diver_master_expedition_catalog_2026
   public.repo_diver_master_runs_2026
   public.repo_diver_legacy_events_2026
   public.repo_diver_postgame_project_catalog_2026
   public.repo_diver_crew_epilogue_catalog_2026

 Primary player-facing V16 RPCs:
   repo_diver_get_postgame_state()
   repo_diver_begin_master_expedition(uuid,text,text,text)
   repo_diver_master_checkpoint(uuid,text,integer)
   repo_diver_finalize_master_expedition(uuid)
   repo_diver_claim_postgame_project(text)
   repo_diver_set_postgame_cosmetic(text,text)
   repo_diver_get_master_leaderboard(text)
   repo_diver_get_crew_epilogues()
   repo_diver_claim_crew_epilogue(text)
   repo_diver_claim_velmoran_legend()

 Existing repo_diver_get_public_profile(text) was extended to expose postgame-facing public
 stats only after its pre-existing privacy gate.

 Security invariants in the live definitions:
   - authenticated auth.uid() required for player mutations
   - Master Expedition must reference the caller's active Repo Diver run
   - Master biome must match the active run
   - authored-site checkpoint requires repo_diver_location_progress_2026.last_run_id = p_run_id
   - finalization requires the normal Repo Diver run to already be server-claimed
   - Ancient completion is derived from same-run repo_diver_endgame_scores_2026
   - photo objectives are derived from server photo rows
   - replay scoring is allowed, replay Renown farming is not
   - failed Master objectives grant zero Renown
   - project/epilogue claims use server-derived career metrics and are duplicate-safe
   - Velmoran Legend completion is revalidated entirely on the server
   - new V16 tables have RLS enabled and no direct anon/authenticated table grants

 Economy invariants verified after V16:
   fjord_haddock_seared     = 68 GP
   longship_lobster_grill  = 147 GP

 This file intentionally contains no executable migration body so an already-live backend
 cannot be accidentally re-applied from a frontend deployment bundle.
*/
