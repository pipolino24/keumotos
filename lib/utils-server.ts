export function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);
}

export async function gerarCodigoAfiliadoUnico(
  nome: string,
  existsCheck: (codigo: string) => Promise<boolean>
): Promise<string> {
  const base = gerarSlug(nome);
  let candidato = base;
  let tentativa = 1;
  while (await existsCheck(candidato)) {
    candidato = `${base}-${tentativa}`;
    tentativa++;
    if (tentativa > 100) {
      candidato = `${base}-${Math.random().toString(36).slice(2, 6)}`;
      break;
    }
  }
  return candidato;
}
