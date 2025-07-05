// > natours-backend@1.0.0 supabase /home/andre/Candradimuka/natours/supabase
// > supabase gen types typescript --local

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      availability_exceptions: {
        Row: {
          created_at: string | null;
          id: number;
          reason: string | null;
          tour_id: number;
          unavailable_date: string;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          reason?: string | null;
          tour_id: number;
          unavailable_date: string;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          reason?: string | null;
          tour_id?: number;
          unavailable_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "availability_exceptions_tour_id_fkey";
            columns: ["tour_id"];
            isOneToOne: false;
            referencedRelation: "tours";
            referencedColumns: ["id"];
          },
        ];
      };
      availability_rules: {
        Row: {
          created_at: string | null;
          days_of_week: number[] | null;
          end_date: string | null;
          id: number;
          start_date: string;
          start_time: string;
          tour_id: number;
        };
        Insert: {
          created_at?: string | null;
          days_of_week?: number[] | null;
          end_date?: string | null;
          id?: number;
          start_date: string;
          start_time: string;
          tour_id: number;
        };
        Update: {
          created_at?: string | null;
          days_of_week?: number[] | null;
          end_date?: string | null;
          id?: number;
          start_date?: string;
          start_time?: string;
          tour_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "availability_rules_tour_id_fkey";
            columns: ["tour_id"];
            isOneToOne: false;
            referencedRelation: "tours";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: {
          created_at: string | null;
          currency_paid: string;
          customer_id: string;
          expires_at: string | null;
          id: number;
          price_paid: number;
          seats_booked: number;
          status: Database["public"]["Enums"]["booking_status"];
          tour_schedule_id: number;
        };
        Insert: {
          created_at?: string | null;
          currency_paid: string;
          customer_id: string;
          expires_at?: string | null;
          id?: number;
          price_paid: number;
          seats_booked: number;
          status?: Database["public"]["Enums"]["booking_status"];
          tour_schedule_id: number;
        };
        Update: {
          created_at?: string | null;
          currency_paid?: string;
          customer_id?: string;
          expires_at?: string | null;
          id?: number;
          price_paid?: number;
          seats_booked?: number;
          status?: Database["public"]["Enums"]["booking_status"];
          tour_schedule_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_tour_schedule_id_fkey";
            columns: ["tour_schedule_id"];
            isOneToOne: false;
            referencedRelation: "tour_schedules";
            referencedColumns: ["id"];
          },
        ];
      };
      legacy_staffs: {
        Row: {
          created_at: string | null;
          first_name: string | null;
          id: string;
          is_active: boolean | null;
          last_name: string | null;
          photo: Json | null;
          role: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          first_name?: string | null;
          id: string;
          is_active?: boolean | null;
          last_name?: string | null;
          photo?: Json | null;
          role?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          first_name?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_name?: string | null;
          photo?: Json | null;
          role?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      legacy_tours: {
        Row: {
          availability: number | null;
          capacity: number | null;
          city: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: number;
          is_published: boolean | null;
          name: string | null;
          photos: Json[] | null;
          price: number | null;
          slug: string | null;
          updated_at: string | null;
        };
        Insert: {
          availability?: number | null;
          capacity?: number | null;
          city?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: number;
          is_published?: boolean | null;
          name?: string | null;
          photos?: Json[] | null;
          price?: number | null;
          slug?: string | null;
          updated_at?: string | null;
        };
        Update: {
          availability?: number | null;
          capacity?: number | null;
          city?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: number;
          is_published?: boolean | null;
          name?: string | null;
          photos?: Json[] | null;
          price?: number | null;
          slug?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      legacy_users: {
        Row: {
          created_at: string | null;
          first_name: string | null;
          id: string;
          last_name: string | null;
          photo: Json | null;
          role: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          first_name?: string | null;
          id: string;
          last_name?: string | null;
          photo?: Json | null;
          role?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          photo?: Json | null;
          role?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      locations: {
        Row: {
          created_at: string | null;
          geog: unknown | null;
          id: number;
          iso_code_alpha2: string | null;
          level: Database["public"]["Enums"]["location_level"];
          name: string;
          parent_id: number | null;
        };
        Insert: {
          created_at?: string | null;
          geog?: unknown | null;
          id?: number;
          iso_code_alpha2?: string | null;
          level: Database["public"]["Enums"]["location_level"];
          name: string;
          parent_id?: number | null;
        };
        Update: {
          created_at?: string | null;
          geog?: unknown | null;
          id?: number;
          iso_code_alpha2?: string | null;
          level?: Database["public"]["Enums"]["location_level"];
          name?: string;
          parent_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "locations_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
        ];
      };
      partners: {
        Row: {
          contact_email: string | null;
          created_at: string | null;
          description: string | null;
          id: number;
          is_verified: boolean | null;
          name: string;
          website_url: string | null;
        };
        Insert: {
          contact_email?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: number;
          is_verified?: boolean | null;
          name: string;
          website_url?: string | null;
        };
        Update: {
          contact_email?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: number;
          is_verified?: boolean | null;
          name?: string;
          website_url?: string | null;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount: number;
          booking_id: number;
          created_at: string | null;
          currency: string;
          id: number;
          provider: string | null;
          provider_payment_id: string | null;
          status: Database["public"]["Enums"]["payment_status"];
          stripe_session_id: string | null;
        };
        Insert: {
          amount: number;
          booking_id: number;
          created_at?: string | null;
          currency: string;
          id?: number;
          provider?: string | null;
          provider_payment_id?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          stripe_session_id?: string | null;
        };
        Update: {
          amount?: number;
          booking_id?: number;
          created_at?: string | null;
          currency?: string;
          id?: number;
          provider?: string | null;
          provider_payment_id?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          stripe_session_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          first_name: string | null;
          id: string;
          is_active: boolean | null;
          last_name: string | null;
          partner_id: number | null;
          role: Database["public"]["Enums"]["app_role"];
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          first_name?: string | null;
          id: string;
          is_active?: boolean | null;
          last_name?: string | null;
          partner_id?: number | null;
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          first_name?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_name?: string | null;
          partner_id?: number | null;
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_partner_id_fkey";
            columns: ["partner_id"];
            isOneToOne: false;
            referencedRelation: "partners";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          created_at: string | null;
          customer_id: string;
          id: number;
          rating: number;
          review_text: string;
          tour_id: number;
        };
        Insert: {
          created_at?: string | null;
          customer_id: string;
          id?: number;
          rating: number;
          review_text: string;
          tour_id: number;
        };
        Update: {
          created_at?: string | null;
          customer_id?: string;
          id?: number;
          rating?: number;
          review_text?: string;
          tour_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_tour_id_fkey";
            columns: ["tour_id"];
            isOneToOne: false;
            referencedRelation: "tours";
            referencedColumns: ["id"];
          },
        ];
      };
      spatial_ref_sys: {
        Row: {
          auth_name: string | null;
          auth_srid: number | null;
          proj4text: string | null;
          srid: number;
          srtext: string | null;
        };
        Insert: {
          auth_name?: string | null;
          auth_srid?: number | null;
          proj4text?: string | null;
          srid: number;
          srtext?: string | null;
        };
        Update: {
          auth_name?: string | null;
          auth_srid?: number | null;
          proj4text?: string | null;
          srid?: number;
          srtext?: string | null;
        };
        Relationships: [];
      };
      tour_guides: {
        Row: {
          guide_id: string;
          tour_schedule_id: number;
        };
        Insert: {
          guide_id: string;
          tour_schedule_id: number;
        };
        Update: {
          guide_id?: string;
          tour_schedule_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "tour_guides_guide_id_fkey";
            columns: ["guide_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tour_guides_tour_schedule_id_fkey";
            columns: ["tour_schedule_id"];
            isOneToOne: false;
            referencedRelation: "tour_schedules";
            referencedColumns: ["id"];
          },
        ];
      };
      tour_locations: {
        Row: {
          day_of_tour: number;
          description: string | null;
          location_id: number;
          tour_id: number;
        };
        Insert: {
          day_of_tour: number;
          description?: string | null;
          location_id: number;
          tour_id: number;
        };
        Update: {
          day_of_tour?: number;
          description?: string | null;
          location_id?: number;
          tour_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "tour_locations_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tour_locations_tour_id_fkey";
            columns: ["tour_id"];
            isOneToOne: false;
            referencedRelation: "tours";
            referencedColumns: ["id"];
          },
        ];
      };
      tour_schedules: {
        Row: {
          created_at: string | null;
          id: number;
          seats_available: number;
          start_date: string;
          start_location_id: number;
          tour_id: number;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          seats_available: number;
          start_date: string;
          start_location_id: number;
          tour_id: number;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          seats_available?: number;
          start_date?: string;
          start_location_id?: number;
          tour_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "tour_schedules_start_location_id_fkey";
            columns: ["start_location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tour_schedules_tour_id_fkey";
            columns: ["tour_id"];
            isOneToOne: false;
            referencedRelation: "tours";
            referencedColumns: ["id"];
          },
        ];
      };
      tours: {
        Row: {
          created_at: string | null;
          currency: string;
          description: string | null;
          difficulty: Database["public"]["Enums"]["tour_difficulty"];
          duration_days: number;
          id: number;
          image_cover: string | null;
          images: string | null;
          max_group_size: number;
          min_booking_size: number;
          name: string;
          partner_id: number | null;
          price: number;
          slug: string;
          summary: string;
        };
        Insert: {
          created_at?: string | null;
          currency?: string;
          description?: string | null;
          difficulty: Database["public"]["Enums"]["tour_difficulty"];
          duration_days: number;
          id?: number;
          image_cover?: string | null;
          images?: string | null;
          max_group_size: number;
          min_booking_size?: number;
          name: string;
          partner_id?: number | null;
          price: number;
          slug: string;
          summary: string;
        };
        Update: {
          created_at?: string | null;
          currency?: string;
          description?: string | null;
          difficulty?: Database["public"]["Enums"]["tour_difficulty"];
          duration_days?: number;
          id?: number;
          image_cover?: string | null;
          images?: string | null;
          max_group_size?: number;
          min_booking_size?: number;
          name?: string;
          partner_id?: number | null;
          price?: number;
          slug?: string;
          summary?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tours_partner_id_fkey";
            columns: ["partner_id"];
            isOneToOne: false;
            referencedRelation: "partners";
            referencedColumns: ["id"];
          },
        ];
      };
      wishlists: {
        Row: {
          created_at: string | null;
          tour_id: number;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          tour_id: number;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          tour_id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wishlists_tour_id_fkey";
            columns: ["tour_id"];
            isOneToOne: false;
            referencedRelation: "tours";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wishlists_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null;
          f_geography_column: unknown | null;
          f_table_catalog: unknown | null;
          f_table_name: unknown | null;
          f_table_schema: unknown | null;
          srid: number | null;
          type: string | null;
        };
        Relationships: [];
      };
      geometry_columns: {
        Row: {
          coord_dimension: number | null;
          f_geometry_column: unknown | null;
          f_table_catalog: string | null;
          f_table_name: unknown | null;
          f_table_schema: unknown | null;
          srid: number | null;
          type: string | null;
        };
        Insert: {
          coord_dimension?: number | null;
          f_geometry_column?: unknown | null;
          f_table_catalog?: string | null;
          f_table_name?: unknown | null;
          f_table_schema?: unknown | null;
          srid?: number | null;
          type?: string | null;
        };
        Update: {
          coord_dimension?: number | null;
          f_geometry_column?: unknown | null;
          f_table_catalog?: string | null;
          f_table_name?: unknown | null;
          f_table_schema?: unknown | null;
          srid?: number | null;
          type?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      _postgis_deprecate: {
        Args: { version: string; oldname: string; newname: string };
        Returns: undefined;
      };
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown };
        Returns: unknown;
      };
      _postgis_pgsql_version: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      _postgis_scripts_pgsql_version: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      _postgis_selectivity: {
        Args: { mode?: string; att_name: string; tbl: unknown; geom: unknown };
        Returns: number;
      };
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      _st_bestsrid: {
        Args: { "": unknown };
        Returns: number;
      };
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      _st_coveredby: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom2: unknown; geom1: unknown };
        Returns: boolean;
      };
      _st_covers: {
        Args:
          | { geog2: unknown; geog1: unknown }
          | { geom2: unknown; geom1: unknown };
        Returns: boolean;
      };
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      _st_dwithin: {
        Args: {
          geog1: unknown;
          use_spheroid?: boolean;
          tolerance: number;
          geog2: unknown;
        };
        Returns: boolean;
      };
      _st_equals: {
        Args: { geom2: unknown; geom1: unknown };
        Returns: boolean;
      };
      _st_intersects: {
        Args: { geom2: unknown; geom1: unknown };
        Returns: boolean;
      };
      _st_linecrossingdirection: {
        Args: { line2: unknown; line1: unknown };
        Returns: number;
      };
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: unknown;
      };
      _st_maxdistance: {
        Args: { geom2: unknown; geom1: unknown };
        Returns: number;
      };
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      _st_overlaps: {
        Args: { geom2: unknown; geom1: unknown };
        Returns: boolean;
      };
      _st_pointoutside: {
        Args: { "": unknown };
        Returns: unknown;
      };
      _st_sortablehash: {
        Args: { geom: unknown };
        Returns: number;
      };
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      _st_voronoi: {
        Args: {
          g1: unknown;
          return_polygons?: boolean;
          tolerance?: number;
          clip?: unknown;
        };
        Returns: unknown;
      };
      _st_within: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      addauth: {
        Args: { "": string };
        Returns: boolean;
      };
      addgeometrycolumn: {
        Args:
          | {
              catalog_name: string;
              schema_name: string;
              table_name: string;
              column_name: string;
              new_srid_in: number;
              new_type: string;
              new_dim: number;
              use_typmod?: boolean;
            }
          | {
              column_name: string;
              new_srid: number;
              use_typmod?: boolean;
              new_dim: number;
              new_type: string;
              table_name: string;
              schema_name: string;
            }
          | {
              new_type: string;
              use_typmod?: boolean;
              table_name: string;
              column_name: string;
              new_srid: number;
              new_dim: number;
            };
        Returns: string;
      };
      box: {
        Args: { "": unknown } | { "": unknown };
        Returns: unknown;
      };
      box2d: {
        Args: { "": unknown } | { "": unknown };
        Returns: unknown;
      };
      box2d_in: {
        Args: { "": unknown };
        Returns: unknown;
      };
      box2d_out: {
        Args: { "": unknown };
        Returns: unknown;
      };
      box2df_in: {
        Args: { "": unknown };
        Returns: unknown;
      };
      box2df_out: {
        Args: { "": unknown };
        Returns: unknown;
      };
      box3d: {
        Args: { "": unknown } | { "": unknown };
        Returns: unknown;
      };
      box3d_in: {
        Args: { "": unknown };
        Returns: unknown;
      };
      box3d_out: {
        Args: { "": unknown };
        Returns: unknown;
      };
      box3dtobox: {
        Args: { "": unknown };
        Returns: unknown;
      };
      bytea: {
        Args: { "": unknown } | { "": unknown };
        Returns: string;
      };
      disablelongtransactions: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      dropgeometrycolumn: {
        Args:
          | {
              catalog_name: string;
              column_name: string;
              table_name: string;
              schema_name: string;
            }
          | { table_name: string; column_name: string }
          | { table_name: string; column_name: string; schema_name: string };
        Returns: string;
      };
      dropgeometrytable: {
        Args:
          | { table_name: string }
          | { table_name: string; catalog_name: string; schema_name: string }
          | { table_name: string; schema_name: string };
        Returns: string;
      };
      enablelongtransactions: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      equals: {
        Args: { geom2: unknown; geom1: unknown };
        Returns: boolean;
      };
      geography: {
        Args: { "": string } | { "": unknown };
        Returns: unknown;
      };
      geography_analyze: {
        Args: { "": unknown };
        Returns: boolean;
      };
      geography_gist_compress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      geography_gist_decompress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      geography_out: {
        Args: { "": unknown };
        Returns: unknown;
      };
      geography_send: {
        Args: { "": unknown };
        Returns: string;
      };
      geography_spgist_compress_nd: {
        Args: { "": unknown };
        Returns: unknown;
      };
      geography_typmod_in: {
        Args: { "": unknown[] };
        Returns: number;
      };
      geography_typmod_out: {
        Args: { "": number };
        Returns: unknown;
      };
      geometry: {
        Args:
          | { "": string }
          | { "": string }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown };
        Returns: unknown;
      };
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_analyze: {
        Args: { "": unknown };
        Returns: boolean;
      };
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_cmp: {
        Args: { geom2: unknown; geom1: unknown };
        Returns: number;
      };
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_contains: {
        Args: { geom2: unknown; geom1: unknown };
        Returns: boolean;
      };
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_distance_box: {
        Args: { geom2: unknown; geom1: unknown };
        Returns: number;
      };
      geometry_distance_centroid: {
        Args: { geom2: unknown; geom1: unknown };
        Returns: number;
      };
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_ge: {
        Args: { geom2: unknown; geom1: unknown };
        Returns: boolean;
      };
      geometry_gist_compress_2d: {
        Args: { "": unknown };
        Returns: unknown;
      };
      geometry_gist_compress_nd: {
        Args: { "": unknown };
        Returns: unknown;
      };
      geometry_gist_decompress_2d: {
        Args: { "": unknown };
        Returns: unknown;
      };
      geometry_gist_decompress_nd: {
        Args: { "": unknown };
        Returns: unknown;
      };
      geometry_gist_sortsupport_2d: {
        Args: { "": unknown };
        Returns: undefined;
      };
      geometry_gt: {
        Args: { geom2: unknown; geom1: unknown };
        Returns: boolean;
      };
      geometry_hash: {
        Args: { "": unknown };
        Returns: number;
      };
      geometry_in: {
        Args: { "": unknown };
        Returns: unknown;
      };
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_out: {
        Args: { "": unknown };
        Returns: unknown;
      };
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_overbelow: {
        Args: { geom2: unknown; geom1: unknown };
        Returns: boolean;
      };
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_overleft: {
        Args: { geom2: unknown; geom1: unknown };
        Returns: boolean;
      };
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_recv: {
        Args: { "": unknown };
        Returns: unknown;
      };
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_same: {
        Args: { geom2: unknown; geom1: unknown };
        Returns: boolean;
      };
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      geometry_send: {
        Args: { "": unknown };
        Returns: string;
      };
      geometry_sortsupport: {
        Args: { "": unknown };
        Returns: undefined;
      };
      geometry_spgist_compress_2d: {
        Args: { "": unknown };
        Returns: unknown;
      };
      geometry_spgist_compress_3d: {
        Args: { "": unknown };
        Returns: unknown;
      };
      geometry_spgist_compress_nd: {
        Args: { "": unknown };
        Returns: unknown;
      };
      geometry_typmod_in: {
        Args: { "": unknown[] };
        Returns: number;
      };
      geometry_typmod_out: {
        Args: { "": number };
        Returns: unknown;
      };
      geometry_within: {
        Args: { geom2: unknown; geom1: unknown };
        Returns: boolean;
      };
      geometrytype: {
        Args: { "": unknown } | { "": unknown };
        Returns: string;
      };
      geomfromewkb: {
        Args: { "": string };
        Returns: unknown;
      };
      geomfromewkt: {
        Args: { "": string };
        Returns: unknown;
      };
      get_proj4_from_srid: {
        Args: { "": number };
        Returns: string;
      };
      gettransactionid: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
      gidx_in: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gidx_out: {
        Args: { "": unknown };
        Returns: unknown;
      };
      handle_expired_bookings: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      is_staff: {
        Args: { uuid: string };
        Returns: boolean;
      };
      json: {
        Args: { "": unknown };
        Returns: Json;
      };
      jsonb: {
        Args: { "": unknown };
        Returns: Json;
      };
      longtransactionsenabled: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      path: {
        Args: { "": unknown };
        Returns: unknown;
      };
      pgis_asflatgeobuf_finalfn: {
        Args: { "": unknown };
        Returns: string;
      };
      pgis_asgeobuf_finalfn: {
        Args: { "": unknown };
        Returns: string;
      };
      pgis_asmvt_finalfn: {
        Args: { "": unknown };
        Returns: string;
      };
      pgis_asmvt_serialfn: {
        Args: { "": unknown };
        Returns: string;
      };
      pgis_geometry_clusterintersecting_finalfn: {
        Args: { "": unknown };
        Returns: unknown[];
      };
      pgis_geometry_clusterwithin_finalfn: {
        Args: { "": unknown };
        Returns: unknown[];
      };
      pgis_geometry_collect_finalfn: {
        Args: { "": unknown };
        Returns: unknown;
      };
      pgis_geometry_makeline_finalfn: {
        Args: { "": unknown };
        Returns: unknown;
      };
      pgis_geometry_polygonize_finalfn: {
        Args: { "": unknown };
        Returns: unknown;
      };
      pgis_geometry_union_parallel_finalfn: {
        Args: { "": unknown };
        Returns: unknown;
      };
      pgis_geometry_union_parallel_serialfn: {
        Args: { "": unknown };
        Returns: string;
      };
      point: {
        Args: { "": unknown };
        Returns: unknown;
      };
      polygon: {
        Args: { "": unknown };
        Returns: unknown;
      };
      populate_geometry_columns: {
        Args:
          | { tbl_oid: unknown; use_typmod?: boolean }
          | { use_typmod?: boolean };
        Returns: string;
      };
      postgis_addbbox: {
        Args: { "": unknown };
        Returns: unknown;
      };
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string };
        Returns: number;
      };
      postgis_constraint_srid: {
        Args: { geomschema: string; geomtable: string; geomcolumn: string };
        Returns: number;
      };
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomtable: string; geomschema: string };
        Returns: string;
      };
      postgis_dropbbox: {
        Args: { "": unknown };
        Returns: unknown;
      };
      postgis_extensions_upgrade: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      postgis_full_version: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      postgis_geos_noop: {
        Args: { "": unknown };
        Returns: unknown;
      };
      postgis_geos_version: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      postgis_getbbox: {
        Args: { "": unknown };
        Returns: unknown;
      };
      postgis_hasbbox: {
        Args: { "": unknown };
        Returns: boolean;
      };
      postgis_index_supportfn: {
        Args: { "": unknown };
        Returns: unknown;
      };
      postgis_lib_build_date: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      postgis_lib_revision: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      postgis_lib_version: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      postgis_libjson_version: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      postgis_liblwgeom_version: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      postgis_libprotobuf_version: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      postgis_libxml_version: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      postgis_noop: {
        Args: { "": unknown };
        Returns: unknown;
      };
      postgis_proj_version: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      postgis_scripts_build_date: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      postgis_scripts_installed: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      postgis_scripts_released: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      postgis_svn_version: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      postgis_type_name: {
        Args: {
          use_new_name?: boolean;
          coord_dimension: number;
          geomname: string;
        };
        Returns: string;
      };
      postgis_typmod_dims: {
        Args: { "": number };
        Returns: number;
      };
      postgis_typmod_srid: {
        Args: { "": number };
        Returns: number;
      };
      postgis_typmod_type: {
        Args: { "": number };
        Returns: string;
      };
      postgis_version: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      postgis_wagyu_version: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      spheroid_in: {
        Args: { "": unknown };
        Returns: unknown;
      };
      spheroid_out: {
        Args: { "": unknown };
        Returns: unknown;
      };
      st_3dclosestpoint: {
        Args: { geom2: unknown; geom1: unknown };
        Returns: unknown;
      };
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: number;
      };
      st_3dintersects: {
        Args: { geom2: unknown; geom1: unknown };
        Returns: boolean;
      };
      st_3dlength: {
        Args: { "": unknown };
        Returns: number;
      };
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: unknown;
      };
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: unknown;
      };
      st_3dmaxdistance: {
        Args: { geom2: unknown; geom1: unknown };
        Returns: number;
      };
      st_3dperimeter: {
        Args: { "": unknown };
        Returns: number;
      };
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: unknown;
      };
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: unknown;
      };
      st_angle: {
        Args:
          | { line1: unknown; line2: unknown }
          | { pt3: unknown; pt4?: unknown; pt2: unknown; pt1: unknown };
        Returns: number;
      };
      st_area: {
        Args:
          | { "": string }
          | { "": unknown }
          | { use_spheroid?: boolean; geog: unknown };
        Returns: number;
      };
      st_area2d: {
        Args: { "": unknown };
        Returns: number;
      };
      st_asbinary: {
        Args: { "": unknown } | { "": unknown };
        Returns: string;
      };
      st_asencodedpolyline: {
        Args: { nprecision?: number; geom: unknown };
        Returns: string;
      };
      st_asewkb: {
        Args: { "": unknown };
        Returns: string;
      };
      st_asewkt: {
        Args: { "": string } | { "": unknown } | { "": unknown };
        Returns: string;
      };
      st_asgeojson: {
        Args:
          | { "": string }
          | { geog: unknown; options?: number; maxdecimaldigits?: number }
          | { maxdecimaldigits?: number; options?: number; geom: unknown }
          | {
              r: Record<string, unknown>;
              geom_column?: string;
              maxdecimaldigits?: number;
              pretty_bool?: boolean;
            };
        Returns: string;
      };
      st_asgml: {
        Args:
          | { "": string }
          | {
              nprefix?: string;
              maxdecimaldigits?: number;
              geog: unknown;
              id?: string;
              options?: number;
            }
          | {
              nprefix?: string;
              options?: number;
              maxdecimaldigits?: number;
              geog: unknown;
              version: number;
              id?: string;
            }
          | { options?: number; maxdecimaldigits?: number; geom: unknown }
          | {
              version: number;
              nprefix?: string;
              id?: string;
              options?: number;
              maxdecimaldigits?: number;
              geom: unknown;
            };
        Returns: string;
      };
      st_ashexewkb: {
        Args: { "": unknown };
        Returns: string;
      };
      st_askml: {
        Args:
          | { "": string }
          | { geog: unknown; nprefix?: string; maxdecimaldigits?: number }
          | { geom: unknown; maxdecimaldigits?: number; nprefix?: string };
        Returns: string;
      };
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string };
        Returns: string;
      };
      st_asmarc21: {
        Args: { geom: unknown; format?: string };
        Returns: string;
      };
      st_asmvtgeom: {
        Args: {
          clip_geom?: boolean;
          geom: unknown;
          bounds: unknown;
          extent?: number;
          buffer?: number;
        };
        Returns: unknown;
      };
      st_assvg: {
        Args:
          | { "": string }
          | { geog: unknown; rel?: number; maxdecimaldigits?: number }
          | { geom: unknown; maxdecimaldigits?: number; rel?: number };
        Returns: string;
      };
      st_astext: {
        Args: { "": string } | { "": unknown } | { "": unknown };
        Returns: string;
      };
      st_astwkb: {
        Args:
          | {
              geom: unknown;
              prec?: number;
              prec_z?: number;
              prec_m?: number;
              with_sizes?: boolean;
              with_boxes?: boolean;
            }
          | {
              prec_z?: number;
              geom: unknown[];
              ids: number[];
              prec?: number;
              prec_m?: number;
              with_sizes?: boolean;
              with_boxes?: boolean;
            };
        Returns: string;
      };
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number };
        Returns: string;
      };
      st_azimuth: {
        Args:
          | { geog2: unknown; geog1: unknown }
          | { geom1: unknown; geom2: unknown };
        Returns: number;
      };
      st_boundary: {
        Args: { "": unknown };
        Returns: unknown;
      };
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown };
        Returns: unknown;
      };
      st_buffer: {
        Args:
          | { geom: unknown; radius: number; quadsegs: number }
          | { options?: string; geom: unknown; radius: number };
        Returns: unknown;
      };
      st_buildarea: {
        Args: { "": unknown };
        Returns: unknown;
      };
      st_centroid: {
        Args: { "": string } | { "": unknown };
        Returns: unknown;
      };
      st_cleangeometry: {
        Args: { "": unknown };
        Returns: unknown;
      };
      st_clipbybox2d: {
        Args: { geom: unknown; box: unknown };
        Returns: unknown;
      };
      st_closestpoint: {
        Args: { geom2: unknown; geom1: unknown };
        Returns: unknown;
      };
      st_clusterintersecting: {
        Args: { "": unknown[] };
        Returns: unknown[];
      };
      st_collect: {
        Args: { "": unknown[] } | { geom1: unknown; geom2: unknown };
        Returns: unknown;
      };
      st_collectionextract: {
        Args: { "": unknown };
        Returns: unknown;
      };
      st_collectionhomogenize: {
        Args: { "": unknown };
        Returns: unknown;
      };
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean;
          param_pctconvex: number;
          param_geom: unknown;
        };
        Returns: unknown;
      };
      st_contains: {
        Args: { geom2: unknown; geom1: unknown };
        Returns: boolean;
      };
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      st_convexhull: {
        Args: { "": unknown };
        Returns: unknown;
      };
      st_coorddim: {
        Args: { geometry: unknown };
        Returns: number;
      };
      st_coveredby: {
        Args:
          | { geog2: unknown; geog1: unknown }
          | { geom2: unknown; geom1: unknown };
        Returns: boolean;
      };
      st_covers: {
        Args:
          | { geog2: unknown; geog1: unknown }
          | { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      st_crosses: {
        Args: { geom2: unknown; geom1: unknown };
        Returns: boolean;
      };
      st_curvetoline: {
        Args: { geom: unknown; flags?: number; toltype?: number; tol?: number };
        Returns: unknown;
      };
      st_delaunaytriangles: {
        Args: { tolerance?: number; g1: unknown; flags?: number };
        Returns: unknown;
      };
      st_difference: {
        Args: { gridsize?: number; geom1: unknown; geom2: unknown };
        Returns: unknown;
      };
      st_dimension: {
        Args: { "": unknown };
        Returns: number;
      };
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      st_distance: {
        Args:
          | { geog1: unknown; use_spheroid?: boolean; geog2: unknown }
          | { geom2: unknown; geom1: unknown };
        Returns: number;
      };
      st_distancesphere: {
        Args:
          | { geom1: unknown; geom2: unknown }
          | { radius: number; geom1: unknown; geom2: unknown };
        Returns: number;
      };
      st_distancespheroid: {
        Args: { geom2: unknown; geom1: unknown };
        Returns: number;
      };
      st_dump: {
        Args: { "": unknown };
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][];
      };
      st_dumppoints: {
        Args: { "": unknown };
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][];
      };
      st_dumprings: {
        Args: { "": unknown };
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][];
      };
      st_dumpsegments: {
        Args: { "": unknown };
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][];
      };
      st_dwithin: {
        Args: {
          geog2: unknown;
          use_spheroid?: boolean;
          tolerance: number;
          geog1: unknown;
        };
        Returns: boolean;
      };
      st_endpoint: {
        Args: { "": unknown };
        Returns: unknown;
      };
      st_envelope: {
        Args: { "": unknown };
        Returns: unknown;
      };
      st_equals: {
        Args: { geom2: unknown; geom1: unknown };
        Returns: boolean;
      };
      st_expand: {
        Args:
          | { dy: number; box: unknown; dx: number }
          | { dy: number; dz?: number; dm?: number; geom: unknown; dx: number }
          | { dz?: number; dy: number; dx: number; box: unknown };
        Returns: unknown;
      };
      st_exteriorring: {
        Args: { "": unknown };
        Returns: unknown;
      };
      st_flipcoordinates: {
        Args: { "": unknown };
        Returns: unknown;
      };
      st_force2d: {
        Args: { "": unknown };
        Returns: unknown;
      };
      st_force3d: {
        Args: { zvalue?: number; geom: unknown };
        Returns: unknown;
      };
      st_force3dm: {
        Args: { mvalue?: number; geom: unknown };
        Returns: unknown;
      };
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number };
        Returns: unknown;
      };
      st_force4d: {
        Args: { mvalue?: number; zvalue?: number; geom: unknown };
        Returns: unknown;
      };
      st_forcecollection: {
        Args: { "": unknown };
        Returns: unknown;
      };
      st_forcecurve: {
        Args: { "": unknown };
        Returns: unknown;
      };
      st_forcepolygonccw: {
        Args: { "": unknown };
        Returns: unknown;
      };
      st_forcepolygoncw: {
        Args: { "": unknown };
        Returns: unknown;
      };
      st_forcerhr: {
        Args: { "": unknown };
        Returns: unknown;
      };
      st_forcesfs: {
        Args: { "": unknown };
        Returns: unknown;
      };
      st_generatepoints: {
        Args:
          | { area: unknown; npoints: number }
          | { area: unknown; seed: number; npoints: number };
        Returns: unknown;
      };
      st_geogfromtext: {
        Args: { "": string };
        Returns: unknown;
      };
      st_geogfromwkb: {
        Args: { "": string };
        Returns: unknown;
      };
      st_geographyfromtext: {
        Args: { "": string };
        Returns: unknown;
      };
      st_geohash: {
        Args:
          | { geog: unknown; maxchars?: number }
          | { maxchars?: number; geom: unknown };
        Returns: string;
      };
      st_geomcollfromtext: {
        Args: { "": string };
        Returns: unknown;
      };
      st_geomcollfromwkb: {
        Args: { "": string };
        Returns: unknown;
      };
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean;
          g: unknown;
          tolerance?: number;
          max_iter?: number;
        };
        Returns: unknown;
      };
      st_geometryfromtext: {
        Args: { "": string };
        Returns: unknown;
      };
      st_geometrytype: {
        Args: { "": unknown };
        Returns: string;
      };
      st_geomfromewkb: {
        Args: { "": string };
        Returns: unknown;
      };
      st_geomfromewkt: {
        Args: { "": string };
        Returns: unknown;
      };
      st_geomfromgeojson: {
        Args: { "": Json } | { "": Json } | { "": string };
        Returns: unknown;
      };
      st_geomfromgml: {
        Args: { "": string };
        Returns: unknown;
      };
      st_geomfromkml: {
        Args: { "": string };
        Returns: unknown;
      };
      st_geomfrommarc21: {
        Args: { marc21xml: string };
        Returns: unknown;
      };
      st_geomfromtext: {
        Args: { "": string };
        Returns: unknown;
      };
      st_geomfromtwkb: {
        Args: { "": string };
        Returns: unknown;
      };
      st_geomfromwkb: {
        Args: { "": string };
        Returns: unknown;
      };
      st_gmltosql: {
        Args: { "": string };
        Returns: unknown;
      };
      st_hasarc: {
        Args: { geometry: unknown };
        Returns: boolean;
      };
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: number;
      };
      st_hexagon: {
        Args: {
          size: number;
          cell_i: number;
          cell_j: number;
          origin?: unknown;
        };
        Returns: unknown;
      };
      st_hexagongrid: {
        Args: { bounds: unknown; size: number };
        Returns: Record<string, unknown>[];
      };
      st_interpolatepoint: {
        Args: { point: unknown; line: unknown };
        Returns: number;
      };
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number };
        Returns: unknown;
      };
      st_intersects: {
        Args:
          | { geog2: unknown; geog1: unknown }
          | { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      st_isclosed: {
        Args: { "": unknown };
        Returns: boolean;
      };
      st_iscollection: {
        Args: { "": unknown };
        Returns: boolean;
      };
      st_isempty: {
        Args: { "": unknown };
        Returns: boolean;
      };
      st_ispolygonccw: {
        Args: { "": unknown };
        Returns: boolean;
      };
      st_ispolygoncw: {
        Args: { "": unknown };
        Returns: boolean;
      };
      st_isring: {
        Args: { "": unknown };
        Returns: boolean;
      };
      st_issimple: {
        Args: { "": unknown };
        Returns: boolean;
      };
      st_isvalid: {
        Args: { "": unknown };
        Returns: boolean;
      };
      st_isvaliddetail: {
        Args: { geom: unknown; flags?: number };
        Returns: Database["public"]["CompositeTypes"]["valid_detail"];
      };
      st_isvalidreason: {
        Args: { "": unknown };
        Returns: string;
      };
      st_isvalidtrajectory: {
        Args: { "": unknown };
        Returns: boolean;
      };
      st_length: {
        Args:
          | { "": string }
          | { "": unknown }
          | { use_spheroid?: boolean; geog: unknown };
        Returns: number;
      };
      st_length2d: {
        Args: { "": unknown };
        Returns: number;
      };
      st_letters: {
        Args: { letters: string; font?: Json };
        Returns: unknown;
      };
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown };
        Returns: number;
      };
      st_linefromencodedpolyline: {
        Args: { txtin: string; nprecision?: number };
        Returns: unknown;
      };
      st_linefrommultipoint: {
        Args: { "": unknown };
        Returns: unknown;
      };
      st_linefromtext: {
        Args: { "": string };
        Returns: unknown;
      };
      st_linefromwkb: {
        Args: { "": string };
        Returns: unknown;
      };
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: number;
      };
      st_linemerge: {
        Args: { "": unknown };
        Returns: unknown;
      };
      st_linestringfromwkb: {
        Args: { "": string };
        Returns: unknown;
      };
      st_linetocurve: {
        Args: { geometry: unknown };
        Returns: unknown;
      };
      st_locatealong: {
        Args: { geometry: unknown; measure: number; leftrightoffset?: number };
        Returns: unknown;
      };
      st_locatebetween: {
        Args: {
          leftrightoffset?: number;
          geometry: unknown;
          frommeasure: number;
          tomeasure: number;
        };
        Returns: unknown;
      };
      st_locatebetweenelevations: {
        Args: { geometry: unknown; fromelevation: number; toelevation: number };
        Returns: unknown;
      };
      st_longestline: {
        Args: { geom2: unknown; geom1: unknown };
        Returns: unknown;
      };
      st_m: {
        Args: { "": unknown };
        Returns: number;
      };
      st_makebox2d: {
        Args: { geom2: unknown; geom1: unknown };
        Returns: unknown;
      };
      st_makeline: {
        Args: { "": unknown[] } | { geom2: unknown; geom1: unknown };
        Returns: unknown;
      };
      st_makepolygon: {
        Args: { "": unknown };
        Returns: unknown;
      };
      st_makevalid: {
        Args: { "": unknown } | { geom: unknown; params: string };
        Returns: unknown;
      };
      st_maxdistance: {
        Args: { geom2: unknown; geom1: unknown };
        Returns: number;
      };
      st_maximuminscribedcircle: {
        Args: { "": unknown };
        Returns: Record<string, unknown>;
      };
      st_memsize: {
        Args: { "": unknown };
        Returns: number;
      };
      st_minimumboundingcircle: {
        Args: { segs_per_quarter?: number; inputgeom: unknown };
        Returns: unknown;
      };
      st_minimumboundingradius: {
        Args: { "": unknown };
        Returns: Record<string, unknown>;
      };
      st_minimumclearance: {
        Args: { "": unknown };
        Returns: number;
      };
      st_minimumclearanceline: {
        Args: { "": unknown };
        Returns: unknown;
      };
      st_mlinefromtext: {
        Args: { "": string };
        Returns: unknown;
      };
      st_mlinefromwkb: {
        Args: { "": string };
        Returns: unknown;
      };
      st_mpointfromtext: {
        Args: { "": string };
        Returns: unknown;
      };
      st_mpointfromwkb: {
        Args: { "": string };
        Returns: unknown;
      };
      st_mpolyfromtext: {
        Args: { "": string };
        Returns: unknown;
      };
      st_mpolyfromwkb: {
        Args: { "": string };
        Returns: unknown;
      };
      st_multi: {
        Args: { "": unknown };
        Returns: unknown;
      };
      st_multilinefromwkb: {
        Args: { "": string };
        Returns: unknown;
      };
      st_multilinestringfromtext: {
        Args: { "": string };
        Returns: unknown;
      };
      st_multipointfromtext: {
        Args: { "": string };
        Returns: unknown;
      };
      st_multipointfromwkb: {
        Args: { "": string };
        Returns: unknown;
      };
      st_multipolyfromwkb: {
        Args: { "": string };
        Returns: unknown;
      };
      st_multipolygonfromtext: {
        Args: { "": string };
        Returns: unknown;
      };
      st_ndims: {
        Args: { "": unknown };
        Returns: number;
      };
      st_node: {
        Args: { g: unknown };
        Returns: unknown;
      };
      st_normalize: {
        Args: { geom: unknown };
        Returns: unknown;
      };
      st_npoints: {
        Args: { "": unknown };
        Returns: number;
      };
      st_nrings: {
        Args: { "": unknown };
        Returns: number;
      };
      st_numgeometries: {
        Args: { "": unknown };
        Returns: number;
      };
      st_numinteriorring: {
        Args: { "": unknown };
        Returns: number;
      };
      st_numinteriorrings: {
        Args: { "": unknown };
        Returns: number;
      };
      st_numpatches: {
        Args: { "": unknown };
        Returns: number;
      };
      st_numpoints: {
        Args: { "": unknown };
        Returns: number;
      };
      st_offsetcurve: {
        Args: { params?: string; line: unknown; distance: number };
        Returns: unknown;
      };
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      st_orientedenvelope: {
        Args: { "": unknown };
        Returns: unknown;
      };
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      st_perimeter: {
        Args: { "": unknown } | { use_spheroid?: boolean; geog: unknown };
        Returns: number;
      };
      st_perimeter2d: {
        Args: { "": unknown };
        Returns: number;
      };
      st_pointfromtext: {
        Args: { "": string };
        Returns: unknown;
      };
      st_pointfromwkb: {
        Args: { "": string };
        Returns: unknown;
      };
      st_pointm: {
        Args: {
          srid?: number;
          xcoordinate: number;
          ycoordinate: number;
          mcoordinate: number;
        };
        Returns: unknown;
      };
      st_pointonsurface: {
        Args: { "": unknown };
        Returns: unknown;
      };
      st_points: {
        Args: { "": unknown };
        Returns: unknown;
      };
      st_pointz: {
        Args: {
          srid?: number;
          zcoordinate: number;
          ycoordinate: number;
          xcoordinate: number;
        };
        Returns: unknown;
      };
      st_pointzm: {
        Args: {
          xcoordinate: number;
          srid?: number;
          mcoordinate: number;
          zcoordinate: number;
          ycoordinate: number;
        };
        Returns: unknown;
      };
      st_polyfromtext: {
        Args: { "": string };
        Returns: unknown;
      };
      st_polyfromwkb: {
        Args: { "": string };
        Returns: unknown;
      };
      st_polygonfromtext: {
        Args: { "": string };
        Returns: unknown;
      };
      st_polygonfromwkb: {
        Args: { "": string };
        Returns: unknown;
      };
      st_polygonize: {
        Args: { "": unknown[] };
        Returns: unknown;
      };
      st_project: {
        Args: { distance: number; geog: unknown; azimuth: number };
        Returns: unknown;
      };
      st_quantizecoordinates: {
        Args: {
          prec_x: number;
          prec_y?: number;
          prec_z?: number;
          prec_m?: number;
          g: unknown;
        };
        Returns: unknown;
      };
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number };
        Returns: unknown;
      };
      st_relate: {
        Args: { geom2: unknown; geom1: unknown };
        Returns: string;
      };
      st_removerepeatedpoints: {
        Args: { tolerance?: number; geom: unknown };
        Returns: unknown;
      };
      st_reverse: {
        Args: { "": unknown };
        Returns: unknown;
      };
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number };
        Returns: unknown;
      };
      st_setsrid: {
        Args: { geog: unknown; srid: number } | { geom: unknown; srid: number };
        Returns: unknown;
      };
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: unknown;
      };
      st_shiftlongitude: {
        Args: { "": unknown };
        Returns: unknown;
      };
      st_shortestline: {
        Args: { geom2: unknown; geom1: unknown };
        Returns: unknown;
      };
      st_simplifypolygonhull: {
        Args: { geom: unknown; vertex_fraction: number; is_outer?: boolean };
        Returns: unknown;
      };
      st_split: {
        Args: { geom2: unknown; geom1: unknown };
        Returns: unknown;
      };
      st_square: {
        Args: {
          size: number;
          origin?: unknown;
          cell_j: number;
          cell_i: number;
        };
        Returns: unknown;
      };
      st_squaregrid: {
        Args: { size: number; bounds: unknown };
        Returns: Record<string, unknown>[];
      };
      st_srid: {
        Args: { geog: unknown } | { geom: unknown };
        Returns: number;
      };
      st_startpoint: {
        Args: { "": unknown };
        Returns: unknown;
      };
      st_subdivide: {
        Args: { geom: unknown; maxvertices?: number; gridsize?: number };
        Returns: unknown[];
      };
      st_summary: {
        Args: { "": unknown } | { "": unknown };
        Returns: string;
      };
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown };
        Returns: unknown;
      };
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number };
        Returns: unknown;
      };
      st_symmetricdifference: {
        Args: { geom2: unknown; geom1: unknown };
        Returns: unknown;
      };
      st_tileenvelope: {
        Args: {
          y: number;
          x: number;
          zoom: number;
          margin?: number;
          bounds?: unknown;
        };
        Returns: unknown;
      };
      st_touches: {
        Args: { geom2: unknown; geom1: unknown };
        Returns: boolean;
      };
      st_transform: {
        Args:
          | { geom: unknown; from_proj: string; to_srid: number }
          | { to_proj: string; from_proj: string; geom: unknown }
          | { to_proj: string; geom: unknown };
        Returns: unknown;
      };
      st_triangulatepolygon: {
        Args: { g1: unknown };
        Returns: unknown;
      };
      st_union: {
        Args:
          | { "": unknown[] }
          | { geom2: unknown; geom1: unknown }
          | { geom2: unknown; geom1: unknown; gridsize: number };
        Returns: unknown;
      };
      st_voronoilines: {
        Args: { extend_to?: unknown; tolerance?: number; g1: unknown };
        Returns: unknown;
      };
      st_voronoipolygons: {
        Args: { extend_to?: unknown; tolerance?: number; g1: unknown };
        Returns: unknown;
      };
      st_within: {
        Args: { geom1: unknown; geom2: unknown };
        Returns: boolean;
      };
      st_wkbtosql: {
        Args: { wkb: string };
        Returns: unknown;
      };
      st_wkttosql: {
        Args: { "": string };
        Returns: unknown;
      };
      st_wrapx: {
        Args: { move: number; geom: unknown; wrap: number };
        Returns: unknown;
      };
      st_x: {
        Args: { "": unknown };
        Returns: number;
      };
      st_xmax: {
        Args: { "": unknown };
        Returns: number;
      };
      st_xmin: {
        Args: { "": unknown };
        Returns: number;
      };
      st_y: {
        Args: { "": unknown };
        Returns: number;
      };
      st_ymax: {
        Args: { "": unknown };
        Returns: number;
      };
      st_ymin: {
        Args: { "": unknown };
        Returns: number;
      };
      st_z: {
        Args: { "": unknown };
        Returns: number;
      };
      st_zmax: {
        Args: { "": unknown };
        Returns: number;
      };
      st_zmflag: {
        Args: { "": unknown };
        Returns: number;
      };
      st_zmin: {
        Args: { "": unknown };
        Returns: number;
      };
      staff_verification: {
        Args: { permission_denied_message: string; uuid: string };
        Returns: boolean;
      };
      staff_verification_with_raise_message: {
        Args: { text_message: string; uuid: string };
        Returns: boolean;
      };
      text: {
        Args: { "": unknown };
        Returns: string;
      };
      unlockrows: {
        Args: { "": string };
        Returns: number;
      };
      updategeometrysrid: {
        Args: {
          column_name: string;
          new_srid_in: number;
          catalogn_name: string;
          schema_name: string;
          table_name: string;
        };
        Returns: string;
      };
    };
    Enums: {
      app_role: "customer" | "guide" | "lead-guide" | "admin" | "partner_admin";
      booking_status: "pending" | "confirmed" | "cancelled" | "expired";
      location_level:
        | "country"
        | "province"
        | "city"
        | "district"
        | "sub-district"
        | "point-of-interest";
      payment_status: "pending" | "succeeded" | "failed";
      tour_difficulty: "easy" | "medium" | "difficult";
    };
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null;
        geom: unknown | null;
      };
      valid_detail: {
        valid: boolean | null;
        reason: string | null;
        location: unknown | null;
      };
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["customer", "guide", "lead-guide", "admin", "partner_admin"],
      booking_status: ["pending", "confirmed", "cancelled", "expired"],
      location_level: [
        "country",
        "province",
        "city",
        "district",
        "sub-district",
        "point-of-interest",
      ],
      payment_status: ["pending", "succeeded", "failed"],
      tour_difficulty: ["easy", "medium", "difficult"],
    },
  },
} as const;
