"use client";

import {useEffect, useState} from "react";
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
    Spinner,
    useDisclosure,
} from "@nextui-org/react";
import {Pencil, Plus, Tag, Trash2} from "lucide-react";
import {toast} from "react-toastify";
import {
    categoryGroupTypeLabels,
    createCategory,
    deleteCategory,
    getCategoryGroups,
    updateCategory,
    type CategoryGroupWithCategories,
} from "@/features/categories";

interface CategoryFormData {
    id?: string;
    name: string;
    categoryGroupId: string;
}

export function CategoriesList() {
    const [groups, setGroups] = useState<CategoryGroupWithCategories[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<CategoryFormData>({name: "", categoryGroupId: ""});
    const {isOpen, onOpen, onClose} = useDisclosure();

    const loadGroups = async () => {
        setLoading(true);
        const result = await getCategoryGroups();
        if (result.success) {
            setGroups(result.groups);
        } else {
            toast.error(result.error);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadGroups();
    }, []);

    const openCreate = (categoryGroupId = groups[0]?.id ?? "") => {
        setFormData({name: "", categoryGroupId});
        onOpen();
    };

    const openEdit = (category: CategoryGroupWithCategories["categories"][number]) => {
        const group = groups.find((item) => item.categories.some((itemCategory) => itemCategory.id === category.id));
        if (!group) return;
        setFormData({id: category.id, name: category.name, categoryGroupId: group.id});
        onOpen();
    };

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.categoryGroupId) {
            toast.error("Informe o nome e o grupo da categoria");
            return;
        }

        setSaving(true);
        const result = formData.id
            ? await updateCategory({...formData, id: formData.id})
            : await createCategory(formData);

        if (result.success) {
            toast.success(formData.id ? "Categoria atualizada" : "Categoria criada");
            onClose();
            await loadGroups();
        } else {
            toast.error(result.error);
        }
        setSaving(false);
    };

    const handleDelete = async (categoryId: string) => {
        if (!confirm("Deseja excluir esta categoria?")) return;

        const result = await deleteCategory(categoryId);
        if (result.success) {
            toast.success("Categoria excluída");
            await loadGroups();
        } else {
            toast.error(result.error);
        }
    };

    if (loading) {
        return <div className="flex min-h-64 items-center justify-center"><Spinner label="Carregando categorias..."/></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button color="primary" startContent={<Plus className="w-4 h-4"/>} onPress={() => openCreate()}>
                    Nova categoria
                </Button>
            </div>

            {(["ESSENTIAL", "LIFESTYLE", "INVESTMENT"] as const).map((type) => {
                const groupsByType = groups.filter((group) => group.type === type);
                return (
                    <section key={type} className="space-y-3">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            {categoryGroupTypeLabels[type]}
                        </h2>
                        <div className="grid gap-4 lg:grid-cols-2">
                            {groupsByType.map((group) => (
                                <div key={group.id} className="modern-card p-4">
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <Tag className="h-4 w-4 text-blue-600"/>
                                            <h3 className="font-semibold text-slate-900 dark:text-white">{group.name}</h3>
                                        </div>
                                        <Button isIconOnly size="sm" variant="light" onPress={() => openCreate(group.id)} aria-label={`Adicionar categoria em ${group.name}`}>
                                            <Plus className="h-4 w-4"/>
                                        </Button>
                                    </div>

                                    {group.categories.length === 0 ? (
                                        <p className="text-sm text-slate-500">Nenhuma categoria cadastrada.</p>
                                    ) : (
                                        <div className="space-y-1">
                                            {group.categories.map((category) => (
                                                <div key={category.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800">
                                                    <span className="text-sm text-slate-700 dark:text-slate-300">{category.name}</span>
                                                    <div className="flex items-center">
                                                        <Button isIconOnly size="sm" variant="light" onPress={() => openEdit(category)} aria-label={`Editar ${category.name}`}>
                                                            <Pencil className="h-3.5 w-3.5"/>
                                                        </Button>
                                                        <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => handleDelete(category.id)} aria-label={`Excluir ${category.name}`}>
                                                            <Trash2 className="h-3.5 w-3.5"/>
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                );
            })}

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalContent>
                    <ModalHeader>{formData.id ? "Editar categoria" : "Nova categoria"}</ModalHeader>
                    <ModalBody>
                        <Input
                            label="Nome"
                            value={formData.name}
                            onValueChange={(name) => setFormData({...formData, name})}
                            isRequired
                        />
                        <Select
                            label="Grupo"
                            selectedKeys={formData.categoryGroupId ? [formData.categoryGroupId] : []}
                            onSelectionChange={(keys) => setFormData({...formData, categoryGroupId: String(Array.from(keys)[0] ?? "")})}
                            isRequired
                        >
                            {groups.map((group) => (
                                <SelectItem key={group.id} textValue={group.name}>
                                    {categoryGroupTypeLabels[group.type]}: {group.name}
                                </SelectItem>
                            ))}
                        </Select>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onClose}>Cancelar</Button>
                        <Button color="primary" onPress={handleSave} isLoading={saving}>Salvar</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
