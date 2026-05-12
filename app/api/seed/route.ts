import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Moto } from "@/lib/models/moto";
import { User } from "@/lib/models/user";
import { Contato } from "@/lib/models/contato";
import { Proprietario } from "@/lib/models/proprietario";
import {
  mockMotos,
  mockUsers,
  mockContatos,
  mockProprietarios,
} from "@/lib/mock-data";

export const dynamic = "force-dynamic";

/**
 * Popula o MongoDB com mock-data quando vazio.
 * Idempotente: não duplica registros.
 * GET /api/seed → popula
 * GET /api/seed?reset=1 → limpa + popula
 */
export async function GET(req: Request) {
  // Seed só funciona em dev. Em produção é 404 (parece que a rota não existe).
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const reset = searchParams.get("reset") === "1";

    const stats = {
      motos: 0,
      users: 0,
      contatos: 0,
      proprietarios: 0,
      reset,
    };

    if (reset) {
      await Promise.all([
        Moto.deleteMany({}),
        User.deleteMany({}),
        Contato.deleteMany({}),
        Proprietario.deleteMany({}),
      ]);
    }

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const users = mockUsers.map((u) => ({
        nome: u.nome,
        email: u.email,
        senhaHash: "demo_seed_no_password",
        telefone: u.telefone,
        cpf: u.cpf,
        role: u.role,
        permissoes: [],
        status: u.status,
        cidade: u.cidade,
        estado: u.estado,
        vendasRealizadas: u.vendasRealizadas ?? 0,
        comissaoTotal: u.comissaoTotal ?? 0,
      }));
      const created = await User.insertMany(users);
      stats.users = created.length;
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
      // Mapeia código mock (p1, p2…) para ObjectId real do banco
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
