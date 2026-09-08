"use client"

import {
	Button,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	Select,
	SelectItem,
} from "@nextui-org/react"
import type { Dispatch, SetStateAction } from "react"
import type { AccountWithBalance } from "@/features/accounts"
import type { CategoryWithGroup } from "@/features/categories"
import { EventCategorySelect } from "./event-category-select"

export interface EditEventData {
	id: string
	accountId: string
	categoryId: string
	description: string
	amount: string
	type: "INCOME" | "EXPENSE" | "INVESTMENT"
	costType: "RECURRENT" | "EXCEPTIONAL"
	date: string
	isGenerated: boolean
	templateId?: string
}

export interface TransferEditData {
	id: string
	description: string
	amount: string
	date: string
}

interface EventEditModalProps {
	isOpen: boolean
	onClose: () => void
	editData: EditEventData | null
	setEditData: Dispatch<SetStateAction<EditEventData | null>>
	isTransferOpen: boolean
	onTransferClose: () => void
	transferEditData: TransferEditData | null
	setTransferEditData: Dispatch<SetStateAction<TransferEditData | null>>
	accounts: AccountWithBalance[]
	categories: CategoryWithGroup[]
	isLoading: boolean
	onSave: () => void
	onTransferSave: () => void
}

export function EventEditModal({
	isOpen,
	onClose,
	editData,
	setEditData,
	isTransferOpen,
	onTransferClose,
	transferEditData,
	setTransferEditData,
	accounts,
	categories,
	isLoading,
	onSave,
	onTransferSave,
}: EventEditModalProps) {
	return (
		<>
			<Modal
				isOpen={isOpen}
				onClose={onClose}
				size="lg"
				scrollBehavior="inside"
				classNames={{ base: "mx-2 sm:mx-0", body: "py-4" }}
			>
				<ModalContent>
					<ModalHeader className="text-lg sm:text-xl">
						{editData?.isGenerated
							? "Editar Modelo Recorrente"
							: "Editar Evento"}
					</ModalHeader>
					<ModalBody className="gap-3 sm:gap-4">
						{editData?.isGenerated && (
							<div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
								<p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300">
									As alterações afetarão todas as ocorrências futuras.
								</p>
							</div>
						)}
						<Select
							label="Conta"
							size="sm"
							selectedKeys={editData?.accountId ? [editData.accountId] : []}
							onSelectionChange={(keys) =>
								setEditData((prev) =>
									prev
										? { ...prev, accountId: Array.from(keys)[0] as string }
										: null,
								)
							}
							isRequired
							classNames={{ label: "text-sm" }}
						>
							{accounts.map((account) => (
								<SelectItem key={account.id} textValue={account.name}>
									{account.name}
								</SelectItem>
							))}
						</Select>
						<Input
							label="Descrição"
							size="sm"
							placeholder="Ex: Aluguel mensal"
							value={editData?.description || ""}
							onValueChange={(description) =>
								setEditData((prev) => (prev ? { ...prev, description } : null))
							}
							isRequired
							classNames={{ label: "text-sm" }}
						/>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
							<Input
								label="Valor"
								size="sm"
								type="number"
								placeholder="0,00"
								startContent={<span className="text-gray-500 text-sm">R$</span>}
								value={editData?.amount || ""}
								onValueChange={(amount) =>
									setEditData((prev) => (prev ? { ...prev, amount } : null))
								}
								isRequired
								classNames={{ label: "text-sm" }}
							/>
							<Select
								label="Tipo"
								size="sm"
								selectedKeys={editData?.type ? [editData.type] : []}
								onSelectionChange={(keys) =>
									setEditData((prev) =>
										prev
											? {
													...prev,
													type: Array.from(keys)[0] as EditEventData["type"],
													categoryId: "",
												}
											: null,
									)
								}
								isRequired
								classNames={{ label: "text-sm" }}
							>
								<SelectItem key="INCOME" textValue="Receita">
									Receita (+)
								</SelectItem>
								<SelectItem key="EXPENSE" textValue="Despesa">
									Despesa (-)
								</SelectItem>
								<SelectItem key="INVESTMENT" textValue="Investimento">
									Investimento (-)
								</SelectItem>
							</Select>
						</div>
						{editData && (
							<>
								<EventCategorySelect
									categories={categories}
									type={editData.type}
									categoryId={editData.categoryId}
									onSelectionChange={(categoryId) =>
										setEditData((prev) =>
											prev ? { ...prev, categoryId } : null,
										)
									}
								/>
								{editData.type === "EXPENSE" && (
									<Select
										label="Tipo de Custo"
										size="sm"
										selectedKeys={editData.costType ? [editData.costType] : []}
										onSelectionChange={(keys) =>
											setEditData((prev) =>
												prev
													? {
															...prev,
															costType: Array.from(
																keys,
															)[0] as EditEventData["costType"],
														}
													: null,
											)
										}
										classNames={{ label: "text-sm" }}
									>
										<SelectItem key="RECURRENT" textValue="Recorrente">
											Recorrente (aluguel, contas)
										</SelectItem>
										<SelectItem key="EXCEPTIONAL" textValue="Excepcional">
											Excepcional (viagens, emergências)
										</SelectItem>
									</Select>
								)}
							</>
						)}
						<Input
							label="Data"
							size="sm"
							type="date"
							value={editData?.date || ""}
							onValueChange={(date) =>
								setEditData((prev) => (prev ? { ...prev, date } : null))
							}
							isRequired
							classNames={{ label: "text-sm" }}
						/>
					</ModalBody>
					<ModalFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
						<Button
							variant="flat"
							onPress={onClose}
							className="w-full sm:w-auto order-2 sm:order-1"
						>
							Cancelar
						</Button>
						<Button
							color="primary"
							onPress={onSave}
							isLoading={isLoading}
							className="w-full sm:w-auto order-1 sm:order-2"
						>
							Salvar Alterações
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
			<Modal isOpen={isTransferOpen} onClose={onTransferClose}>
				<ModalContent>
					<ModalHeader>Editar transferência</ModalHeader>
					<ModalBody>
						<Input
							label="Descrição"
							value={transferEditData?.description ?? ""}
							onValueChange={(description) =>
								setTransferEditData((current) =>
									current ? { ...current, description } : null,
								)
							}
							isRequired
						/>
						<Input
							label="Valor"
							type="number"
							min="0.01"
							step="0.01"
							startContent="R$"
							value={transferEditData?.amount ?? ""}
							onValueChange={(amount) =>
								setTransferEditData((current) =>
									current ? { ...current, amount } : null,
								)
							}
							isRequired
						/>
						<Input
							label="Data"
							type="date"
							value={transferEditData?.date ?? ""}
							onValueChange={(date) =>
								setTransferEditData((current) =>
									current ? { ...current, date } : null,
								)
							}
							isRequired
						/>
					</ModalBody>
					<ModalFooter>
						<Button variant="flat" onPress={onTransferClose}>
							Cancelar
						</Button>
						<Button
							color="primary"
							onPress={onTransferSave}
							isLoading={isLoading}
						>
							Salvar alterações
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</>
	)
}
