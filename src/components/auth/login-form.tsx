"use client"

import { Input, Button, Checkbox } from "@nextui-org/react"
import { toast } from "react-toastify"
import { loginAction } from "@/features/auth/login"
import { isRedirectError } from "@/lib/is-redirect-error"
import { useRef, useState, type FormEvent } from "react"
import { Mail, Lock, LogIn } from "lucide-react"

export function LoginForm() {
	const [isLoading, setIsLoading] = useState(false)
	const [rememberMe, setRememberMe] = useState(true)
	const submittingRef = useRef(false)

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		if (submittingRef.current) return
		submittingRef.current = true
		setIsLoading(true)

		try {
			const res = await loginAction(new FormData(event.currentTarget))

			if (res && "error" in res) {
				toast.error(res.error)
				setIsLoading(false)
				submittingRef.current = false
			}
			// Sucesso: a action redireciona; mantém o loading até a navegação.
		} catch (error) {
			// O redirect() precisa propagar para o Next.js navegar.
			if (isRedirectError(error)) throw error
			toast.error("Algo deu errado. Tente novamente.")
			setIsLoading(false)
			submittingRef.current = false
		}
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="flex flex-col gap-4"
			aria-busy={isLoading}
		>
			<Input
				type="email"
				label="Email"
				placeholder="Digite seu email"
				name="email"
				isRequired
				variant="bordered"
				isDisabled={isLoading}
				startContent={<Mail className="w-4 h-4 text-slate-400" />}
				classNames={{
					input: "text-slate-900 dark:text-white",
					label: "text-slate-600 dark:text-slate-400",
				}}
			/>
			<Input
				type="password"
				label="Senha"
				placeholder="Digite sua senha"
				name="password"
				isRequired
				variant="bordered"
				isDisabled={isLoading}
				startContent={<Lock className="w-4 h-4 text-slate-400" />}
				classNames={{
					input: "text-slate-900 dark:text-white",
					label: "text-slate-600 dark:text-slate-400",
				}}
			/>
			<input
				type="hidden"
				name="rememberMe"
				value={rememberMe ? "true" : "false"}
			/>
			<Checkbox
				isSelected={rememberMe}
				onValueChange={setRememberMe}
				isDisabled={isLoading}
				size="sm"
				classNames={{
					label: "text-sm text-slate-600 dark:text-slate-400",
				}}
			>
				Lembrar de mim neste dispositivo
			</Checkbox>
			<Button
				type="submit"
				color="primary"
				size="lg"
				className="mt-2 font-semibold bg-gradient-to-r from-blue-600 to-purple-600"
				isLoading={isLoading}
				isDisabled={isLoading}
				startContent={!isLoading && <LogIn className="w-5 h-5" />}
			>
				{isLoading ? "Validando credenciais..." : "Entrar"}
			</Button>
			{isLoading && (
				<p className="text-center text-sm text-slate-500 dark:text-slate-400" role="status">
					Aguarde enquanto verificamos seu acesso.
				</p>
			)}
		</form>
	)
}
