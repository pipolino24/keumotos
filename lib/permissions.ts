/**
 * Sistema de permissões KEU.
 *
 * Cada permissão é uma string no formato "<modulo>:<acao>" ou "<modulo>".
 * Admin tem implicitamente todas as permissões (bypass).
 */

export type Permission =
  // Vendas
  | "vendas:ver"
  | "vendas:criar"
  | "vendas:editar"
  | "vendas:cancelar"
  // Aluguel
  | "aluguel:ver"
  | "aluguel:criar"
  | "aluguel:editar"
  | "aluguel:devolver"
  // Estoque
  | "estoque:ver"
  | "estoque:criar"
  | "estoque:editar"
  | "estoque:remover"
  | "estoque:ajustar-precos"
  // Contatos / CRM
  | "contatos:ver"
  | "contatos:criar"
  | "contatos:editar"
  | "contatos:atribuir"
  // Usuários
  | "usuarios:ver"
  | "usuarios:criar"
  | "usuarios:editar"
  | "usuarios:remover"
  | "usuarios:aprovar"
  // Cargos / Níveis
  | "niveis:ver"
  | "niveis:criar"
  | "niveis:editar"
  | "niveis:remover"
  // Relatórios
  | "relatorios:ver"
  | "relatorios:exportar"
  // Configurações
  | "configuracoes:ver"
  | "configuracoes:editar";

export interface PermissionModule {
  id: string;
  label: string;
  description: string;
  icon: string;
  permissions: {
    key: Permission;
    label: string;
    description?: string;
  }[];
}

export const PERMISSION_MODULES: PermissionModule[] = [
  {
    id: "vendas",
    label: "Vendas",
    description: "Vender motos, ver histórico e comissões",
    icon: "ShoppingCart",
    permissions: [
      { key: "vendas:ver", label: "Ver vendas", description: "Visualizar catálogo e histórico" },
      { key: "vendas:criar", label: "Realizar venda", description: "Registrar nova venda" },
      { key: "vendas:editar", label: "Editar venda", description: "Modificar venda existente" },
      { key: "vendas:cancelar", label: "Cancelar venda", description: "Reverter ou cancelar venda" },
    ],
  },
  {
    id: "aluguel",
    label: "Aluguel",
    description: "Locação de motos da frota",
    icon: "KeyRound",
    permissions: [
      { key: "aluguel:ver", label: "Ver aluguéis", description: "Visualizar frota e locações" },
      { key: "aluguel:criar", label: "Criar locação", description: "Iniciar novo aluguel" },
      { key: "aluguel:editar", label: "Editar locação", description: "Modificar contrato em andamento" },
      { key: "aluguel:devolver", label: "Receber devolução", description: "Finalizar e dar baixa" },
    ],
  },
  {
    id: "estoque",
    label: "Estoque",
    description: "Cadastro e controle de motos",
    icon: "Package",
    permissions: [
      { key: "estoque:ver", label: "Ver estoque", description: "Visualizar lista de motos" },
      { key: "estoque:criar", label: "Cadastrar moto", description: "Adicionar nova moto ao estoque" },
      { key: "estoque:editar", label: "Editar moto", description: "Atualizar dados de uma moto" },
      { key: "estoque:remover", label: "Remover moto", description: "Excluir moto do sistema" },
      {
        key: "estoque:ajustar-precos",
        label: "Ajustar preços",
        description: "Alterar valor anunciado e mínimo",
      },
    ],
  },
  {
    id: "contatos",
    label: "Contatos & Leads",
    description: "CRM e pipeline de atendimento",
    icon: "Phone",
    permissions: [
      { key: "contatos:ver", label: "Ver contatos", description: "Visualizar pipeline de leads" },
      { key: "contatos:criar", label: "Criar contato", description: "Cadastrar novo lead" },
      { key: "contatos:editar", label: "Editar contato", description: "Atualizar dados e status" },
      { key: "contatos:atribuir", label: "Atribuir a vendedor", description: "Direcionar leads" },
    ],
  },
  {
    id: "usuarios",
    label: "Usuários",
    description: "Gerenciar clientes, vendedores e admins",
    icon: "Users",
    permissions: [
      { key: "usuarios:ver", label: "Ver usuários", description: "Visualizar lista de usuários" },
      { key: "usuarios:criar", label: "Criar usuário", description: "Cadastrar novo usuário" },
      { key: "usuarios:editar", label: "Editar usuário", description: "Modificar dados de usuário" },
      { key: "usuarios:remover", label: "Remover usuário", description: "Excluir usuário do sistema" },
      {
        key: "usuarios:aprovar",
        label: "Aprovar cadastros",
        description: "Aprovar contas pendentes (vendedores)",
      },
    ],
  },
  {
    id: "niveis",
    label: "Cargos & Níveis",
    description: "Criar e gerenciar níveis de acesso",
    icon: "Shield",
    permissions: [
      { key: "niveis:ver", label: "Ver cargos", description: "Visualizar lista de cargos" },
      { key: "niveis:criar", label: "Criar cargo", description: "Definir novo nível de acesso" },
      { key: "niveis:editar", label: "Editar cargo", description: "Modificar permissões de um cargo" },
      { key: "niveis:remover", label: "Remover cargo", description: "Excluir cargo do sistema" },
    ],
  },
  {
    id: "relatorios",
    label: "Relatórios",
    description: "Dashboards e análises",
    icon: "TrendingUp",
    permissions: [
      { key: "relatorios:ver", label: "Ver relatórios", description: "Acessar dashboards e análises" },
      { key: "relatorios:exportar", label: "Exportar dados", description: "Baixar relatórios em CSV/PDF" },
    ],
  },
  {
    id: "configuracoes",
    label: "Configurações",
    description: "Ajustes gerais do sistema",
    icon: "Settings",
    permissions: [
      { key: "configuracoes:ver", label: "Ver configurações", description: "Visualizar ajustes" },
      { key: "configuracoes:editar", label: "Editar configurações", description: "Alterar ajustes do sistema" },
    ],
  },
];

export const ALL_PERMISSIONS: Permission[] = PERMISSION_MODULES.flatMap((m) =>
  m.permissions.map((p) => p.key)
);

/**
 * Verifica se o usuário tem uma permissão específica.
 * Admin sempre retorna true.
 */
export function hasPermission(
  user: { role: string; permissoes?: string[] } | null | undefined,
  permission: Permission
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  return user.permissoes?.includes(permission) ?? false;
}

/**
 * Verifica se o usuário tem QUALQUER uma das permissões da lista.
 */
export function hasAnyPermission(
  user: { role: string; permissoes?: string[] } | null | undefined,
  permissions: Permission[]
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  return permissions.some((p) => user.permissoes?.includes(p));
}

/**
 * Retorna o label legível de uma permissão.
 */
export function getPermissionLabel(permission: string): string {
  for (const mod of PERMISSION_MODULES) {
    const p = mod.permissions.find((p) => p.key === permission);
    if (p) return `${mod.label} → ${p.label}`;
  }
  return permission;
}

/**
 * Presets prontos para criação rápida de cargos.
 */
export const ROLE_PRESETS: Record<string, { label: string; permissions: Permission[] }> = {
  vendedor_completo: {
    label: "Vendedor Completo",
    permissions: [
      "vendas:ver",
      "vendas:criar",
      "vendas:editar",
      "aluguel:ver",
      "aluguel:criar",
      "aluguel:devolver",
      "estoque:ver",
      "contatos:ver",
      "contatos:criar",
      "contatos:editar",
    ],
  },
  vendedor_junior: {
    label: "Vendedor Júnior",
    permissions: [
      "vendas:ver",
      "vendas:criar",
      "estoque:ver",
      "contatos:ver",
      "contatos:criar",
    ],
  },
  gerente_loja: {
    label: "Gerente de Loja",
    permissions: [
      "vendas:ver",
      "vendas:criar",
      "vendas:editar",
      "vendas:cancelar",
      "aluguel:ver",
      "aluguel:criar",
      "aluguel:editar",
      "aluguel:devolver",
      "estoque:ver",
      "estoque:criar",
      "estoque:editar",
      "estoque:ajustar-precos",
      "contatos:ver",
      "contatos:criar",
      "contatos:editar",
      "contatos:atribuir",
      "usuarios:ver",
      "usuarios:aprovar",
      "relatorios:ver",
      "relatorios:exportar",
    ],
  },
  estoque_compras: {
    label: "Estoque & Compras",
    permissions: [
      "estoque:ver",
      "estoque:criar",
      "estoque:editar",
      "estoque:remover",
      "estoque:ajustar-precos",
    ],
  },
  atendimento: {
    label: "Atendimento (somente CRM)",
    permissions: [
      "contatos:ver",
      "contatos:criar",
      "contatos:editar",
      "estoque:ver",
    ],
  },
};
