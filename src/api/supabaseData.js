import supabase from '@/api/supabaseClient';

const TABLES = {
  jobs: ['jobs', 'Job'],
  proposals: ['proposals', 'Proposal'],
  portfolios: ['portfolios', 'Portfolio'],
  transactions: ['transactions', 'Transaction'],
  messages: ['messages', 'Message'],
  notifications: ['notifications', 'Notification'],
  reviews: ['reviews', 'Review'],
  users: ['profiles'],
  freelancerStats: ['freelancer_stats', 'FreelancerStats'],
  challenges: ['challenges', 'Challenge'],
};

const dateValue = (item) => new Date(item.created_at || item.created_date || item.inserted_at || 0).getTime();
const ADMIN_EMAIL = 'pedrooInit@admin';

export const sortByNewest = (items) => [...items].sort((a, b) => dateValue(b) - dateValue(a));
export const sortByOldest = (items) => [...items].sort((a, b) => dateValue(a) - dateValue(b));
export const isAdminEmail = (email) => String(email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();

export const getBanState = (profile) => {
  if (!profile?.ban_status || profile.ban_status === 'active') return { banned: false };
  if (profile.ban_status === 'permanent') return { banned: true, permanent: true, reason: profile.ban_reason || '' };
  if (profile.ban_status === 'temporary') {
    const until = profile.banned_until ? new Date(profile.banned_until) : null;
    return {
      banned: !until || until.getTime() > Date.now(),
      permanent: false,
      until,
      reason: profile.ban_reason || '',
    };
  }
  return { banned: false };
};

export const calculateProofScore = ({ portfolio = [], proposals = [], reviews = [], stats = {} }) => {
  const publishedProjects = portfolio.filter((project) => project.status !== 'rascunho');
  const views = publishedProjects.reduce((sum, project) => sum + Number(project.views || 0), 0);
  const accepted = proposals.filter((proposal) => proposal.status === 'aceita').length;
  const reviewAverage = reviews.length
    ? reviews.reduce((sum, review) => sum + Number(review.nota || 0), 0) / reviews.length
    : 0;
  const skills = Array.isArray(stats.habilidades) ? stats.habilidades : [];

  return Math.min(100, Math.round(
    publishedProjects.length * 12 +
    Math.min(20, views / 5) +
    accepted * 12 +
    reviewAverage * 4 +
    Math.min(12, skills.length * 2) +
    (stats.profissao ? 8 : 0)
  ));
};

export const getRankFromProofScore = (score) => {
  if (score >= 80) return 'Elite';
  if (score >= 60) return 'Expert';
  if (score >= 40) return 'Specialist';
  if (score >= 20) return 'Builder';
  return 'Rookie';
};

const isMissingTableError = (error) => {
  const text = `${error?.code || ''} ${error?.message || ''}`.toLowerCase();
  return (
    text.includes('42p01') ||
    text.includes('pgrst205') ||
    text.includes('could not find the table') ||
    (text.includes('relation') && text.includes('does not exist'))
  );
};

const isMissingColumnError = (error) => {
  const text = `${error?.code || ''} ${error?.message || ''} ${error?.details || ''}`.toLowerCase();
  return text.includes('42703') || text.includes('column') || text.includes('does not exist');
};

const withoutKeys = (payload, keys) => Object.fromEntries(
  Object.entries(payload || {}).filter(([key]) => !keys.includes(key))
);

async function retryWithoutOptionalColumns(run, payload, optionalKeys) {
  try {
    return await run(payload);
  } catch (error) {
    if (!isMissingColumnError(error)) throw error;
    return run(withoutKeys(payload, optionalKeys));
  }
}

const isInvalidUuidError = (error) => {
  const text = `${error?.code || ''} ${error?.message || ''}`.toLowerCase();
  return text.includes('22p02') || text.includes('invalid input syntax for type uuid');
};

const isUniqueViolationError = (error) => {
  const text = `${error?.code || ''} ${error?.message || ''}`.toLowerCase();
  return text.includes('23505') || text.includes('duplicate key value');
};

const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const getAuthUser = async () => {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
};

const resolveUserId = async (identity) => {
  if (!identity) return null;
  if (isUuid(identity)) return identity;

  const authUser = await getAuthUser();
  if (authUser?.email && String(authUser.email).toLowerCase() === String(identity).toLowerCase()) {
    return authUser.id;
  }

  const profile = await findProfileByField('email', identity);
  return profile?.user_id || profile?.id || null;
};

const stripUndefined = (payload) => Object.fromEntries(
  Object.entries(payload || {}).filter(([, value]) => value !== undefined)
);

const stripNullishForeignKeys = (payload, keys) => Object.fromEntries(
  Object.entries(payload || {}).filter(([key, value]) => !(keys.includes(key) && (value === null || value === undefined || value === '')))
);

const normalizeProfilePayload = (payload) => stripUndefined({
  user_id: payload.user_id || payload.id,
  email: payload.email,
  full_name: payload.full_name,
  avatar_url: payload.avatar_url,
  foto_perfil: payload.foto_perfil,
  bio: payload.bio,
  role: payload.role,
  cidade: payload.cidade,
  pais: payload.pais,
  telefone: payload.telefone,
  nome_empresa: payload.nome_empresa,
  site_empresa: payload.site_empresa,
  ban_status: payload.ban_status,
  banned_until: payload.banned_until,
  ban_reason: payload.ban_reason,
});

const normalizeFreelancerStatsPayload = async (payload) => stripUndefined({
  user_id: payload.user_id || await resolveUserId(payload.user_email || payload.email),
  user_email: payload.user_email || payload.email,
  profissao: payload.profissao,
  habilidades: payload.habilidades,
  valor_hora: payload.valor_hora,
  valor_a_combinar: payload.valor_a_combinar,
  rank: payload.rank,
  proof_score: payload.proof_score,
  portfolio_views: payload.portfolio_views,
});

const normalizeJobPayload = async (payload) => stripNullishForeignKeys(stripUndefined({
  ...payload,
  client_id: payload.client_id || await resolveUserId(payload.cliente_email) || (await getAuthUser())?.id,
  freelancer_id: payload.freelancer_id || await resolveUserId(payload.freelancer_email),
}), ['freelancer_id']);

async function getJobForProposal(jobId) {
  if (!jobId) return null;

  try {
    return await tryTables('jobs', (table) =>
      table
        .select('id, client_id, cliente_email, status')
        .eq('id', jobId)
        .limit(1)
        .maybeSingle()
    );
  } catch (error) {
    console.warn('Could not resolve job owner for proposal:', error);
    return null;
  }
}

const normalizeProposalPayload = async (payload) => {
  const job = payload.client_id ? null : await getJobForProposal(payload.job_id);
  const authUser = await getAuthUser();

  return stripUndefined({
    ...payload,
    freelancer_id: payload.freelancer_id || await resolveUserId(payload.freelancer_email) || authUser?.id,
    client_id: payload.client_id || job?.client_id || await resolveUserId(payload.cliente_email || job?.cliente_email),
    cliente_email: payload.cliente_email || job?.cliente_email,
    freelancer_email: payload.freelancer_email || authUser?.email,
  });
};

const normalizePortfolioPayload = async (payload) => stripUndefined({
  ...payload,
  user_id: payload.user_id || await resolveUserId(payload.user_email || payload.email),
});

const normalizeTransactionPayload = async (payload) => stripUndefined({
  ...payload,
  user_id: payload.user_id || await resolveUserId(payload.usuario_email || payload.email),
});

const normalizeMessagePayload = async (payload) => stripUndefined({
  ...payload,
  sender_id: payload.sender_id || await resolveUserId(payload.sender_email),
  receiver_id: payload.receiver_id || await resolveUserId(payload.receiver_email),
});

const normalizeNotificationPayload = async (payload) => stripUndefined({
  ...payload,
  user_id: payload.user_id || await resolveUserId(payload.usuario_email || payload.email),
});

const normalizeReviewPayload = async (payload) => stripUndefined({
  ...payload,
  remetente_id: payload.remetente_id || await resolveUserId(payload.remetente_email),
  destinatario_id: payload.destinatario_id || await resolveUserId(payload.destinatario_email),
});

const toError = (error, tableKey) => {
  if (error instanceof Error) return error;

  const details = [
    error?.message,
    error?.details,
    error?.hint,
    error?.code ? `codigo: ${error.code}` : null,
  ].filter(Boolean).join(' | ');

  return new Error(details || `Erro ao acessar ${tableKey} no Supabase.`);
};

async function tryTables(tableKey, run) {
  if (!supabase) throw new Error('Supabase nao esta configurado.');

  let lastError = null;
  const triedTables = [];

  for (const table of TABLES[tableKey]) {
    triedTables.push(table);
    const { data, error } = await run(supabase.from(table), table);

    if (!error) return data;

    lastError = error;
    if (!isMissingTableError(error)) throw toError(error, tableKey);
  }

  if (isMissingTableError(lastError)) {
    throw new Error(`Tabela nao encontrada no Supabase. Crie uma destas tabelas no schema public: ${triedTables.join(', ')}. Depois recarregue o schema cache/API do Supabase se necessario.`);
  }

  throw toError(lastError, tableKey);
}

async function listRows(tableKey) {
  const data = await tryTables(tableKey, (table) => table.select('*'));
  if (!Array.isArray(data)) return [];
  if (tableKey === 'users') {
    return data.map((row) => ({ ...row, id: row.user_id, user_email: row.email }));
  }
  if (tableKey === 'freelancerStats') {
    return data.map((row) => ({ ...row, user_email: row.user_id }));
  }
  return data;
}

async function filterRows(tableKey, predicate, sort = sortByNewest) {
  const data = await listRows(tableKey);
  return sort(data.filter(predicate));
}

async function findProfileByField(field, value) {
  if (!supabase || !value) return null;
  const actualField = field === 'id' ? 'user_id' : field === 'user_email' ? 'email' : field;
  if (actualField === 'user_id' && !isUuid(value)) return null;

  for (const tableName of TABLES.users) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq(actualField, value)
        .limit(1)
        .maybeSingle();

      if (!error) return data || null;
      if (!isMissingTableError(error) && !isMissingColumnError(error) && !isInvalidUuidError(error)) throw error;
    } catch (error) {
      if (!isMissingTableError(error) && !isMissingColumnError(error) && !isInvalidUuidError(error)) {
        console.warn(`Could not read profile from ${tableName}.${actualField}:`, error);
      }
    }
  }

  return null;
}

async function findProfile(identity) {
  const decoded = decodeURIComponent(identity || '').trim();
  if (!decoded) return null;

  const candidates = [
    ['user_id', decoded],
    ['email', decoded],
  ];

  for (const [field, value] of candidates) {
    const profile = await findProfileByField(field, value);
    if (profile) return profile;
  }

  return null;
}

export const db = {
  jobs: {
    list: () => filterRows('jobs', () => true),
    forClient: async (email) => {
      const userId = await resolveUserId(email);
      return filterRows('jobs', (job) => job.client_id === userId);
    },
    open: () => filterRows('jobs', (job) => job.status === 'aberto'),
    create: async (payload) => tryTables('jobs', async (table) => table.insert(await normalizeJobPayload(payload)).select('*').single()),
    update: async (id, payload) => tryTables('jobs', async (table) => table.update(await normalizeJobPayload(payload)).eq('id', id).select('*').single()),
    delete: (id) => tryTables('jobs', (table) => table.delete().eq('id', id)),
  },

  proposals: {
    list: () => filterRows('proposals', () => true),
    forClient: async (email) => {
      const userId = await resolveUserId(email);
      return filterRows('proposals', (proposal) => proposal.client_id === userId);
    },
    forFreelancer: async (email) => {
      const userId = await resolveUserId(email);
      return filterRows('proposals', (proposal) => proposal.freelancer_id === userId);
    },
    forJob: (jobId) => filterRows('proposals', (proposal) => proposal.job_id === jobId),
    create: async (payload) => tryTables('proposals', async (table) => table.insert(await normalizeProposalPayload(payload)).select('*').single()),
    update: async (id, payload) => tryTables('proposals', async (table) => table.update(stripUndefined(payload)).eq('id', id).select('*').single()),
    delete: (id) => tryTables('proposals', (table) => table.delete().eq('id', id)),
  },

  portfolios: {
    forUser: async (email) => {
      const userId = await resolveUserId(email);
      return filterRows('portfolios', (project) => project.user_id === userId);
    },
    create: async (payload) => tryTables('portfolios', async (table) => table.insert(await normalizePortfolioPayload(payload)).select('*').single()),
    update: async (id, payload) => tryTables('portfolios', async (table) => table.update(await normalizePortfolioPayload(payload)).eq('id', id).select('*').single()),
    delete: (id) => tryTables('portfolios', (table) => table.delete().eq('id', id)),
  },

  transactions: {
    forUser: async (email) => {
      const userId = await resolveUserId(email);
      return filterRows('transactions', (transaction) => transaction.user_id === userId);
    },
  },

  messages: {
    forUser: async (email) => {
      const userId = await resolveUserId(email);
      if (!userId) return [];
      const data = await tryTables('messages', (table) =>
        table
          .select('*')
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
          .order('created_at', { ascending: false })
      );
      return Array.isArray(data) ? data : [];
    },
    forConversation: (conversationId) => filterRows(
      'messages',
      (message) => message.conversation_id === conversationId,
      sortByOldest
    ),
    create: async (payload) => tryTables('messages', async (table) => table.insert(await normalizeMessagePayload(payload)).select('*').single()),
    markRead: async (conversationId, receiverEmail) => {
      try {
        const receiverId = await resolveUserId(receiverEmail);
        return await tryTables('messages', (table) =>
          table.update({ lida: true }).eq('conversation_id', conversationId).eq('receiver_id', receiverId)
        );
      } catch (error) {
        console.warn('Could not mark messages as read:', error);
        return null;
      }
    },
  },

  notifications: {
    create: async (payload) => {
      try {
        return await tryTables('notifications', async (table) => table.insert(await normalizeNotificationPayload(payload)).select('*').single());
      } catch (error) {
        console.warn('Notification skipped:', error);
        return null;
      }
    },
  },

  reviews: {
    forUser: async (email) => {
      const userId = await resolveUserId(email);
      return filterRows('reviews', (review) => review.destinatario_id === userId);
    },
  },

  users: {
    list: () => filterRows('users', () => true),
    byId: (id) => findProfileByField('id', id),
    byEmail: (email) => findProfile(email),
    byIdentity: (identity) => findProfile(identity),
    ensureCurrent: async (authUser, defaults = {}) => {
      if (!authUser?.id) return null;
      const existing = await findProfileByField('id', authUser.id);
      if (existing) return existing;

      const metadata = authUser.user_metadata || authUser.raw_user_meta_data || {};
      return db.users.upsertById({
        id: authUser.id,
        email: authUser.email,
        full_name: metadata.full_name || metadata.name || defaults.full_name || '',
        avatar_url: metadata.avatar_url || metadata.picture || defaults.avatar_url || '',
        foto_perfil: metadata.foto_perfil || metadata.avatar_url || metadata.picture || defaults.foto_perfil || '',
        role: metadata.role || defaults.role || 'freelancer',
      });
    },
    upsertById: (payload) => retryWithoutOptionalColumns(
      async (safePayload) => {
        try {
          return await tryTables('users', (table) => table.upsert(normalizeProfilePayload(safePayload), { onConflict: 'user_id' }).select('*').single());
        } catch (error) {
          if (!isUniqueViolationError(error) || !safePayload.email) throw error;
          return tryTables('users', (table) => table.update(normalizeProfilePayload(safePayload)).eq('email', safePayload.email).select('*').single());
        }
      },
      payload,
      ['ban_status', 'banned_until', 'ban_reason']
    ),
    upsert: (payload) => retryWithoutOptionalColumns(
      (safePayload) => tryTables('users', (table) => table.upsert(normalizeProfilePayload(safePayload), { onConflict: 'email' }).select('*').single()),
      payload,
      ['ban_status', 'banned_until', 'ban_reason']
    ),
    updateById: (id, payload) => retryWithoutOptionalColumns(
      (safePayload) => tryTables('users', (table) => table.update(normalizeProfilePayload(safePayload)).eq('user_id', id).select('*').single()),
      payload,
      ['ban_status', 'banned_until', 'ban_reason']
    ),
    update: (email, payload) => retryWithoutOptionalColumns(
      (safePayload) => tryTables('users', (table) => table.update(normalizeProfilePayload(safePayload)).eq('email', email).select('*').single()),
      payload,
      ['ban_status', 'banned_until', 'ban_reason']
    ),
  },

  freelancerStats: {
    byEmail: async (email) => {
      try {
        const userId = await resolveUserId(email);
        const stats = await filterRows('freelancerStats', (item) => item.user_id === userId);
        return stats[0] || null;
      } catch {
        return null;
      }
    },
    upsert: (payload) => retryWithoutOptionalColumns(
      async (safePayload) => tryTables('freelancerStats', async (table) => table.upsert(await normalizeFreelancerStatsPayload(safePayload), { onConflict: 'user_id' }).select('*').single()),
      payload,
      ['instagram', 'valor_a_combinar']
    ),
  },

  challenges: {
    list: () => filterRows('challenges', () => true),
    visible: async () => {
      const items = await filterRows('challenges', (challenge) => challenge.status === 'ativo' || challenge.status === 'encerrado');
      return items;
    },
    create: (payload) => tryTables('challenges', (table) => table.insert(payload).select('*').single()),
    update: (id, payload) => tryTables('challenges', (table) => table.update(payload).eq('id', id).select('*').single()),
    delete: (id) => tryTables('challenges', (table) => table.delete().eq('id', id)),
  },
};

export const getConversationId = (emailA, emailB, jobId = '') => {
  return [...[emailA, emailB].sort(), jobId].filter(Boolean).join('__');
};
