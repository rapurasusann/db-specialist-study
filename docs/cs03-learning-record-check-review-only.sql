-- REVIEW ONLY; do not execute without separate isolated database approval.
-- Existing deployed constraint name/definition must be verified first.
BEGIN;
DO $$ BEGIN
 IF current_database() <> 'cs03_auth_sandbox' THEN RAISE EXCEPTION 'WRONG_DATABASE'; END IF;
END $$;
ALTER TABLE public.study_progress ADD CONSTRAINT cs03_learning_question_id_check CHECK (question_id ~ '^(20[0-9]{2}:(am1|am2|pm1|pm2):([1-9]|[1-9][0-9]|100)|term:(nf-1|nf-2|nf-3|ra-select|ra-project|ra-union|ra-intersect|ra-difference|ra-product|ra-join|ra-division|ra-rename|iso-ru|iso-rc|iso-rr|iso-ser|iso-dirty|iso-nonrepeat|iso-phantom|xp-pair|xp-tdd|xp-ci|xp-refactor|xp-collective|xp-simple|xp-small|xp-customer|xp-pace|xp-standard|crypto-symmetric|crypto-public|crypto-aes|crypto-rsa|crypto-hash|crypto-sign|crypto-hmac|crypto-hybrid|crypto-ecdh|crypto-forward|crypto-nonce|crypto-salt|crypto-aead|con-immediate|con-deferred|con-deferrable|con-set-constraints|con-initially-immediate|con-initially-deferred|con-unique|con-transaction)|step:[2-5]:[1-5]:([1-9]|10))$');
-- Old check remains in place until its identity and exact definition are verified.
-- Deliberately roll back: this is a review artifact, not an executable migration.
ROLLBACK;
