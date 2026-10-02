"use client"

import { useState } from "react"
import { Button, Chip, Input } from "@nextui-org/react"
import { toast } from "react-toastify"
import { Copy, KeyRound, Plus, Trash2 } from "lucide-react"

import { createMcpToken, listMcpTokens, revokeMcpToken } from "@/features/mcp/tokens"
import type { McpTokenSummary } from "@/features/mcp/tokens"

interface McpTokensProps {
	initialTokens: McpTokenSummary[]
}

function formatDate(value: Date | null): string {
	if (!value) return "—"
	return new Date(value).toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	})
}

function tokenStatus(token: McpTokenSummary): {
	label: string
	color: "success" | "danger" | "warning" | "default"
} {
	if (token.revokedAt) return { label: "Revogado", color: "danger" }
	if (token.expiresAt && new Date(token.expiresAt).getTime() <= Date.now()) {
		return { label: "Expirado", color: "warning" }
	}
	return { label: "Ativo", color: "success" }
}

export function McpTokens({ initialTokens }: McpTokensProps) {
	const [tokens, setTokens] = useState<McpTokenSummary[]>(initialTokens)
	const [name, setName] = useState("")
	const [expiresInDays, setExpiresInDays] = useState("")
	const [newToken, setNewToken] = useState<string | null>(null)
	const [creating, setCreating] = useState(false)

	const refresh = async () => {
		const result = await listMcpTokens()
		if (result.success) setTokens(result.tokens)
	}

	const handleCreate = async () => {
		setCreating(true)
		const result = await createMcpToken({
			name,
			expiresInDays: expiresInDays ? Number(expiresInDays) : undefined,
		})
		setCreating(false)

		if (!result.success) {
			toast.error(result.error)
			return
		}

		setNewToken(result.token)
		setName("")
		setExpiresInDays("")
		await refresh()
		toast.success("Token criado. Copie agora — ele não será exibido novamente.")
	}

	const handleRevoke = async (id: string) => {
		const result = await revokeMcpToken(id)
		if (!result.success) {
			toast.error(result.error)
			return
		}
		await refresh()
		toast.success("Token revogado")
	}

	const handleCopy = async (value: string) => {
		try {
			await navigator.clipboard.writeText(value)
			toast.success("Token copiado")
		} catch {
			toast.error("Não foi possível copiar automaticamente")
		}
	}

	return (
		<div className="modern-card p-6">
			<div className="flex items-center gap-3 mb-6">
				<div className="p-3 bg-purple-100 rounded-xl">
					<KeyRound className="w-6 h-6 text-purple-600" />
				</div>
				<div>
					<h2 className="text-lg font-semibold text-slate-900 dark:text-white">
						Integração MCP
					</h2>
					<p className="text-sm text-slate-500">
						Tokens de acesso somente-leitura para conectar o Vero a agentes e
						sistemas externos.
					</p>
				</div>
			</div>

			<div className="flex flex-col sm:flex-row gap-3 mb-6">
				<Input
					label="Nome do token"
					placeholder="Ex. Meu agente"
					value={name}
					onValueChange={setName}
					maxLength={60}
				/>
				<Input
					label="Validade (dias)"
					placeholder="Sem expiração"
					type="number"
					value={expiresInDays}
					onValueChange={setExpiresInDays}
					className="sm:max-w-[200px]"
				/>
				<Button
					color="primary"
					startContent={<Plus className="w-4 h-4" />}
					onPress={handleCreate}
					isLoading={creating}
					isDisabled={!name.trim()}
					className="sm:self-end"
				>
					Gerar token
				</Button>
			</div>

			{newToken && (
				<div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-4">
					<p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
						Copie este token agora. Ele não será exibido novamente.
					</p>
					<div className="flex items-center gap-2">
						<code className="flex-1 break-all rounded-lg bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono text-slate-700 dark:text-slate-200">
							{newToken}
						</code>
						<Button
							isIconOnly
							variant="flat"
							aria-label="Copiar token"
							onPress={() => handleCopy(newToken)}
						>
							<Copy className="w-4 h-4" />
						</Button>
					</div>
				</div>
			)}

			{tokens.length === 0 ? (
				<p className="text-sm text-slate-500">
					Nenhum token criado ainda.
				</p>
			) : (
				<ul className="divide-y divide-slate-200 dark:divide-slate-700">
					{tokens.map((token) => {
						const status = tokenStatus(token)
						return (
							<li
								key={token.id}
								className="flex flex-wrap items-center justify-between gap-3 py-3"
							>
								<div className="min-w-0">
									<div className="flex items-center gap-2">
										<span className="font-medium text-slate-900 dark:text-white truncate">
											{token.name}
										</span>
										<Chip size="sm" color={status.color} variant="flat">
											{status.label}
										</Chip>
									</div>
									<p className="text-xs text-slate-500 font-mono mt-1">
										{token.prefix}…
									</p>
									<p className="text-xs text-slate-500 mt-1">
										Criado em {formatDate(token.createdAt)} · Último uso{" "}
										{formatDate(token.lastUsedAt)} · Expira{" "}
										{formatDate(token.expiresAt)}
									</p>
								</div>
								{!token.revokedAt && (
									<Button
										size="sm"
										color="danger"
										variant="flat"
										startContent={<Trash2 className="w-4 h-4" />}
										onPress={() => handleRevoke(token.id)}
									>
										Revogar
									</Button>
								)}
							</li>
						)
					})}
				</ul>
			)}
		</div>
	)
}
