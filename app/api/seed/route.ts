import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Moto } from "@/lib/models/moto";
import { Contato } from "@/lib/models/contato";
import { Proprietario } from "@/lib/models/proprietario";
import { mockMotos, mockContatos, mockProprietarios } from "@/lib/mock-data";
import { requireAdmin } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

/**
 * Popula o MongoDB com mock-data quando vazio. Endpoint é destrutivo
 * (`?reset=1` apaga TUDO), então exige admin autenticado SEMPRE — não basta
 * `NODE_ENV !== "production"`, porque preview/staging também caem nessa branch.
 *
 *   GET /api/seed          → popula coleções vazias
 *   GET /api/seed?reset=1  → limpa + popula
 */
export async function GET(req: Request) {
  // Whitelist explícita: só roda em "development". Qualquer outro ambiente
  // (production, preview, staging, test) bloqueia. NODE_ENV unset também
  // não passa — fail-safe.
  const env = process.env.NODE_ENV;
  if (env !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const reset = searchParams.get("reset") === "1";

    const stats = {
      motos: 0,
      contatos: 0,
      proprietarios: 0,
      reset,
    };

    if (reset) {
      await Promise.all([
        Moto.deleteMany({}),
        Contato.deleteMany({}),
        Proprietario.deleteMany({}),
      ]);
    }

    const propCount = await Proprietario.countDocuments();
    if (propCount === 0) {
      const props = mockProprietarios.map((p) => ({
        nome: p.nome,
        cpf: p.cpf,
        rg: p.rg,
        cnh: p.cnh,
        dataNascimento: p.dataNascimento
          ? new Date(p.dataNascimento)
          : undefined,
        email: p.email,
        telefone: p.telefone,
        whatsapp: p.whatsapp,
        cep: p.cep,
        endereco: p.endereco,
        numero: p.numero,
        complemento: p.complemento,
        bairro: p.bairro,
        cidade: p.cidade,
        estado: p.estado,
        pixTipo: p.pixTipo,
        pixChave: p.pixChave,
        banco: p.banco,
        agencia: p.agencia,
        conta: p.conta,
        observacoes: p.observacoes,
      }));
      const created = await Proprietario.insertMany(props);
      stats.proprietarios = created.length;
    }

    const motoCount = await Moto.countDocuments();
    if (motoCount === 0) {
      const allProps = await Proprietario.find({}, { _id: 1, cpf: 1 }).lean();
      const cpfToId = new Map(allProps.map((p) => [p.cpf, p._id]));
      const mockIdToCpf = new Map(
        mockProprietarios.map((p) => [p.id, p.cpf])
      );

      const motos = mockMotos.map((m) => {
        const cpf = m.proprietarioId
          ? mockIdToCpf.get(m.proprietarioId)
          : undefined;
        const realPropId = cpf ? cpfToId.get(cpf) : undefined;
        return {
          ...m,
          proprietarioId: realPropId,
          dataEntrada: new Date(m.dataEntrada),
          compra: m.compra
            ? {
                ...m.compra,
                dataAquisicao: new Date(m.compra.dataAquisicao),
              }
            : undefined,
          repasse: m.repasse
            ? {
                ...m.repasse,
                dataInicioConsignacao: new Date(
                  m.repasse.dataInicioConsignacao
                ),
              }
            : undefined,
        };
      });
      const created = await Moto.insertMany(motos);
      stats.motos = created.length;
    }

    const contCount = await Contato.countDocuments();
    if (contCount === 0) {
      const conts = mockContatos.map((c) => ({
        nome: c.nome,
        telefone: c.telefone,
        email: c.email,
        origem: c.origem,
        interesse: c.interesse,
        motoInteresse: c.motoInteresse,
        observacoes: c.observacoes,
        status: c.status,
        vendedorResponsavel: c.vendedorResponsavel,
        ultimoContato: c.ultimoContato
          ? new Date(c.ultimoContato)
          : undefined,
      }));
      const created = await Contato.insertMany(conts);
      stats.contatos = created.length;
    }

    return NextResponse.json({ ok: true, stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro no seed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
