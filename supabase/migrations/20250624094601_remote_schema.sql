

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."is_staff"("uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
  RETURN (SELECT (EXISTS (SELECT public.staffs.id FROM staffs WHERE (public.staffs.id = uuid))) AS "exists");
END;$$;


ALTER FUNCTION "public"."is_staff"("uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."register_default_role_on_signup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
    INSERT INTO public.users(id, first_name, last_name)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name'
    );
  
  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."register_default_role_on_signup"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_staff_as_user"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$ 
BEGIN
    INSERT INTO public.users (id, first_name, last_name, photo, created_at) 
    VALUES (new.id, new.first_name, new.last_name, new.photo, new.created_at);
    DELETE FROM public.staffs WHERE role = 'User';

    return null;
END;
$$;


ALTER FUNCTION "public"."set_staff_as_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_user_as_staff"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$ 
BEGIN
    INSERT INTO public.staffs (id, first_name, last_name, photo, created_at) 
    VALUES (new.id, new.first_name, new.last_name, new.photo, new.created_at);
    DELETE FROM public.users WHERE role = 'Staff';

    return null;
END;
$$;


ALTER FUNCTION "public"."set_user_as_staff"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."staff_verification"("uuid" "uuid", "permission_denied_message" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$DECLARE
    is_authenticated_as_staff boolean := (
      SELECT
        CASE
            WHEN ((SELECT (EXISTS ( SELECT staffs.id
                       FROM staffs
                      WHERE ((staffs.id = uuid) AND (staffs.is_active = true)))) AS "exists") AND ( SELECT (EXISTS ( SELECT sessions.user_id
                       FROM auth.sessions
                      WHERE (sessions.user_id = uuid))) AS "exists")) THEN true
            ELSE false
        END AS result
      );

BEGIN
  IF (is_authenticated_as_staff = false AND LENGTH(permission_denied_message) > 0) then
    RAISE EXCEPTION USING MESSAGE = permission_denied_message;
  END IF;

  RETURN is_authenticated_as_staff;
END;$$;


ALTER FUNCTION "public"."staff_verification"("uuid" "uuid", "permission_denied_message" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."staff_verification_with_raise_message"("uuid" "uuid", "text_message" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$DECLARE
    is_staff boolean := (SELECT (EXISTS (SELECT public.staffs.id FROM staffs WHERE (public.staffs.id = uuid))) AS "exists");

BEGIN
  IF (is_staff = false) then
    RAISE EXCEPTION USING MESSAGE = text_message;
  END IF;

  RETURN is_staff;
END;$$;


ALTER FUNCTION "public"."staff_verification_with_raise_message"("uuid" "uuid", "text_message" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_update_users_role"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
  IF ((NEW.role <> OLD.role) AND (SELECT (EXISTS ( SELECT public.staffs.id FROM public.staffs WHERE (public.staffs.id = auth.uid()))) AS "exists") = false) THEN
    RAISE EXCEPTION 'Operation not allowed';
  END IF;
  
  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."verify_update_users_role"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."staffs" (
    "id" "uuid" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "is_active" boolean DEFAULT false,
    "photo" "jsonb",
    "role" "text" DEFAULT 'Staff'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."staffs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tours" (
    "id" bigint NOT NULL,
    "name" "text",
    "capacity" smallint,
    "city" "text",
    "description" "text",
    "photos" "jsonb"[],
    "price" integer,
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "availability" smallint DEFAULT '0'::smallint,
    "is_published" boolean DEFAULT false,
    "slug" "text"
);


ALTER TABLE "public"."tours" OWNER TO "postgres";


ALTER TABLE "public"."tours" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."tours_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "photo" "jsonb",
    "role" "text" DEFAULT 'User'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."staffs"
    ADD CONSTRAINT "staffs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tours"
    ADD CONSTRAINT "tours_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tours"
    ADD CONSTRAINT "tours_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "trigger_set_staff_as_user" AFTER UPDATE OF "role" ON "public"."staffs" FOR EACH ROW WHEN (("new"."role" = 'User'::"text")) EXECUTE FUNCTION "public"."set_staff_as_user"();



CREATE OR REPLACE TRIGGER "trigger_set_user_as_staff" AFTER UPDATE OF "role" ON "public"."users" FOR EACH ROW WHEN (("new"."role" = 'Staff'::"text")) EXECUTE FUNCTION "public"."set_user_as_staff"();



CREATE OR REPLACE TRIGGER "trigger_verify_update_users_role" BEFORE UPDATE OF "role" ON "public"."users" FOR EACH ROW WHEN (("new"."role" <> "old"."role")) EXECUTE FUNCTION "public"."verify_update_users_role"();



ALTER TABLE ONLY "public"."staffs"
    ADD CONSTRAINT "staffs_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tours"
    ADD CONSTRAINT "tours_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "INSERT limited to staffs only" ON "public"."staffs" FOR INSERT TO "authenticated" WITH CHECK ("public"."staff_verification"("auth"."uid"(), 'Access is prohibited'::"text"));



CREATE POLICY "Only active staff can do data creation" ON "public"."tours" FOR INSERT TO "authenticated" WITH CHECK ("public"."staff_verification"("auth"."uid"(), 'Access is prohibited'::"text"));



CREATE POLICY "Only active staffs can do deletion" ON "public"."tours" FOR DELETE TO "authenticated" USING ("public"."staff_verification"("auth"."uid"(), 'Access is prohibited'::"text"));



CREATE POLICY "Only active staffs can do update" ON "public"."tours" FOR UPDATE TO "authenticated" USING ("public"."staff_verification"("auth"."uid"(), 'Access is prohibited'::"text"));



CREATE POLICY "Only return published tours for public" ON "public"."tours" FOR SELECT TO "anon" USING (("is_published" = true));



CREATE POLICY "SELECT Allowed for general user with their related data" ON "public"."users" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "id") OR "public"."staff_verification"("auth"."uid"(), 'Access is prohibited'::"text")));



CREATE POLICY "SELECT limited to staffs only" ON "public"."staffs" FOR SELECT TO "authenticated" USING ("public"."staff_verification"("auth"."uid"(), 'Access is prohibited'::"text"));



CREATE POLICY "Staff are allowed to read all data whether published or not" ON "public"."tours" FOR SELECT TO "authenticated" USING (("public"."staff_verification"("auth"."uid"(), ''::"text") OR ("is_published" = true)));



CREATE POLICY "UPDATE Staff on any data & general user with their related data" ON "public"."users" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "id") OR "public"."staff_verification"("auth"."uid"(), 'Access is prohibited'::"text")));



CREATE POLICY "UPDATE limited to staffs only" ON "public"."staffs" FOR UPDATE TO "authenticated" USING ("public"."staff_verification"("auth"."uid"(), 'Access is prohibited'::"text"));



ALTER TABLE "public"."staffs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tours" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."is_staff"("uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_staff"("uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_staff"("uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."register_default_role_on_signup"() TO "anon";
GRANT ALL ON FUNCTION "public"."register_default_role_on_signup"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."register_default_role_on_signup"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_staff_as_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_staff_as_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_staff_as_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_user_as_staff"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_user_as_staff"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_user_as_staff"() TO "service_role";



GRANT ALL ON FUNCTION "public"."staff_verification"("uuid" "uuid", "permission_denied_message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."staff_verification"("uuid" "uuid", "permission_denied_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."staff_verification"("uuid" "uuid", "permission_denied_message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."staff_verification_with_raise_message"("uuid" "uuid", "text_message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."staff_verification_with_raise_message"("uuid" "uuid", "text_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."staff_verification_with_raise_message"("uuid" "uuid", "text_message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_update_users_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."verify_update_users_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_update_users_role"() TO "service_role";



























GRANT ALL ON TABLE "public"."staffs" TO "anon";
GRANT ALL ON TABLE "public"."staffs" TO "authenticated";
GRANT ALL ON TABLE "public"."staffs" TO "service_role";



GRANT ALL ON TABLE "public"."tours" TO "anon";
GRANT ALL ON TABLE "public"."tours" TO "authenticated";
GRANT ALL ON TABLE "public"."tours" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tours_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tours_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tours_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
