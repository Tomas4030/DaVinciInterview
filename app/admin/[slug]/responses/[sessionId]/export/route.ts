import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import { jsonParse, query } from "@/lib/db";
import { getCompanyMembershipBySlug } from "@/lib/queries/companies";

type ResponseRow = {
  interview_title: string | null;
  interview_description: string | null;
  company_name: string | null;
  company_slug: string | null;
  company_logo_url: string | null;
  owner_email: string | null;
  email: string;
  telefone: string;
  status: string;
  created_at: string;
  respostas: string | null;
};

type Layout = {
  pageWidth: number;
  pageHeight: number;
  marginX: number;
  topY: number;
  bottomY: number;
  contentWidth: number;
};

const layout: Layout = {
  pageWidth: 595.28,
  pageHeight: 841.89,
  marginX: 52,
  topY: 785,
  bottomY: 62,
  contentWidth: 595.28 - 104,
};

function getQuestionLabel(item: any, index: number): string {
  if (typeof item?.texto_pergunta === "string" && item.texto_pergunta.trim()) {
    return item.texto_pergunta;
  }
  if (typeof item?.question === "string" && item.question.trim()) {
    return item.question;
  }
  if (typeof item?.pergunta === "string" && item.pergunta.trim()) {
    return item.pergunta;
  }
  return `Pergunta ${index + 1}`;
}

function getAnswerText(item: any): string {
  if (typeof item?.resposta_texto === "string" && item.resposta_texto.trim()) {
    return item.resposta_texto;
  }
  if (typeof item?.resposta === "string" && item.resposta.trim()) {
    return item.resposta;
  }
  if (typeof item?.answer === "string" && item.answer.trim()) {
    return item.answer;
  }
  return "";
}

function normalizeInlineText(value: string | null | undefined): string {
  return String(value || "")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitParagraphs(value: string | null | undefined): string[] {
  const raw = String(value || "").replace(/\r\n/g, "\n").trim();
  if (!raw) return [];

  const fromBreaks = raw
    .split(/\n{2,}/)
    .map((part) => part.replace(/\n/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (fromBreaks.length > 1) return fromBreaks;

  const single = fromBreaks[0] || raw.replace(/\s+/g, " ").trim();
  if (single.length < 260) return [single];

  const sentences = single
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const paragraphs: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length <= 240) {
      current = candidate;
      continue;
    }

    if (current) paragraphs.push(current);
    current = sentence;
  }

  if (current) paragraphs.push(current);
  return paragraphs.length ? paragraphs : [single];
}

function wrapLines(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const normalized = normalizeInlineText(text);
  if (!normalized) return [""];

  const words = normalized.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (!current) {
      current = word;
      continue;
    }

    const candidate = `${current} ${word}`;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function addContentPage(pdf: PDFDocument): { page: PDFPage; y: number } {
  const page = pdf.addPage([layout.pageWidth, layout.pageHeight]);

  page.drawRectangle({
    x: 0,
    y: layout.pageHeight - 78,
    width: layout.pageWidth,
    height: 78,
    color: rgb(0.07, 0.14, 0.28),
  });

  page.drawRectangle({
    x: 0,
    y: layout.pageHeight - 84,
    width: layout.pageWidth,
    height: 6,
    color: rgb(0.1, 0.46, 0.84),
  });

  return {
    page,
    y: layout.topY - 42,
  };
}

function drawContentPageHeader(page: PDFPage, companyName: string, fontBold: PDFFont, fontRegular: PDFFont): void {
  page.drawText(companyName, {
    x: layout.marginX,
    y: layout.pageHeight - 44,
    size: 13,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText("Relatorio de respostas", {
    x: layout.pageWidth - 177,
    y: layout.pageHeight - 42,
    size: 10,
    font: fontRegular,
    color: rgb(0.81, 0.89, 0.98),
  });
}

function splitToBullets(value: string | null | undefined, maxItems = 6): string[] {
  const raw = String(value || "").trim();
  if (!raw) return [];

  const candidates = raw
    .split(/\n|\u2022|\-|;|\|/)
    .map((item) => item.trim())
    .filter(Boolean);

  const base = candidates.length > 1 ? candidates : raw.split(/(?<=[.!?])\s+/).map((item) => item.trim()).filter(Boolean);

  return base
    .map((item) => item.replace(/^[\d.)\s-]+/, "").trim())
    .filter((item) => item.length >= 5)
    .slice(0, maxItems);
}

function extractJobSections(description: string | null | undefined): {
  intro: string[];
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
} {
  const paragraphs = splitParagraphs(description);
  const intro: string[] = [];
  let responsibilities: string[] = [];
  let requirements: string[] = [];
  let benefits: string[] = [];

  for (const paragraph of paragraphs) {
    const lower = paragraph.toLowerCase();
    if (lower.includes("responsabil")) {
      responsibilities = responsibilities.concat(splitToBullets(paragraph));
      continue;
    }
    if (lower.includes("requisit") || lower.includes("perfil") || lower.includes("competenc")) {
      requirements = requirements.concat(splitToBullets(paragraph));
      continue;
    }
    if (lower.includes("ofere") || lower.includes("benef") || lower.includes("vantagen")) {
      benefits = benefits.concat(splitToBullets(paragraph));
      continue;
    }
    intro.push(paragraph);
  }

  if (intro.length === 0 && paragraphs.length > 0) {
    intro.push(paragraphs[0]);
  }

  const fallbackBullets = splitToBullets(paragraphs.join(" "));
  if (responsibilities.length === 0) responsibilities = fallbackBullets.slice(0, 3);
  if (requirements.length === 0) requirements = fallbackBullets.slice(1, 4);
  if (benefits.length === 0) benefits = fallbackBullets.slice(2, 5);

  return {
    intro: intro.slice(0, 2),
    responsibilities: responsibilities.slice(0, 5),
    requirements: requirements.slice(0, 5),
    benefits: benefits.slice(0, 5),
  };
}

function drawBulletSection(
  page: PDFPage,
  title: string,
  items: string[],
  x: number,
  y: number,
  width: number,
  fontRegular: PDFFont,
  fontBold: PDFFont,
): number {
  page.drawText(title, {
    x,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0.08, 0.18, 0.34),
  });
  let cursor = y - 16;

  for (const item of items) {
    const lines = wrapLines(item, fontRegular, 10.5, width - 22);
    page.drawCircle({ x: x + 4, y: cursor + 4, size: 2.2, color: rgb(0.16, 0.45, 0.78) });

    for (const line of lines) {
      page.drawText(line, {
        x: x + 12,
        y: cursor,
        size: 10.5,
        font: fontRegular,
        color: rgb(0.2, 0.26, 0.34),
      });
      cursor -= 14;
    }
    cursor -= 6;
  }

  return cursor;
}

function addQaPage(pdf: PDFDocument, companyName: string, fontBold: PDFFont, fontRegular: PDFFont): { page: PDFPage; y: number } {
  const content = addContentPage(pdf);
  drawContentPageHeader(content.page, companyName, fontBold, fontRegular);

  let y = content.y;
  content.page.drawText("Perguntas & Respostas", {
    x: layout.marginX,
    y,
    size: 17,
    font: fontBold,
    color: rgb(0.08, 0.14, 0.27),
  });
  y -= 10;
  content.page.drawRectangle({
    x: layout.marginX,
    y,
    width: layout.contentWidth,
    height: 1,
    color: rgb(0.84, 0.88, 0.94),
  });

  return { page: content.page, y: y - 24 };
}

async function tryEmbedLogo(pdf: PDFDocument, url: string | null): Promise<{ width: number; height: number; image: any } | null> {
  const src = normalizeInlineText(url);
  if (!src) return null;

  try {
    const response = await fetch(src);
    if (!response.ok) return null;
    const contentType = String(response.headers.get("content-type") || "").toLowerCase();
    const bytes = new Uint8Array(await response.arrayBuffer());

    if (contentType.includes("png") || src.toLowerCase().includes(".png")) {
      const image = await pdf.embedPng(bytes);
      return { width: image.width, height: image.height, image };
    }

    if (
      contentType.includes("jpeg") ||
      contentType.includes("jpg") ||
      src.toLowerCase().includes(".jpg") ||
      src.toLowerCase().includes(".jpeg")
    ) {
      const image = await pdf.embedJpg(bytes);
      return { width: image.width, height: image.height, image };
    }

    return null;
  } catch {
    return null;
  }
}

function drawPageNumber(page: PDFPage, pageNumber: number, totalPages: number, font: PDFFont): void {
  const label = `${pageNumber}/${totalPages}`;
  const w = font.widthOfTextAtSize(label, 9);
  page.drawText(label, {
    x: layout.pageWidth - layout.marginX - w,
    y: 34,
    size: 9,
    font,
    color: rgb(0.45, 0.5, 0.58),
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string; sessionId: string } },
) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = parseAdminToken(token);
  if (!session) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const membership = await getCompanyMembershipBySlug(session.userId, params.slug);
  if (!membership) {
    return NextResponse.json({ error: "Empresa nao encontrada" }, { status: 404 });
  }

  const [rows] = await query<ResponseRow>(
    `
    SELECT
      i.title AS interview_title,
      i.description AS interview_description,
      c.name AS company_name,
      c.slug AS company_slug,
      c.logo_url AS company_logo_url,
      u.email AS owner_email,
      cr.email,
      cr.telefone,
      cr.status,
      cr.criada_em AS created_at,
      cr.respostas
    FROM candidato_respostas cr
    LEFT JOIN interviews i ON i.id = cr.interview_id
    LEFT JOIN companies c ON c.id = cr.company_id
    LEFT JOIN users u ON u.id = c.owner_id
    WHERE cr.company_id = ? AND cr.sessao_id = ?
    LIMIT 1
    `,
    [membership.company.id, params.sessionId],
  );

  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: "Sessao nao encontrada" }, { status: 404 });
  }

  const answers = jsonParse<any[]>(row.respostas) || [];
  const companyName = normalizeInlineText(row.company_name) || membership.company.name;

  const pdf = await PDFDocument.create();
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const cover = pdf.addPage([layout.pageWidth, layout.pageHeight]);

  cover.drawRectangle({
    x: 0,
    y: 0,
    width: layout.pageWidth,
    height: layout.pageHeight,
    color: rgb(0.05, 0.11, 0.21),
  });

  cover.drawRectangle({
    x: 0,
    y: layout.pageHeight - 236,
    width: layout.pageWidth,
    height: 236,
    color: rgb(0.08, 0.18, 0.34),
    opacity: 0.9,
  });

  cover.drawCircle({ x: 500, y: 730, size: 150, color: rgb(0.11, 0.37, 0.66), opacity: 0.33 });
  cover.drawCircle({ x: 112, y: 110, size: 128, color: rgb(0.1, 0.31, 0.56), opacity: 0.27 });

  const logo = await tryEmbedLogo(pdf, row.company_logo_url);
  if (logo) {
    const maxW = 170;
    const maxH = 70;
    const scale = Math.min(maxW / logo.width, maxH / logo.height, 1);
    const drawW = logo.width * scale;
    const drawH = logo.height * scale;
    cover.drawImage(logo.image, {
      x: (layout.pageWidth - drawW) / 2,
      y: 600,
      width: drawW,
      height: drawH,
    });
  }

  const companyNameSize = 34;
  const companyNameWidth = fontBold.widthOfTextAtSize(companyName, companyNameSize);
  cover.drawText(companyName, {
    x: (layout.pageWidth - companyNameWidth) / 2,
    y: 510,
    size: companyNameSize,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  const reportTitle = "Relatorio de Entrevista";
  const reportTitleSize = 19;
  const reportTitleWidth = fontRegular.widthOfTextAtSize(reportTitle, reportTitleSize);
  cover.drawText(reportTitle, {
    x: (layout.pageWidth - reportTitleWidth) / 2,
    y: 468,
    size: reportTitleSize,
    font: fontRegular,
    color: rgb(0.87, 0.92, 1),
  });

  const dateLine = `Data: ${formatDate(row.created_at)}`;
  const contactLine = `Email: ${normalizeInlineText(row.owner_email) || "n/a"}`;
  const slugLine = normalizeInlineText(row.company_slug)
    ? `Portal: ${row.company_slug}`
    : "Portal: interno";

  const infoBoxWidth = 214;
  const infoBoxHeight = 92;
  const infoX = layout.pageWidth - layout.marginX - infoBoxWidth;
  const infoY = 300;
  cover.drawRectangle({
    x: infoX,
    y: infoY,
    width: infoBoxWidth,
    height: infoBoxHeight,
    color: rgb(0.1, 0.19, 0.35),
    opacity: 0.72,
  });
  cover.drawRectangle({
    x: infoX,
    y: infoY + infoBoxHeight - 1,
    width: infoBoxWidth,
    height: 1,
    color: rgb(0.33, 0.48, 0.7),
  });
  cover.drawText(dateLine, {
    x: infoX + 14,
    y: infoY + 63,
    size: 10,
    font: fontRegular,
    color: rgb(0.83, 0.89, 0.97),
  });
  cover.drawText(contactLine, {
    x: infoX + 14,
    y: infoY + 43,
    size: 10,
    font: fontRegular,
    color: rgb(0.83, 0.89, 0.97),
  });
  cover.drawText(slugLine, {
    x: infoX + 14,
    y: infoY + 23,
    size: 10,
    font: fontRegular,
    color: rgb(0.83, 0.89, 0.97),
  });

  cover.drawRectangle({
    x: layout.marginX,
    y: 86,
    width: layout.contentWidth,
    height: 1,
    color: rgb(0.37, 0.47, 0.61),
  });

  cover.drawText("Documento corporativo confidencial", {
    x: layout.marginX,
    y: 64,
    size: 9,
    font: fontRegular,
    color: rgb(0.73, 0.79, 0.87),
  });

  const pageTwo = addContentPage(pdf);
  let page = pageTwo.page;
  drawContentPageHeader(page, companyName, fontBold, fontRegular);

  const leftRatio = 0.63;
  const leftWidth = Math.floor(layout.contentWidth * leftRatio);
  const columnGap = 18;
  const rightWidth = layout.contentWidth - leftWidth - columnGap;
  const leftX = layout.marginX;
  const rightX = leftX + leftWidth + columnGap;
  let leftY = pageTwo.y;

  page.drawText("Vaga", {
    x: leftX,
    y: leftY,
    size: 16,
    font: fontBold,
    color: rgb(0.08, 0.14, 0.27),
  });
  leftY -= 10;
  page.drawRectangle({ x: leftX, y: leftY, width: leftWidth, height: 1, color: rgb(0.84, 0.88, 0.94) });
  leftY -= 22;

  page.drawRectangle({ x: leftX, y: leftY - 46, width: leftWidth, height: 42, color: rgb(0.93, 0.96, 1) });
  page.drawRectangle({ x: leftX, y: leftY - 46, width: 4, height: 42, color: rgb(0.13, 0.45, 0.82) });
  page.drawText(normalizeInlineText(row.interview_title) || "Entrevista", {
    x: leftX + 12,
    y: leftY - 27,
    size: 14,
    font: fontBold,
    color: rgb(0.07, 0.13, 0.25),
  });
  leftY -= 64;

  const jobSections = extractJobSections(row.interview_description);
  const introParagraphs = jobSections.intro.length > 0 ? jobSections.intro : ["Sem descricao disponivel para esta vaga."];

  page.drawText("Descricao", {
    x: leftX,
    y: leftY,
    size: 11,
    font: fontBold,
    color: rgb(0.08, 0.18, 0.34),
  });
  leftY -= 16;
  for (const paragraph of introParagraphs) {
    const lines = wrapLines(paragraph, fontRegular, 10.5, leftWidth - 2);
    for (const line of lines) {
      page.drawText(line, {
        x: leftX,
        y: leftY,
        size: 10.5,
        font: fontRegular,
        color: rgb(0.2, 0.26, 0.34),
      });
      leftY -= 14;
    }
    leftY -= 8;
  }

  leftY = drawBulletSection(
    page,
    "Responsabilidades",
    jobSections.responsibilities,
    leftX,
    leftY,
    leftWidth,
    fontRegular,
    fontBold,
  );
  leftY -= 8;
  leftY = drawBulletSection(
    page,
    "Requisitos",
    jobSections.requirements,
    leftX,
    leftY,
    leftWidth,
    fontRegular,
    fontBold,
  );
  leftY -= 8;
  drawBulletSection(
    page,
    "Oferecemos",
    jobSections.benefits,
    leftX,
    leftY,
    leftWidth,
    fontRegular,
    fontBold,
  );

  let rightY = pageTwo.y;
  page.drawText("Candidato", {
    x: rightX,
    y: rightY,
    size: 16,
    font: fontBold,
    color: rgb(0.08, 0.14, 0.27),
  });
  rightY -= 10;
  page.drawRectangle({ x: rightX, y: rightY, width: rightWidth, height: 1, color: rgb(0.84, 0.88, 0.94) });
  rightY -= 20;

  const candidateCards = [
    { title: "Email", value: normalizeInlineText(row.email) || "-" },
    { title: "Telefone", value: normalizeInlineText(row.telefone) || "-" },
    { title: "Estado", value: normalizeInlineText(row.status) || "-" },
  ];

  for (const card of candidateCards) {
    const valueLines = wrapLines(card.value, fontRegular, 10.5, rightWidth - 20).slice(0, 3);
    const cardHeight = 56 + valueLines.length * 13;

    page.drawRectangle({
      x: rightX,
      y: rightY - cardHeight,
      width: rightWidth,
      height: cardHeight,
      color: rgb(0.99, 0.992, 1),
    });
    page.drawRectangle({
      x: rightX,
      y: rightY - cardHeight,
      width: rightWidth,
      height: 1,
      color: rgb(0.86, 0.9, 0.95),
    });

    page.drawText(`[ ${card.title} ]`, {
      x: rightX + 10,
      y: rightY - 22,
      size: 10,
      font: fontBold,
      color: rgb(0.08, 0.29, 0.53),
    });

    let valueY = rightY - 42;
    for (const line of valueLines) {
      page.drawText(line, {
        x: rightX + 10,
        y: valueY,
        size: 10.5,
        font: fontRegular,
        color: rgb(0.14, 0.2, 0.29),
      });
      valueY -= 13;
    }

    rightY -= cardHeight + 18;
  }

  let qa = addQaPage(pdf, companyName, fontBold, fontRegular);
  page = qa.page;
  let y = qa.y;

  const ensureQaSpace = (heightNeeded: number) => {
    if (y - heightNeeded >= layout.bottomY) return;
    qa = addQaPage(pdf, companyName, fontBold, fontRegular);
    page = qa.page;
    y = qa.y;
  };

  if (answers.length === 0) {
    ensureQaSpace(70);
    page.drawRectangle({
      x: layout.marginX,
      y: y - 46,
      width: layout.contentWidth,
      height: 46,
      color: rgb(0.99, 0.99, 0.99),
    });
    page.drawText("Nao existem respostas registadas para esta sessao.", {
      x: layout.marginX + 12,
      y: y - 28,
      size: 11,
      font: fontRegular,
      color: rgb(0.37, 0.42, 0.48),
    });
  } else {
    for (let i = 0; i < answers.length; i += 1) {
      const question = normalizeInlineText(getQuestionLabel(answers[i], i));
      const answer = normalizeInlineText(getAnswerText(answers[i])) || "Sem resposta.";
      const questionLines = wrapLines(question, fontBold, 11.5, layout.contentWidth - 24);
      const answerLines = wrapLines(answer, fontRegular, 10.8, layout.contentWidth - 24);
      const cardHeight = 88 + questionLines.length * 15 + answerLines.length * 14;

      ensureQaSpace(cardHeight + 20);

      page.drawRectangle({
        x: layout.marginX,
        y: y - cardHeight,
        width: layout.contentWidth,
        height: cardHeight,
        color: rgb(0.995, 0.996, 1),
      });
      page.drawRectangle({
        x: layout.marginX,
        y: y - cardHeight,
        width: 4,
        height: cardHeight,
        color: rgb(0.1, 0.46, 0.84),
      });

      page.drawRectangle({
        x: layout.marginX + 12,
        y: y - 30,
        width: 22,
        height: 22,
        color: rgb(0.1, 0.46, 0.84),
      });
      page.drawText(String(i + 1), {
        x: layout.marginX + 18,
        y: y - 22,
        size: 10,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      page.drawText("Pergunta:", {
        x: layout.marginX + 42,
        y: y - 21,
        size: 10,
        font: fontBold,
        color: rgb(0.09, 0.15, 0.27),
      });

      let textY = y - 40;
      for (const line of questionLines) {
        page.drawText(line, {
          x: layout.marginX + 12,
          y: textY,
          size: 11.5,
          font: fontBold,
          color: rgb(0.09, 0.15, 0.27),
        });
        textY -= 15;
      }

      textY -= 2;
      page.drawRectangle({
        x: layout.marginX + 12,
        y: textY + 6,
        width: layout.contentWidth - 24,
        height: 1,
        color: rgb(0.88, 0.91, 0.95),
      });

      page.drawText("Resposta:", {
        x: layout.marginX + 12,
        y: textY - 10,
        size: 10,
        font: fontBold,
        color: rgb(0.08, 0.29, 0.53),
      });

      let answerY = textY - 28;
      for (const line of answerLines) {
        page.drawText(line, {
          x: layout.marginX + 12,
          y: answerY,
          size: 10.8,
          font: fontRegular,
          color: rgb(0.21, 0.26, 0.33),
        });
        answerY -= 14;
      }

      y -= cardHeight + 20;
    }
  }

  const pages = pdf.getPages();
  for (let i = 0; i < pages.length; i += 1) {
    drawPageNumber(pages[i], i + 1, pages.length, fontRegular);
  }

  const pdfBytes = await pdf.save();
  const buffer = pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength,
  ) as ArrayBuffer;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="transcricao-${params.sessionId}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
