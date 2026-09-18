"use client"

import { Button, Input } from "@nextui-org/react"
import { KeyRound, LockKeyhole, ShieldCheck } from "lucide-react"
import { useState } from "react"
import { toast } from "react-toastify"

import { changePassword } from "@/features/auth"

export function SecurityContent() {
	const [currentPassword, setCurrentPassword] = useState("")
	const [newPassword, setNewPassword] = useState("")
	const [confirmation, setConfirmation] = useState("")
	const [isSaving, setIsSaving] = useState(false)

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		if (newPassword !== confirmation) {
			toast.error("A confirmação deve ser igual à nova senha.")
			return
		}

		setIsSaving(true)
		const result = await changePassword({ currentPassword, newPassword })
		if (result.success) {
			setCurrentPassword("")
			setNewPassword("")
			setConfirmation("")
			toast.success("Senha atualizada com segurança.")
		} else {
			toast.error(result.error)
		}
		setIsSaving(false)
	}

	return (
		<div className="max-w-2xl">
			<section className="modern-card p-5 sm:p-7">
				<div className="flex items-start gap-4">
					<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-brand text-primary">
						<ShieldCheck className="h-5 w-5" />
					</div>
					<div>
						<h2 className="text-xl font-semibold tracking-[-0.02em] text-text-primary">
							Atualize sua senha
						</h2>
						<p className="mt-1 text-sm leading-6 text-text-secondary">
							Confirme sua senha atual antes de definir uma nova credencial para
							sua conta.
						</p>
					</div>
				</div>

				<form className="mt-7 space-y-5" onSubmit={handleSubmit}>
					<Input
						label="Senha atual"
						type="password"
						autoComplete="current-password"
						value={currentPassword}
						onValueChange={setCurrentPassword}
						isRequired
						isDisabled={isSaving}
						startContent={<KeyRound className="h-4 w-4 text-text-muted" />}
					/>
					<Input
						label="Nova senha"
						type="password"
						autoComplete="new-password"
						value={newPassword}
						onValueChange={setNewPassword}
						description="Use pelo menos 8 caracteres e uma senha diferente da atual."
						isRequired
						isDisabled={isSaving}
						startContent={<LockKeyhole className="h-4 w-4 text-text-muted" />}
					/>
					<Input
						label="Confirme a nova senha"
						type="password"
						autoComplete="new-password"
						value={confirmation}
						onValueChange={setConfirmation}
						isRequired
						isDisabled={isSaving}
						startContent={<LockKeyhole className="h-4 w-4 text-text-muted" />}
					/>
					<Button type="submit" color="primary" isLoading={isSaving}>
						Salvar nova senha
					</Button>
				</form>
			</section>
		</div>
	)
}
