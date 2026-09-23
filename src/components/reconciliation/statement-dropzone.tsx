"use client"

import { useRef, useState } from "react"
import { Button } from "@nextui-org/react"
import { CloudUpload, FileText, X } from "lucide-react"

const ACCEPTED = [".csv", ".ofx", ".pdf"]

function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function StatementDropzone({
	file,
	onSelect,
	onRemove,
}: {
	file: File | null
	onSelect: (file: File) => void
	onRemove: () => void
}) {
	const inputRef = useRef<HTMLInputElement>(null)
	const [dragging, setDragging] = useState(false)

	function pick(files: FileList | null) {
		const next = files?.[0]
		if (next) onSelect(next)
	}

	return (
		<div>
			<input
				ref={inputRef}
				type="file"
				accept={ACCEPTED.join(",")}
				className="hidden"
				onChange={(event) => {
					pick(event.target.files)
					event.target.value = ""
				}}
			/>
			{file ? (
				<div className="flex items-center gap-3 rounded-2xl border border-teal-200 bg-teal-50/60 p-4 dark:border-teal-900 dark:bg-teal-950/30">
					<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-200">
						<FileText size={20} />
					</span>
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
							{file.name}
						</p>
						<p className="text-xs text-slate-500">
							{formatSize(file.size)} · pronto para analisar
						</p>
					</div>
					<Button
						size="sm"
						variant="light"
						color="danger"
						startContent={<X size={14} />}
						onPress={onRemove}
					>
						Trocar
					</Button>
				</div>
			) : (
				<button
					type="button"
					onClick={() => inputRef.current?.click()}
					onDragOver={(event) => {
						event.preventDefault()
						setDragging(true)
					}}
					onDragLeave={() => setDragging(false)}
					onDrop={(event) => {
						event.preventDefault()
						setDragging(false)
						pick(event.dataTransfer.files)
					}}
					className={`flex w-full flex-col items-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors sm:py-14 ${
						dragging
							? "border-teal-500 bg-teal-50 dark:bg-teal-950/40"
							: "border-teal-200 bg-teal-50/40 hover:border-teal-400 dark:border-teal-900 dark:bg-teal-950/20"
					}`}
				>
					<span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-200">
						<CloudUpload size={28} />
					</span>
					<p className="mt-4 text-sm font-bold text-slate-900 dark:text-white sm:text-base">
						Arraste e solte o arquivo do seu extrato aqui
					</p>
					<p className="mt-1 text-sm text-slate-500">
						ou clique para selecionar
					</p>
					<span className="pointer-events-none mt-5 inline-flex items-center rounded-xl bg-teal-700 px-8 py-2.5 text-sm font-semibold text-white">
						Selecionar arquivo
					</span>
					<p className="mt-4 text-xs text-slate-500">
						Arquivos aceitos: PDF, CSV e OFX
					</p>
				</button>
			)}
		</div>
	)
}
