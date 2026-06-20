-- ──────────────────────────────────────────────────────────────────────────────
-- Stride — Supabase / Postgres Schema
-- Paste into Supabase → SQL Editor → New Query → Run
-- ──────────────────────────────────────────────────────────────────────────────

-- 1. USERS — one row per Stride account, extends auth.users
CREATE TABLE IF NOT EXISTS public.users (
    id                  UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name        TEXT        NOT NULL,
    headline            TEXT        NOT NULL DEFAULT '',
    collab_discoverable BOOLEAN     NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. CONNECTIONS — one row per linked pair; always stored lo < hi to avoid duplicates
CREATE TABLE IF NOT EXISTS public.connections (
    user_lo      UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    user_hi      UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_lo, user_hi),
    CONSTRAINT connections_sorted CHECK (user_lo < user_hi)
);

-- 3. POSTS
CREATE TABLE IF NOT EXISTS public.posts (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    author_user_id UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    kind           TEXT        NOT NULL CHECK (kind IN ('solo', 'collab')),
    pillar         TEXT,
    linkedin_urn   TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_user_id);

-- 4. COLLABORATIONS
CREATE TABLE IF NOT EXISTS public.collaborations (
    id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id  UUID        NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    event_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. COLLABORATION PARTICIPANTS
CREATE TABLE IF NOT EXISTS public.collaboration_participants (
    collaboration_id UUID NOT NULL REFERENCES public.collaborations(id) ON DELETE CASCADE,
    user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    PRIMARY KEY (collaboration_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_cp_user ON public.collaboration_participants(user_id);

-- 6. COLLAB PAIRS — fast "have these two collaborated?" lookup; sorted lo < hi
CREATE TABLE IF NOT EXISTS public.collab_pairs (
    user_lo        UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    user_hi        UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    first_collab_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_lo, user_hi),
    CONSTRAINT collab_pairs_sorted CHECK (user_lo < user_hi)
);

-- 7. QR PAIRING TOKENS — short-lived (5 min); scanning = instant consent, no confirm needed
CREATE TABLE IF NOT EXISTS public.pairing_tokens (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token_hash TEXT        NOT NULL UNIQUE,  -- sha256(raw_token) stored, never raw
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pt_hash    ON public.pairing_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_pt_expires ON public.pairing_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_pt_user    ON public.pairing_tokens(user_id);

-- 8. KEYWORD CODE PAIRING — word-triple codes; requires owner confirmation before linking
CREATE TABLE IF NOT EXISTS public.pairing_codes (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    code                 TEXT        NOT NULL UNIQUE,
    expires_at           TIMESTAMPTZ NOT NULL,
    used_at              TIMESTAMPTZ,
    pending_requester_id UUID        REFERENCES public.users(id) ON DELETE SET NULL,
    pending_at           TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pc_code    ON public.pairing_codes(code);
CREATE INDEX IF NOT EXISTS idx_pc_user    ON public.pairing_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_pc_expires ON public.pairing_codes(expires_at);

-- 9. RATE LIMIT ATTEMPTS — per-key sliding window (e.g. "redeem_code:1.2.3.4")
CREATE TABLE IF NOT EXISTS public.rate_limit_attempts (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    key          TEXT        NOT NULL,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rla_key_time ON public.rate_limit_attempts(key, attempted_at);

-- 10. PERSONAS — one living row per user; grows from paste + moments
--     user_id is not a FK so demo/anonymous sessions can write without
--     a corresponding auth.users entry.
CREATE TABLE IF NOT EXISTS public.personas (
    user_id         TEXT        PRIMARY KEY,
    roles           JSONB       NOT NULL DEFAULT '[]',
    fields          JSONB       NOT NULL DEFAULT '[]',
    pillars         JSONB       NOT NULL DEFAULT '[]',
    tone            TEXT        NOT NULL DEFAULT '',
    persona_summary TEXT        NOT NULL DEFAULT '',
    positioning     TEXT        NOT NULL DEFAULT '',
    evidence        JSONB       NOT NULL DEFAULT '[]',
    raw_inputs      TEXT        NOT NULL DEFAULT '',
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. MOMENTS — each moment is persona data AND future post material
CREATE TABLE IF NOT EXISTS public.moments (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     TEXT        NOT NULL,
    title       TEXT        NOT NULL,
    kind        TEXT        NOT NULL DEFAULT 'experience',
    happened_on DATE        NOT NULL DEFAULT CURRENT_DATE,
    bullets     JSONB       NOT NULL DEFAULT '[]',
    pillar      TEXT        NOT NULL DEFAULT '',
    photo_ref   TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_moments_user ON public.moments(user_id, created_at DESC);

-- ──────────────────────────────────────────────────────────────────────────────
-- CLEANUP FUNCTION — call periodically to purge expired tokens/codes and
-- rate-limit attempts older than 1 hour. Run manually or via pg_cron.
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.stride_cleanup() RETURNS void LANGUAGE sql AS $$
    DELETE FROM public.pairing_tokens    WHERE expires_at < now() - INTERVAL '1 hour';
    DELETE FROM public.pairing_codes     WHERE expires_at < now() - INTERVAL '1 hour';
    DELETE FROM public.rate_limit_attempts WHERE attempted_at < now() - INTERVAL '2 hours';
$$;
