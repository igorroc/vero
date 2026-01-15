"use client";

import {useState} from "react";
import {
    Button,
    Input,
    Select,
    SelectItem,
} from "@nextui-org/react";
import {updateSettings, type UpdateSettingsInput} from "@/features/dashboard";
import {centsToDollars, type HorizonMode} from "@/types/finance";
import {toast} from "react-toastify";
import {Settings, Info} from "lucide-react";

interface SettingsFormProps {
    initialSettings: {
        safetyBuffer: number;
        horizonMode: HorizonMode;
    };
}

export function SettingsForm({initialSettings}: SettingsFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        safetyBuffer: centsToDollars(initialSettings.safetyBuffer).toString(),
        horizonMode: initialSettings.horizonMode,
    });

    const handleSave = async () => {
        setLoading(true);

        const input: UpdateSettingsInput = {
            safetyBuffer: parseFloat(formData.safetyBuffer) || 0,
            horizonMode: formData.horizonMode,
        };

        const result = await updateSettings(input);

        if (result.success) {
            toast.success("Configurações salvas");
        } else {
            toast.error(result.error);
        }

        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="modern-card p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-100 rounded-xl">
                        <Settings className="w-6 h-6 text-blue-600"/>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Configurações do Limite de Gastos
                        </h2>
                        <p className="text-sm text-slate-500">
                            Configure como calcular seu limite diário
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <Input
                            label="Reserva de Segurança"
                            type="number"
                            placeholder="0,00"
                            startContent={<span className="text-gray-500">R$</span>}
                            value={formData.safetyBuffer}
                            onValueChange={(value) =>
                                setFormData({...formData, safetyBuffer: value})
                            }
                            description="Valor mínimo que você deseja manter como reserva. Este valor é subtraído do seu limite disponível."
                        />
                    </div>

                    <div>
                        <Select
                            label="Modo de Horizonte"
                            selectedKeys={[formData.horizonMode]}
                            onSelectionChange={(keys) => {
                                const value = Array.from(keys)[0] as HorizonMode;
                                setFormData({...formData, horizonMode: value});
                            }}
                            description="Como calcular o horizonte de tempo para o limite diário."
                        >
                            <SelectItem key="END_OF_MONTH" textValue="Fim do Mês">
                                Fim do Mês - Calcula até o último dia do mês atual
                            </SelectItem>
                            <SelectItem key="NEXT_INCOME" textValue="Próxima Receita">
                                Próxima Receita - Calcula até seu próximo evento de receita planejado
                            </SelectItem>
                        </Select>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Info className="w-4 h-4 text-blue-600"/>
                            </div>
                            <div>
                                <h3 className="font-medium text-slate-900 dark:text-white mb-2">
                                    Como funciona
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    O limite diário de gastos é calculado como:
                                </p>
                                <p className="text-sm text-slate-700 dark:text-slate-300 font-mono mt-2 bg-white dark:bg-slate-900 p-2 rounded">
                                    (Saldo - Despesas Futuras - Investimentos - Reserva) / Dias até Horizonte
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                                    Isso informa quanto você pode gastar com segurança por dia sem
                                    comprometer suas contas e metas financeiras.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Button color="primary" onPress={handleSave} isLoading={loading}>
                        Salvar Configurações
                    </Button>
                </div>
            </div>
        </div>
    );
}
