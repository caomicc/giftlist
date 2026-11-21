--
-- PostgreSQL database dump
--

\restrict FTIpqeB8fELPj0iRVSFu72azz8zhLG72srWygcG1ib18SFdpCNf2TMhwmCPo21r

-- Dumped from database version 17.12 (4d8000a)
-- Dumped by pg_dump version 17.12

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: neon_auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA neon_auth;


--
-- Name: update_gift_card_total(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_gift_card_total() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE gift_items
  SET gift_card_total_purchased = (
    SELECT COALESCE(SUM(amount), 0)
    FROM gift_card_purchases
    WHERE gift_item_id = COALESCE(NEW.gift_item_id, OLD.gift_item_id)
  )
  WHERE id = COALESCE(NEW.gift_item_id, OLD.gift_item_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: update_lists_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_lists_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: users_sync; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.users_sync (
    raw_json jsonb NOT NULL,
    id text GENERATED ALWAYS AS ((raw_json ->> 'id'::text)) STORED NOT NULL,
    name text GENERATED ALWAYS AS ((raw_json ->> 'display_name'::text)) STORED,
    email text GENERATED ALWAYS AS ((raw_json ->> 'primary_email'::text)) STORED,
    created_at timestamp with time zone GENERATED ALWAYS AS (to_timestamp((trunc((((raw_json ->> 'signed_up_at_millis'::text))::bigint)::double precision) / (1000)::double precision))) STORED,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    provider character varying(50) NOT NULL,
    provider_account_id character varying(255) NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type character varying(50),
    scope text,
    id_token text,
    session_state text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: amazon_products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.amazon_products (
    asin text NOT NULL,
    url text NOT NULL,
    title text,
    description text,
    image_url text,
    price text,
    currency text,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: gift_card_purchases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gift_card_purchases (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    gift_item_id uuid NOT NULL,
    purchaser_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: gift_interest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gift_interest (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    gift_item_id text NOT NULL,
    user_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: gift_item_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gift_item_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    gift_item_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: gift_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gift_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    price text,
    link text,
    owner_id uuid NOT NULL,
    purchased_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_gift_card boolean DEFAULT false,
    gift_card_target_amount numeric(10,2) DEFAULT NULL::numeric,
    gift_card_total_purchased numeric(10,2) DEFAULT 0.00,
    og_title text,
    og_description text,
    og_image text,
    og_site_name text,
    archived boolean DEFAULT false,
    list_id uuid NOT NULL,
    image_url text,
    is_group_gift boolean DEFAULT false,
    suggested_by_id text,
    is_anonymous_suggestion boolean DEFAULT false
);


--
-- Name: COLUMN gift_items.image_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.gift_items.image_url IS 'Manual image URL provided by user when OG image is not available';


--
-- Name: gift_suggestions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gift_suggestions (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    suggested_by_id text NOT NULL,
    target_user_id text NOT NULL,
    name text NOT NULL,
    description text,
    price text,
    link text,
    image_url text,
    is_anonymous boolean DEFAULT false,
    status text DEFAULT 'pending'::text,
    denial_reason text,
    og_title text,
    og_description text,
    og_image text,
    og_site_name text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT gift_suggestions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'denied'::text])))
);


--
-- Name: list_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.list_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    list_id uuid NOT NULL,
    user_id uuid NOT NULL,
    can_view boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: lists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    owner_id uuid NOT NULL,
    is_public boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_visible boolean DEFAULT true NOT NULL
);


--
-- Name: COLUMN lists.is_public; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lists.is_public IS 'Controls whether purchase status is shown to list owner. TRUE = show purchases, FALSE = hide purchases';


--
-- Name: COLUMN lists.is_visible; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lists.is_visible IS 'Controls whether list is shown to other family members. TRUE = visible to others, FALSE = hidden from others';


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_token character varying(255) NOT NULL,
    user_id uuid NOT NULL,
    expires timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(255),
    image text,
    email_verified timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    password_hash character varying(255),
    preferred_locale character varying(5) DEFAULT 'en'::character varying
);


--
-- Name: verification_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification_tokens (
    identifier character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    expires timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: users_sync users_sync_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.users_sync
    ADD CONSTRAINT users_sync_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_provider_provider_account_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_provider_provider_account_id_key UNIQUE (provider, provider_account_id);


--
-- Name: amazon_products amazon_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.amazon_products
    ADD CONSTRAINT amazon_products_pkey PRIMARY KEY (asin);


--
-- Name: gift_card_purchases gift_card_purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_card_purchases
    ADD CONSTRAINT gift_card_purchases_pkey PRIMARY KEY (id);


--
-- Name: gift_interest gift_interest_gift_item_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_interest
    ADD CONSTRAINT gift_interest_gift_item_id_user_id_key UNIQUE (gift_item_id, user_id);


--
-- Name: gift_interest gift_interest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_interest
    ADD CONSTRAINT gift_interest_pkey PRIMARY KEY (id);


--
-- Name: gift_item_comments gift_item_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_item_comments
    ADD CONSTRAINT gift_item_comments_pkey PRIMARY KEY (id);


--
-- Name: gift_items gift_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_items
    ADD CONSTRAINT gift_items_pkey PRIMARY KEY (id);


--
-- Name: gift_suggestions gift_suggestions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_suggestions
    ADD CONSTRAINT gift_suggestions_pkey PRIMARY KEY (id);


--
-- Name: list_permissions list_permissions_list_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.list_permissions
    ADD CONSTRAINT list_permissions_list_id_user_id_key UNIQUE (list_id, user_id);


--
-- Name: list_permissions list_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.list_permissions
    ADD CONSTRAINT list_permissions_pkey PRIMARY KEY (id);


--
-- Name: lists lists_name_owner_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lists
    ADD CONSTRAINT lists_name_owner_unique UNIQUE (name, owner_id);


--
-- Name: lists lists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lists
    ADD CONSTRAINT lists_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_session_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_session_token_key UNIQUE (session_token);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: verification_tokens verification_tokens_identifier_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT verification_tokens_identifier_token_key UNIQUE (identifier, token);


--
-- Name: users_sync_deleted_at_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX users_sync_deleted_at_idx ON neon_auth.users_sync USING btree (deleted_at);


--
-- Name: idx_accounts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accounts_user_id ON public.accounts USING btree (user_id);


--
-- Name: idx_comments_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_created_at ON public.gift_item_comments USING btree (created_at DESC);


--
-- Name: idx_comments_gift_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_gift_item ON public.gift_item_comments USING btree (gift_item_id);


--
-- Name: idx_comments_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_user ON public.gift_item_comments USING btree (user_id);


--
-- Name: idx_gift_card_purchases_gift_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gift_card_purchases_gift_item_id ON public.gift_card_purchases USING btree (gift_item_id);


--
-- Name: idx_gift_card_purchases_purchaser_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gift_card_purchases_purchaser_id ON public.gift_card_purchases USING btree (purchaser_id);


--
-- Name: idx_gift_interest_gift_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gift_interest_gift_item_id ON public.gift_interest USING btree (gift_item_id);


--
-- Name: idx_gift_interest_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gift_interest_user_id ON public.gift_interest USING btree (user_id);


--
-- Name: idx_gift_items_archived; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gift_items_archived ON public.gift_items USING btree (archived);


--
-- Name: idx_gift_items_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gift_items_created_at ON public.gift_items USING btree (created_at DESC);


--
-- Name: idx_gift_items_is_gift_card; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gift_items_is_gift_card ON public.gift_items USING btree (is_gift_card);


--
-- Name: idx_gift_items_is_group_gift; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gift_items_is_group_gift ON public.gift_items USING btree (is_group_gift);


--
-- Name: idx_gift_items_list_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gift_items_list_id ON public.gift_items USING btree (list_id);


--
-- Name: idx_gift_items_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gift_items_owner_id ON public.gift_items USING btree (owner_id);


--
-- Name: idx_gift_items_purchased_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gift_items_purchased_by ON public.gift_items USING btree (purchased_by);


--
-- Name: idx_gift_items_suggested_by_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gift_items_suggested_by_id ON public.gift_items USING btree (suggested_by_id);


--
-- Name: idx_gift_suggestions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gift_suggestions_status ON public.gift_suggestions USING btree (status);


--
-- Name: idx_gift_suggestions_suggested_by_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gift_suggestions_suggested_by_id ON public.gift_suggestions USING btree (suggested_by_id);


--
-- Name: idx_gift_suggestions_target_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gift_suggestions_target_user_id ON public.gift_suggestions USING btree (target_user_id);


--
-- Name: idx_list_permissions_list_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_list_permissions_list_id ON public.list_permissions USING btree (list_id);


--
-- Name: idx_list_permissions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_list_permissions_user_id ON public.list_permissions USING btree (user_id);


--
-- Name: idx_lists_is_public; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lists_is_public ON public.lists USING btree (is_public);


--
-- Name: idx_lists_is_visible; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lists_is_visible ON public.lists USING btree (is_visible);


--
-- Name: idx_lists_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lists_owner_id ON public.lists USING btree (owner_id);


--
-- Name: idx_sessions_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_token ON public.sessions USING btree (session_token);


--
-- Name: idx_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_preferred_locale; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_preferred_locale ON public.users USING btree (preferred_locale);


--
-- Name: idx_verification_tokens_identifier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_verification_tokens_identifier ON public.verification_tokens USING btree (identifier);


--
-- Name: idx_verification_tokens_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_verification_tokens_token ON public.verification_tokens USING btree (token);


--
-- Name: gift_card_purchases update_gift_card_total_on_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_gift_card_total_on_delete AFTER DELETE ON public.gift_card_purchases FOR EACH ROW EXECUTE FUNCTION public.update_gift_card_total();


--
-- Name: gift_card_purchases update_gift_card_total_on_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_gift_card_total_on_insert AFTER INSERT ON public.gift_card_purchases FOR EACH ROW EXECUTE FUNCTION public.update_gift_card_total();


--
-- Name: gift_card_purchases update_gift_card_total_on_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_gift_card_total_on_update AFTER UPDATE ON public.gift_card_purchases FOR EACH ROW EXECUTE FUNCTION public.update_gift_card_total();


--
-- Name: gift_items update_gift_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_gift_items_updated_at BEFORE UPDATE ON public.gift_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: lists update_lists_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_lists_updated_at BEFORE UPDATE ON public.lists FOR EACH ROW EXECUTE FUNCTION public.update_lists_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: accounts accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: gift_item_comments gift_item_comments_gift_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_item_comments
    ADD CONSTRAINT gift_item_comments_gift_item_id_fkey FOREIGN KEY (gift_item_id) REFERENCES public.gift_items(id) ON DELETE CASCADE;


--
-- Name: gift_item_comments gift_item_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_item_comments
    ADD CONSTRAINT gift_item_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: gift_items gift_items_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_items
    ADD CONSTRAINT gift_items_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.lists(id) ON DELETE CASCADE;


--
-- Name: gift_items gift_items_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_items
    ADD CONSTRAINT gift_items_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: gift_items gift_items_purchased_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_items
    ADD CONSTRAINT gift_items_purchased_by_fkey FOREIGN KEY (purchased_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: list_permissions list_permissions_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.list_permissions
    ADD CONSTRAINT list_permissions_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.lists(id) ON DELETE CASCADE;


--
-- Name: list_permissions list_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.list_permissions
    ADD CONSTRAINT list_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: lists lists_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lists
    ADD CONSTRAINT lists_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict FTIpqeB8fELPj0iRVSFu72azz8zhLG72srWygcG1ib18SFdpCNf2TMhwmCPo21r

