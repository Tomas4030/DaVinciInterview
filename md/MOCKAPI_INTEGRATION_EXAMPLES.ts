/**
 * 📚 ARQUIVO DE REFERÊNCIA - NÃO É UM ROUTE
 *
 * Este arquivo contém exemplos de implementação para referência.
 * ⚠️ NÃO COPIE AS FUNÇÕES DAQUI COMO UM ROUTE!
 *
 * Os routes reais já estão criados em:
 * ✅ app/api/vagas/route.ts                  - MockAPI proxy (GET/POST vagas)
 * ✅ app/api/candidato-respostas/route.ts    - Supabase (POST candidatura)
 * ✅ app/api/candidato-respostas/[sessaoId]/route.ts - Supabase (GET/POST resposta)
 * ✅ app/api/respostas/route.ts              - Legacy (usa candidato_respostas)
 *
 * 📖 Para documentação:
 * - SUPABASE_RESPOSTAS_SCHEMA.md - Schema SQL + endpoints completos
 * - MOCKAPI_SETUP.md             - Como criar recursos no MockAPI
 * - MOCKAPI_STEP_BY_STEP.md      - Passo a passo prático
 */

// ============================================
// AS FUNÇÕES ABAIXO SÃO APENAS PARA REFERÊNCIA
// COPIAR PARA OS ARQUIVOS CORRECTOS EM app/api/
// ============================================

import { NextRequest, NextResponse } from "next/server";

const MOCKAPI = process.env.MOCKAPI_ENDPOINT;

/*
// ============================================
// EXEMPLO 1: Listar Vagas (Público)
// ============================================
// Arquivo: app/api/vagas/route.ts

export async function GET(request: NextRequest) {
  try {
    if (!MOCKAPI) {
      return NextResponse.json(
        { error: "API endpoint not configured" },
        { status: 500 },
      );
    }

    const response = await fetch(`${MOCKAPI}/vagas`);

    if (!response.ok) {
      throw new Error(`MockAPI error: ${response.statusText}`);
    }

    const vagas = await response.json();

    return NextResponse.json({
      success: true,
      data: vagas,
      total: vagas.length,
    });
  } catch (error) {
    console.error("[GET /api/vagas]", error);
    return NextResponse.json(
      { error: "Failed to fetch vagas" },
      { status: 500 },
    );
  }
}
*/

/*
// ============================================
// EXEMPLO 2: Criar Nova Vaga (Admin)
// ============================================
// Arquivo: app/api/vagas/route.ts (mesmo arquivo, adicionar POST)

export async function POST(request: NextRequest) {
  try {
    // Validar autenticação (vir do header Authorization)
    const authHeader = request.headers.get("authorization");
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      const [email, password] = decoded.split(":");

      if (email !== adminEmail || password !== adminPassword) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    const body = await request.json();

    // Validar campos obrigatórios
    if (!body.id || !body.titulo || !Array.isArray(body.perguntas)) {
      return NextResponse.json(
        { error: "Missing required fields: id, titulo, perguntas" },
        { status: 400 },
      );
    }

    const response = await fetch(`${MOCKAPI}/vagas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`MockAPI error: ${response.statusText}`);
    }

    const novaVaga = await response.json();

    return NextResponse.json(
      {
        success: true,
        data: novaVaga,
        message: "Vaga criada com sucesso",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/vagas]", error);
    return NextResponse.json(
      { error: "Failed to create vaga" },
      { status: 500 },
    );
  }
}
*/

/*
// ============================================
// EXEMPLO 3: Obter Vaga por ID
// ============================================
// Arquivo: app/api/vagas/[vagaId]/route.ts

export async function GET(
  request: NextRequest,
  { params }: { params: { vagaId: string } },
) {
  try {
    const vagaId = params.vagaId;

    const response = await fetch(`${MOCKAPI}/vagas/${vagaId}`);

    if (response.status === 404) {
      return NextResponse.json({ error: "Vaga not found" }, { status: 404 });
    }

    if (!response.ok) {
      throw new Error(`MockAPI error: ${response.statusText}`);
    }

    const vaga = await response.json();

    return NextResponse.json({
      success: true,
      data: vaga,
    });
  } catch (error) {
    console.error("[GET /api/vagas/[vagaId]]", error);
    return NextResponse.json(
      { error: "Failed to fetch vaga" },
      { status: 500 },
    );
  }
}
*/

/*
// ============================================
// EXEMPLO 4: Guardar Resposta do Candidato
// ============================================
// Arquivo: app/api/respostas/route.ts

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar campos obrigatórios
    if (
      !body.sessao_id ||
      !body.vaga_id ||
      !body.pergunta_id ||
      !body.resposta_texto
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: sessao_id, vaga_id, pergunta_id, resposta_texto",
        },
        { status: 400 },
      );
    }

    const response = await fetch(`${MOCKAPI}/respostas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        criada_em: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`MockAPI error: ${response.statusText}`);
    }

    const resposta = await response.json();

    return NextResponse.json(
      {
        success: true,
        data: resposta,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/respostas]", error);
    return NextResponse.json(
      { error: "Failed to save resposta" },
      { status: 500 },
    );
  }
}

// ============================================
// EXEMPLO 5: Criar Candidatura
// ============================================
// Arquivo: app/api/candidaturas/route.ts

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar campos
    if (!body.email || !body.telefone || !body.vaga_id) {
      return NextResponse.json(
        { error: "Missing required fields: email, telefone, vaga_id" },
        { status: 400 },
      );
    }

    // Checar se já existe candidatura para este email+vaga
    const checkResponse = await fetch(
      `${MOCKAPI}/candidaturas?email=${body.email}&vaga_id=${body.vaga_id}`,
    );
    const existing = await checkResponse.json();

    if (existing && existing.length > 0) {
      return NextResponse.json(
        {
          error: "Candidatura já existe para este email e vaga",
          exists: true,
        },
        { status: 409 },
      );
    }

    // Criar nova candidatura
    const response = await fetch(`${MOCKAPI}/candidaturas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        status: "em_progresso",
        email_verificado: false,
        criada_em: new Date().toISOString(),
        atualizada_em: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`MockAPI error: ${response.statusText}`);
    }

    const candidatura = await response.json();

    return NextResponse.json(
      {
        success: true,
        data: candidatura,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/candidaturas]", error);
    return NextResponse.json(
      { error: "Failed to create candidatura" },
      { status: 500 },
    );
  }
}
*/

// ============================================
// COMO USAR NO CLIENTE
// ============================================

/**
 * EXEMPLO 1: Carregar Vagas
 *
 * app/components/VagasGrid.tsx
 */

/*
'use client';

import { useEffect, useState } from 'react';

export function VagasGrid() {
  const [vagas, setVagas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVagas() {
      try {
        const res = await fetch('/api/vagas');
        const json = await res.json();
        
        if (json.success) {
          setVagas(json.data);
        }
      } catch (error) {
        console.error('Failed to load vagas:', error);
      } finally {
        setLoading(false);
      }
    }

    loadVagas();
  }, []);

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      {vagas.map((vaga) => (
        <div key={vaga.id}>
          <h3>{vaga.titulo}</h3>
          <p>{vaga.descricao}</p>
          <button onClick={() => handleStartInterview(vaga.id)}>
            Iniciar Entrevista
          </button>
        </div>
      ))}
    </div>
  );
}
*/

/**
 * EXEMPLO 2: Submeter Resposta
 *
 * app/components/ChatEntrevista.tsx
 */

/*
async function submitResposta(
  sessaoId: string,
  vagaId: string,
  perguntaId: number,
  respostaTexto: string
) {
  try {
    const res = await fetch('/api/respostas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessao_id: sessaoId,
        vaga_id: vagaId,
        pergunta_id: perguntaId,
        resposta_texto: respostaTexto,
        duracao_segundos: 45, // exemplo
      }),
    });

    const json = await res.json();

    if (json.success) {
      console.log('Resposta guardada:', json.data);
      // Prosseguir para próxima pergunta
    } else {
      console.error('Erro ao guardar resposta:', json.error);
    }
  } catch (error) {
    console.error('Erro de network:', error);
  }
}
*/

/**
 * EXEMPLO 3: Criar Candidatura
 *
 * app/components/CandidateInfoForm.tsx
 */

/*
async function submitCandidacy(
  email: string,
  telefone: string,
  vagaId: string,
  sessaoId: string
) {
  try {
    const res = await fetch('/api/candidaturas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        telefone,
        vaga_id: vagaId,
        sessao_id: sessaoId,
      }),
    });

    const json = await res.json();

    if (json.success) {
      console.log('Candidatura criada:', json.data);
      // Redirecionar para próxima página
    } else if (json.exists) {
      console.warn('Você já se candidatou a esta vaga');
    } else {
      console.error('Erro:', json.error);
    }
  } catch (error) {
    console.error('Erro:', error);
  }
}
*/
