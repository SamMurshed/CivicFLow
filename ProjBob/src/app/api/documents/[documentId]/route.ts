import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ documentId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const { documentId } = await params;
  const supabase = await createClient();
  const { data: document, error } = await supabase
    .from('request_documents')
    .select('storage_path')
    .eq('id', documentId)
    .single();

  if (error || !document) {
    return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
  }

  const { data, error: signError } = await supabase.storage
    .from('request-documents')
    .createSignedUrl(document.storage_path, 60);

  if (signError || !data?.signedUrl) {
    return NextResponse.json({ error: 'Unable to open document.' }, { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}
