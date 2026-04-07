# Checklist de Implementação

## ✅ Completado

### Mock API

- [x] Criado `/data/vagas.json` com dados de exemplo
- [x] Criado `/lib/mock-api.ts` com funções para aceder a vagas
- [x] Atualizado `/app/api/vagas/route.ts` para usar Mock API
- [x] Homepage agora carrega vagas da Mock API

### Autenticação Admin

- [x] Criado `/lib/admin-auth.ts` com credenciais
- [x] Criado `/app/api/auth/login-admin/route.ts`
- [x] Atualizado `/components/admin/LoginForm.tsx` para usar nova auth

### Validação de Contacto

- [x] Criado `/lib/validation.ts` com validações de email e telemóvel
- [x] Criado `/components/home/CandidateInfoForm.tsx`
- [x] Criado `/components/EntrevistaContainer.tsx` para fluxo com formulário

### Verificação de Email

- [x] Criado `/app/api/candidatos/verify-email/route.ts`
- [x] Integrado no fluxo de candidatura

### Prevenção de Duplicatas

- [x] Criado `/app/api/candidatos/check/route.ts`
- [x] Atualizado `supabase/schema.sql` com tabela `candidacies`
- [x] Criado índice único para prevenir duplicatas (90 dias)

### Armazenamento de Candidaturas

- [x] Criado `/app/api/candidatos/create/route.ts`
- [x] Atualizado `/components/chat/ChatEntrevista.tsx` para guardar candidatura

### Documentação

- [x] Criado `SETUP_GUIDE.md` com instruções completas
- [x] Documentadas todas as APIs
- [x] Incluídas credenciais do admin

---

## 📋 Próximas Ações

### 1. Executar o Schema SQL no Supabase

Copia o código da tabela `candidacies` de `supabase/schema.sql` e executa no SQL Editor do Supabase:

```sql
create table if not exists public.candidacies (
  id           uuid        primary key default gen_random_uuid(),
  email        text        not null,
  telefone     text        not null,
  vaga_id      text        not null references public.vagas(id) on delete cascade,
  sessao_id    uuid        not null unique references public.respostas(sessao_id) on delete cascade,
  email_verificado boolean  not null default false,
  criada_em    timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);

create unique index if not exists candidacies_unique_idx
  on public.candidacies(email, telefone, vaga_id)
  where criada_em > now() - interval '90 days';

create trigger candidacies_updated_at
  before update on public.candidacies
  for each row execute procedure public.set_updated_at();
```

### 2. Configurar Variáveis de Ambiente

Adiciona ao `.env.local` se necessário:

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Testar o Fluxo Completo

- [ ] Abre a homepage
- [ ] Clica em "Ver vagas disponíveis"
- [ ] Clica "Iniciar" numa vaga
- [ ] Preenche email e telemóvel
- [ ] Verifica o email de verificação
- [ ] Completa a entrevista
- [ ] Verifica que a candidatura foi guardada

### 4. Testar Admin

- [ ] Vai para `/admin/login`
- [ ] Faz login com `admin@davincinterviews.com` / `DaVinci@2026Secure!`
- [ ] Testa a criação de nova vaga

### 5. Testes Adicionais

- [ ] Email/telemóvel inválidos (deve rejeitar)
- [ ] Candidatura duplicada (deve avisar)
- [ ] Candidatura a vaga diferente (deve permitir)
- [ ] Verificação de email (deve enviar)

---

## 🚀 Deployment

Antes de fazer deploy em produção:

1. **Mudar a password do admin**
   - Atualiza em `/lib/admin-auth.ts`

2. **Configurar variáveis de ambiente**
   - `NEXT_PUBLIC_APP_URL` deve apontar para o domínio correto

3. **Executar migrações Supabase**
   - Garante que a tabela `candidacies` foi criada

4. **Testes E2E**
   - Testa todo o fluxo em staging

5. **Monitoração**
   - Configura logs para as APIs críticas
   - Monitora erros no Sentry ou similar

---

## 📞 Suporte

Para problemas:

1. Verifica os logs do servidor: `npm run dev`
2. Abre Developer Tools (F12) para ver erros no client
3. Verifica o SQL Editor do Supabase para erros nas queries

---

Última atualização: 7 de Abril de 2026
