# DaVinci Interviews - Setup Completo

## 📋 Resumo das Mudanças

Este documento descreve todas as mudanças implementadas para suportar:

- Mock API para gestão dinâmica de vagas
- Autenticação de admin
- Coleta de dados de contacto (email e telefone)
- Verificação de email via Supabase
- Prevenção de candidaturas duplicadas
- Armazenamento de candidaturas em Supabase

---

## 👤 Credenciais do Admin

Para aceder ao painel de administração:

**Email:** `admin@davincinterviews.com`  
**Password:** `DaVinci@2026Secure!`

> ⚠️ Muda esta password em produção!

---

## 🏗️ Arquitetura

### Mock API (Vagas)

- **Localização:** `/data/vagas.json`
- **Uso:** Armazenar informações de vagas e perguntas
- **Endpoint:** `GET/POST /api/vagas`

### Supabase (Respostas & Candidaturas)

- **Tabela `respostas`:** Armazena as respostas dos utilizadores
- **Tabela `candidacies`:** Rastreia candidaturas para prevenir duplicatas
  - Campos: `email`, `telefone`, `vaga_id`, `sessao_id`, `email_verificado`, `criada_em`, `atualizada_em`

---

## 📱 Fluxo de Candidatura

1. **Utilizador clica em "Iniciar"** na página principal
2. **Formulário de Contacto**: Pede email e telefone válidos
3. **Verificação de Duplicata**: Verifica se email+telefone+vaga_id já existe
   - ✅ Se não existe: Envia email de verificação
   - ❌ Se existe: Mostra aviso "Estamos a analisar a sua candidatura"
4. **Entrevista**: Após verificação, abre o chat
5. **Conclusão**: Guarda candidatura em `candidacies`

---

## 🔧 APIs Criadas

### `POST /api/auth/login-admin`

Autentica o admin e retorna um token.

**Body:**

```json
{
  "email": "admin@davincinterviews.com",
  "password": "DaVinci@2026Secure!"
}
```

**Response:**

```json
{
  "success": true,
  "token": "base64_encoded_token",
  "admin": { "email": "...", "role": "admin" }
}
```

---

### `GET /api/vagas`

Lista todas as vagas ativas da Mock API.

**Response:**

```json
[
  {
    "id": "fullstack-senior",
    "titulo": "Senior Fullstack Developer",
    "descricao": "...",
    "modalidade": "Remoto",
    "duracao_min": 15,
    "total_perguntas": 3,
    "ativa": true,
    "criada_em": "2026-04-01T10:00:00Z"
  }
]
```

---

### `POST /api/vagas` (Admin Only)

Cria uma nova vaga na Mock API.

**Headers:**

```
Authorization: Bearer {token}
```

**Body:**

```json
{
  "id": "novo-cargo",
  "titulo": "Novo Cargo",
  "descricao": "Descrição...",
  "modalidade": "Remoto",
  "duracao_min": 20,
  "perguntas": [
    { "id": 1, "texto": "Pergunta 1?" },
    { "id": 2, "texto": "Pergunta 2?" }
  ]
}
```

---

### `POST /api/candidatos/check`

Verifica se já existe candidatura para email+telefone+vaga_id.

**Body:**

```json
{
  "email": "user@example.com",
  "telefone": "+351912345678",
  "vaga_id": "fullstack-senior"
}
```

**Response (já existe):**

```json
{
  "exists": true,
  "message": "Estamos a analisar a sua candidatura."
}
```

**Response (novo):**

```json
{
  "exists": false
}
```

---

### `POST /api/candidatos/verify-email`

Envia um email de verificação via Supabase.

**Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Email de verificação enviado!"
}
```

---

### `POST /api/candidatos/create`

Cria um registo de candidatura após conclusão da entrevista.

**Body:**

```json
{
  "email": "user@example.com",
  "telefone": "+351912345678",
  "vaga_id": "fullstack-senior",
  "sessao_id": "uuid-da-sessao"
}
```

---

## 📊 Tabela SQL Criada

```sql
CREATE TABLE public.candidacies (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  vaga_id TEXT NOT NULL,
  sessao_id UUID NOT NULL UNIQUE,
  email_verificado BOOLEAN DEFAULT FALSE,
  criada_em TIMESTAMPTZ DEFAULT NOW(),
  atualizada_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX candidacies_unique_idx
  ON public.candidacies(email, telefone, vaga_id)
  WHERE criada_em > now() - interval '90 days';
```

---

## 🚀 Como Usar

### Para Candidatos

1. Visita a página principal
2. Clica em "Ver vagas disponíveis"
3. Clica em "Iniciar" numa vaga
4. Preenche email e telemóvel válidos
5. Verifica o email recebido
6. Completa a entrevista

### Para Admins

1. Vai para `/admin/login`
2. Introduz as credenciais
3. Acede ao painel de administração
4. Cria novas vagas com perguntas
5. Visualiza candidaturas e respostas

---

## ✅ Validações

### Email

- Formato válido: `user@example.com`

### Telemóvel (Portugal)

Aceita os seguintes formatos:

- `91 234 5678`
- `+351 91 234 5678`
- `9XXXXXXXX`
- `+351XXXXXXXXX`

---

## 🔐 Segurança

- Verificação de email via Supabase Auth
- Prevenção de candidaturas duplicatas
- Índice único com constraint de 90 dias
- RLS (Row Level Security) no Supabase

---

## 📝 Próximas Melhorias

- [ ] Dashboard de admin com gráficos
- [ ] Exportação de candidaturas em CSV/PDF
- [ ] Agendamento de entrevistas de video
- [ ] Notificações por email automáticas
- [ ] Rating/Scoring de candidatos
- [ ] Integração com sistemas ATS

---

## 🆘 Troubleshooting

### "Email de verificação não chegou"

- Verifica a pasta de spam
- Aguarda alguns minutos
- Tenta novamente

### "Já existe candidatura"

- Podes candidatar-te a outras vagas
- Aguarda feedback da equipa
- Contacta suporte se consideras incorreto

### Erro na Mock API

- Verifica se `/data/vagas.json` existe
- Valida o JSON
- Reinicia o servidor Next.js

---

## 📞 Contacto

Para dúvidas ou sugestões, contacta o time de desenvolvimento.
