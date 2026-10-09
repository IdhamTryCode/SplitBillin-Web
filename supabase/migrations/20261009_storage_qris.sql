-- Private storage bucket for QRIS images (Langkah 6).
-- Never public: the app uploads via the service role and serves short-lived
-- signed URLs. RLS on storage.objects stays enabled with no anon policies.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('qris', 'qris', false, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;
