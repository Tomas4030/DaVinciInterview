# MatchWorky Interview 🤖

**MatchWorky Interview** é uma plataforma moderna de recrutamento que utiliza uma interface de chatbot para conduzir entrevistas preliminares. Construída com **Next.js 14**, **Tailwind CSS** e **Supabase**, a aplicação automatiza a recolha de respostas de candidatos de forma conversacional e eficiente.

---

## 🚀 Funcionalidades

### 👥 Para Candidatos

- **Interface Conversacional**: Entrevistas em formato de chat amigável e intuitivo.
- **Progresso em Tempo Real**: Barra de progresso visual durante a entrevista.
- **Sem Atrito**: Não requer criação de conta para responder às vagas.
- **Persistência**: Respostas guardadas automaticamente a cada passo.

### 🔐 Para Administradores (`/admin`)

- **Gestão de Vagas**: Criar, editar e desativar vagas com facilidade.
- **Construtor de Questionários**: Configuração de perguntas personalizadas para cada vaga.
- **Dashboard de Candidaturas**: Visualização centralizada de todas as respostas recebidas.
- **Exportação de Dados**: Suporte para exportação de respostas (PDF/CSV).
- **Segurança**: Área administrativa protegida por autenticação Supabase.

---

## 🛠️ Stack Tecnológica

| Camada               | Tecnologia                                                  |
| -------------------- | ----------------------------------------------------------- |
| **Frontend**         | [Next.js 14](https://nextjs.org/) (App Router) + TypeScript |
| **Estilização**      | [Tailwind CSS](https://tailwindcss.com/)                    |
| **Backend & BD**     | [Supabase](https://supabase.com/) (PostgreSQL)              |
| **Autenticação**     | Supabase Auth                                               |
| **IA & Integrações** | OpenAI API (Análise de respostas)                           |
| **E-mail**           | Nodemailer                                                  |

---

## 📂 Estrutura do Projeto

```text
MatchWorkyInterview/
├── app/                # Rotas do Next.js (App Router)
│   ├── admin/          # Dashboard e gestão administrativa
│   ├── api/            # Endpoints da API (Vagas, Respostas, Análise)
│   └── entrevista/     # Interface pública de entrevista
├── components/         # Componentes React reutilizáveis
├── lib/                # Configurações (Supabase client, utils)
├── public/             # Assets estáticos
└── supabase/           # Scripts SQL e migrações da base de dados
```

---

## ⚙️ Configuração Local

### 1. Requisitos

- Node.js 18+
- Conta no Supabase

### 2. Instalação

```bash
# Clonar o repositório
git clone https://github.com/Tomas4030/MatchWorkyInterview.git
cd MatchWorkyInterview

# Instalar dependências
npm install
```

### 3. Variáveis de Ambiente

Crie um ficheiro `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=seu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_supabase
OPENAI_API_KEY=sua_chave_openai
```

### 4. Base de Dados

Execute o script em `supabase/schema.sql` no **SQL Editor** do seu projeto Supabase para criar as tabelas e políticas de segurança (RLS).

### 5. Execução

```bash
npm run dev
```

Aceda a `http://localhost:3000`.

---

## 💡 Ideias Futuras (Roadmap)

Aqui estão algumas sugestões para elevar o projeto ao próximo nível:

1.  **🧠 Análise de Sentimento com IA**: Integrar a API da OpenAI para classificar automaticamente a qualidade e o tom das respostas dos candidatos.
2.  **📊 Dashboard de Analytics**: Gráficos avançados com taxas de conclusão de entrevistas e tempos médios de resposta.
3.  **📧 Notificações em Tempo Real**: Envio automático de e-mails para o administrador (via Resend/Nodemailer) sempre que um novo candidato concluir uma entrevista.
4.  **📑 Exportação Avançada**: Gerar relatórios em PDF formatados profissionalmente com o resumo da entrevista do candidato.
5.  **💬 Perguntas Dinâmicas**: Implementar lógica de ramificação (branching), onde a próxima pergunta depende da resposta anterior do candidato.
6.  **🌍 Suporte Multi-idioma (i18n)**: Permitir que as entrevistas sejam criadas e realizadas em diferentes línguas.

---

## 📄 Licença

Este projeto está sob a licença MIT. Consulte o ficheiro [LICENSE](LICENSE) para mais detalhes.

---

⭐ Desenvolvido por [Tomás Miguel](https://github.com/Tomas4030)
