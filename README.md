# Initlance

Aplicacao React/Vite da plataforma Initlance, usando Supabase para autenticacao, banco de dados e storage.

## Configuracao

Crie `.env.local` com:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon
```

Depois rode o schema em `supabase_schema.sql` no SQL Editor do Supabase.

## Scripts

```bash
npm install
npm run dev
npm run build
```
