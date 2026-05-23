import supabase from '@/api/supabaseClient';

const TABLES = {
  jobs: ['jobs', 'Job', 'job'],
  proposals: ['proposals', 'Proposal', 'proposal'],
  transactions: ['transactions', 'Transaction', 'transaction'],
};

const isMissingTableError = (error) => {
  const message = `${error?.code || ''} ${error?.message || ''}`.toLowerCase();
  return (
    message.includes('42p01') ||
    message.includes('pgrst205') ||
    message.includes('could not find the table') ||
    message.includes('relation') && message.includes('does not exist')
  );
};

const compareByDateDesc = (a, b) => {
  const aDate = new Date(a.created_at || a.created_date || a.inserted_at || 0).getTime();
  const bDate = new Date(b.created_at || b.created_date || b.inserted_at || 0).getTime();
  return bDate - aDate;
};

async function resolveUserId(email) {
  if (!email || !supabase) return null;
  const { data: authData } = await supabase.auth.getUser();
  if (authData?.user?.email?.toLowerCase() === String(email).toLowerCase()) {
    return authData.user.id;
  }

  const { data } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('email', email)
    .maybeSingle();

  return data?.user_id || null;
}

async function selectFirstAvailable(tableKey, buildQuery) {
  if (!supabase) {
    throw new Error('Supabase nao esta configurado.');
  }

  let lastError = null;

  for (const table of TABLES[tableKey]) {
    const { data, error } = await buildQuery(supabase.from(table));

    if (!error) {
      return data || [];
    }

    lastError = error;
    if (!isMissingTableError(error)) {
      throw error;
    }
  }

  throw lastError || new Error(`Tabela ${tableKey} nao encontrada.`);
}

export const getClientJobs = async (clientEmail) => {
  const clientId = await resolveUserId(clientEmail);
  const jobs = await selectFirstAvailable('jobs', (table) =>
    table.select('*').eq('client_id', clientId)
  );

  return jobs.sort(compareByDateDesc);
};

export const getClientProposals = async (clientEmail) => {
  const clientId = await resolveUserId(clientEmail);
  const proposals = await selectFirstAvailable('proposals', (table) =>
    table.select('*').eq('client_id', clientId)
  );

  return proposals.sort(compareByDateDesc);
};

export const getClientTransactions = async (clientEmail) => {
  const clientId = await resolveUserId(clientEmail);
  const transactions = await selectFirstAvailable('transactions', (table) =>
    table.select('*').eq('user_id', clientId)
  );

  return transactions.sort(compareByDateDesc);
};
