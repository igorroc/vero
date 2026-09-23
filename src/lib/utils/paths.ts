import path from "node:path"

/**
 * Resolve um caminho relativo à pasta atual do projeto e garante que o
 * resultado não escape dela (protege contra `..` e caminhos absolutos).
 * Usado em todo acesso a arquivo por caminho — inclusive fluxos de IA —
 * para que nada leia/escreva fora da pasta do projeto.
 */
export function assertPathInsideCwd(relativePath: string): string {
	const base = path.resolve(process.cwd())
	const target = path.resolve(base, relativePath)
	if (target !== base && !target.startsWith(base + path.sep)) {
		throw new Error("Caminho fora da pasta do projeto")
	}
	return target
}
