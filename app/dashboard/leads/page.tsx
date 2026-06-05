import { redirect } from "next/navigation";

// "Leads" no sidebar aponta pra /dashboard/contatos. Mas a URL é tradicional
// — pra qualquer um que digite /dashboard/leads no navegador (ou tenha
// bookmark antigo), redireciona em vez de mostrar 404 estranho.
export default function LeadsRedirect() {
  redirect("/dashboard/contatos");
}
