import { Notification } from "@/lib/models/notification";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface EmitArgs {
  tipo: string;
  titulo: string;
  descricao?: string;
  clienteId?: string;
  clienteNome?: string;
  origemTipo?: string;
  origemId?: string;
  link?: string;
  prioridade?: "baixa" | "normal" | "alta" | "urgente";
  vendedorIdEspecifico?: string; // se vier, só este vendedor recebe (além de admins)
}

/**
 * Cria uma Notification para todos os admins e (opcionalmente) um vendedor
 * específico. Usa o Supabase Admin pra listar usuários por role.
 *
 * Falha silenciosa: se algo der errado, não bloqueia a operação principal.
 */
export async function emitNotification(args: EmitArgs): Promise<void> {
  try {
    const admin = createSupabaseAdminClient();
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, role")
      .in("role", ["admin", "vendedor"]);

    if (!profiles?.length) return;

    const destinatarios = profiles
      .filter((p) => {
        if (p.role === "admin") return true;
        if (
          args.vendedorIdEspecifico &&
          p.role === "vendedor" &&
          p.id === args.vendedorIdEspecifico
        ) {
          return true;
        }
        // se não especificou vendedor, todos os vendedores também recebem
        return !args.vendedorIdEspecifico && p.role === "vendedor";
      })
      .map((p) => p.id);

    if (!destinatarios.length) return;

    const docs = destinatarios.map((destinatarioId) => ({
      destinatarioId,
      destinatarioRole: profiles.find((p) => p.id === destinatarioId)?.role as
        | "admin"
        | "vendedor",
      tipo: args.tipo,
      titulo: args.titulo,
      descricao: args.descricao,
      origemTipo: args.origemTipo,
      origemId: args.origemId,
      clienteId: args.clienteId,
      clienteNome: args.clienteNome,
      link: args.link,
      prioridade: args.prioridade ?? "normal",
      lido: false,
      arquivado: false,
    }));

    await Notification.insertMany(docs, { ordered: false });
  } catch (err) {
    // Loga só a mensagem — evita vazar Supabase service key ou outros
    // segredos que possam estar em err.cause ou err.stack se o erro
    // borbulhou do cliente admin.
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[notifications] emit failed:", msg);
  }
}
