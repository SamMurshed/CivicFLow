/**
 * CivicFlow — Database Types
 *
 * Manually maintained TypeScript types that mirror the Supabase schema.
 *
 * ─── REGENERATING THESE TYPES ────────────────────────────────────────────────
 * When the schema changes, regenerate this file with the Supabase CLI:
 *
 *   npx supabase gen types typescript \
 *     --project-id <YOUR_PROJECT_ID> \
 *     --schema public \
 *     > src/types/database.ts
 *
 * Replace <YOUR_PROJECT_ID> with the value from your Supabase project URL
 * (e.g. https://<YOUR_PROJECT_ID>.supabase.co).
 *
 * Alternatively, if you are running Supabase locally:
 *
 *   npx supabase gen types typescript --local > src/types/database.ts
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Enum Types ───────────────────────────────────────────────────────────────

export type AppRole = 'vendor' | 'agency_user' | 'analyst' | 'admin';

export type OrgKind = 'agency' | 'vendor';

export type RequestStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'awaiting_correction'
  | 'correction_submitted'
  | 'approved'
  | 'rejected'
  | 'withdrawn'
  | 'on_hold';

export type ChecklistItemStatus = 'pending' | 'satisfied' | 'flagged' | 'waived';

export type DocumentStatus = 'uploaded' | 'accepted' | 'rejected' | 'superseded';

export type ReviewDecision =
  'request_correction' | 'approve' | 'reject' | 'place_on_hold' | 'resume_from_hold';

// ─── Table Row Types ──────────────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  kind: OrgKind;
  description: string | null;
  website_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string; // Same UUID as auth.users.id
  organization_id: string | null;
  role: AppRole;
  full_name: string;
  email: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VendorProfile {
  id: string;
  profile_id: string;
  organization_id: string;
  business_number: string | null;
  contact_phone: string | null;
  primary_category: string | null;
  secondary_categories: string[] | null;
  is_verified: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * VendorOrgProfile — fictional extended vendor profile stored as JSON metadata
 * on the organisations table (metadata column).
 *
 * ⚠️  FICTIONAL DATA NOTICE: All data in this type is for demonstration only.
 * It is NOT verified by the City of New York or any government authority.
 */
export interface VendorOrgProfile {
  legal_name: string;
  display_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  primary_category: string;
  is_nonprofit: boolean;
  mwbe_designation: string;
  description?: string;
  updated_at?: string;
}

export interface ProcurementRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  proposed_budget: string; // Returned as string by Supabase JS for numeric(15,2)
  desired_start_date: string | null; // ISO date string
  submission_deadline: string | null; // ISO date string
  agency_org_id: string;
  vendor_org_id: string | null;
  submitted_by: string;
  assigned_analyst: string | null;
  status: RequestStatus;
  submitted_at: string | null;
  decided_at: string | null;
  decision_rationale: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistTemplateItem {
  id: string;
  template_id: string;
  item_key: string;
  label: string;
  description: string | null;
  is_required: boolean;
  sort_order: number;
  created_at: string;
}

export interface RequestChecklistItem {
  id: string;
  request_id: string;
  template_item_id: string | null;
  item_key: string;
  label: string;
  description: string | null;
  is_required: boolean;
  status: ChecklistItemStatus;
  analyst_note: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RequestDocument {
  id: string;
  request_id: string;
  checklist_item_id: string | null;
  uploaded_by: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  status: DocumentStatus;
  reviewer_note: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  request_id: string;
  parent_id: string | null;
  author_id: string;
  body: string;
  is_internal: boolean;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewAction {
  id: string;
  request_id: string;
  analyst_id: string;
  decision: ReviewDecision;
  note: string | null;
  created_at: string;
}

export interface StatusHistory {
  id: string;
  request_id: string;
  changed_by: string;
  from_status: RequestStatus | null;
  to_status: RequestStatus;
  reason: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  actor_id: string | null;
  request_id: string | null;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  request_id: string | null;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  slug: string;
  body: string;
  category: string | null;
  tags: string[] | null;
  is_published: boolean;
  published_at: string | null;
  author_id: string;
  created_at: string;
  updated_at: string;
}

export interface FeedbackItem {
  id: string;
  submitted_by: string | null;
  article_id: string | null;
  request_id: string | null;
  rating: number | null;
  comment: string | null;
  created_at: string;
}

// ─── Supabase Database type (for createClient generic) ───────────────────────

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          is_active?: boolean;
        };
        Update: Partial<Omit<Organization, 'id' | 'created_at' | 'updated_at'>>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & {
          is_active?: boolean;
          avatar_url?: string | null;
          organization_id?: string | null;
        };
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      vendor_profiles: {
        Row: VendorProfile;
        Insert: Omit<VendorProfile, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<VendorProfile, 'id' | 'profile_id' | 'created_at' | 'updated_at'>>;
      };
      procurement_requests: {
        Row: ProcurementRequest;
        Insert: Omit<ProcurementRequest, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          status?: RequestStatus;
        };
        Update: Partial<Omit<ProcurementRequest, 'id' | 'created_at' | 'updated_at'>>;
      };
      checklist_templates: {
        Row: ChecklistTemplate;
        Insert: Omit<ChecklistTemplate, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          is_active?: boolean;
        };
        Update: Partial<Omit<ChecklistTemplate, 'id' | 'created_at' | 'updated_at'>>;
      };
      checklist_template_items: {
        Row: ChecklistTemplateItem;
        Insert: Omit<ChecklistTemplateItem, 'id' | 'created_at'> & {
          id?: string;
          sort_order?: number;
        };
        Update: Partial<Omit<ChecklistTemplateItem, 'id' | 'template_id' | 'created_at'>>;
      };
      request_checklist_items: {
        Row: RequestChecklistItem;
        Insert: Omit<RequestChecklistItem, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          status?: ChecklistItemStatus;
        };
        Update: Partial<
          Omit<RequestChecklistItem, 'id' | 'request_id' | 'created_at' | 'updated_at'>
        >;
      };
      request_documents: {
        Row: RequestDocument;
        Insert: Omit<RequestDocument, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          status?: DocumentStatus;
        };
        Update: Partial<
          Omit<RequestDocument, 'id' | 'request_id' | 'uploaded_by' | 'created_at' | 'updated_at'>
        >;
      };
      comments: {
        Row: Comment;
        Insert: Omit<Comment, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          is_internal?: boolean;
          parent_id?: string | null;
        };
        Update: Partial<
          Omit<Comment, 'id' | 'request_id' | 'author_id' | 'created_at' | 'updated_at'>
        >;
      };
      review_actions: {
        Row: ReviewAction;
        Insert: Omit<ReviewAction, 'id' | 'created_at'> & { id?: string };
        Update: never; // Append-only
      };
      status_history: {
        Row: StatusHistory;
        Insert: Omit<StatusHistory, 'id' | 'created_at'> & { id?: string };
        Update: never; // Append-only
      };
      activity_log: {
        Row: ActivityLog;
        Insert: Omit<ActivityLog, 'id' | 'created_at'> & { id?: string };
        Update: never; // Append-only
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'> & {
          id?: string;
          is_read?: boolean;
        };
        Update: Partial<Omit<Notification, 'id' | 'recipient_id' | 'created_at'>>;
      };
      knowledge_articles: {
        Row: KnowledgeArticle;
        Insert: Omit<KnowledgeArticle, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          is_published?: boolean;
        };
        Update: Partial<Omit<KnowledgeArticle, 'id' | 'created_at' | 'updated_at'>>;
      };
      feedback_items: {
        Row: FeedbackItem;
        Insert: Omit<FeedbackItem, 'id' | 'created_at'> & { id?: string };
        Update: never;
      };
    };
    Enums: {
      app_role: AppRole;
      org_kind: OrgKind;
      request_status: RequestStatus;
      checklist_item_status: ChecklistItemStatus;
      document_status: DocumentStatus;
      review_decision: ReviewDecision;
    };
  };
}
