-- Only the authenticated server may reconcile its cumulative earned total.
CREATE SCHEMA IF NOT EXISTS game_reward_private;
REVOKE ALL ON SCHEMA game_reward_private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA game_reward_private TO service_role;
CREATE TABLE IF NOT EXISTS game_reward_private.wallet_credits (
 user_id uuid PRIMARY KEY REFERENCES public.characters(user_id) ON DELETE CASCADE,
 credited_total bigint NOT NULL DEFAULT 0 CHECK(credited_total>=0),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE game_reward_private.wallet_credits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON game_reward_private.wallet_credits FROM PUBLIC, anon, authenticated;
GRANT SELECT,INSERT,UPDATE ON game_reward_private.wallet_credits TO service_role;

CREATE OR REPLACE FUNCTION public.credit_verified_play_rewards(p_user_id uuid,p_earned_total bigint)
RETURNS TABLE(new_gp bigint,awarded bigint)
LANGUAGE plpgsql SECURITY INVOKER SET search_path=''
AS $$
DECLARE balance bigint; credited bigint; delta bigint;
BEGIN
 IF p_user_id IS NULL OR p_earned_total IS NULL OR p_earned_total<0 OR p_earned_total>1000000000 THEN
  RAISE EXCEPTION 'Invalid verified reward total';
 END IF;
 -- Serialize with shop purchases, packs and every other update of this wallet.
 SELECT c.gp INTO balance FROM public.characters c WHERE c.user_id=p_user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Player profile unavailable'; END IF;
 INSERT INTO game_reward_private.wallet_credits(user_id) VALUES(p_user_id) ON CONFLICT DO NOTHING;
 SELECT w.credited_total INTO credited FROM game_reward_private.wallet_credits w WHERE w.user_id=p_user_id;
 delta:=greatest(0,p_earned_total-credited);
 IF delta>0 THEN
  UPDATE public.characters c SET gp=c.gp+delta WHERE c.user_id=p_user_id RETURNING c.gp INTO balance;
  UPDATE game_reward_private.wallet_credits SET credited_total=p_earned_total,updated_at=now() WHERE user_id=p_user_id;
 END IF;
 RETURN QUERY SELECT balance,delta;
END;
$$;
REVOKE ALL ON FUNCTION public.credit_verified_play_rewards(uuid,bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.credit_verified_play_rewards(uuid,bigint) TO service_role;
