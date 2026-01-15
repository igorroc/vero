"use client";

import { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { updateSettings, type UpdateSettingsInput } from "@/features/dashboard";
import {  centsToDollars, type HorizonMode } from "@/types/finance";
import { toast } from "react-toastify";

interface SettingsFormProps {
  initialSettings: {
    safetyBuffer: number;
    horizonMode: HorizonMode;
  };
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
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
      toast.success("Settings saved");
    } else {
      toast.error(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-500">Configure your financial preferences</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Spending Limit Settings</h2>
        </CardHeader>
        <CardBody className="gap-6">
          <div>
            <Input
              label="Safety Buffer"
              type="number"
              placeholder="0.00"
              startContent={<span className="text-gray-500">$</span>}
              value={formData.safetyBuffer}
              onValueChange={(value) =>
                setFormData({ ...formData, safetyBuffer: value })
              }
              description="Minimum amount you want to keep in reserve. This is subtracted from your available spending."
            />
          </div>

          <div>
            <Select
              label="Horizon Mode"
              selectedKeys={[formData.horizonMode]}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as HorizonMode;
                setFormData({ ...formData, horizonMode: value });
              }}
              description="How to calculate the time horizon for daily spending limit."
            >
              <SelectItem key="END_OF_MONTH" textValue="End of Month">
                End of Month - Calculate until the last day of the current month
              </SelectItem>
              <SelectItem key="NEXT_INCOME" textValue="Next Income">
                Next Income - Calculate until your next planned income event
              </SelectItem>
            </Select>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-2">How it works</h3>
            <p className="text-sm text-gray-600">
              The daily spending limit is calculated as:
            </p>
            <p className="text-sm text-gray-700 font-mono mt-2 bg-white p-2 rounded">
              (Available Cash - Future Expenses - Investments - Buffer) / Days Until Horizon
            </p>
            <p className="text-sm text-gray-600 mt-2">
              This tells you how much you can safely spend each day without compromising
              your upcoming bills and financial goals.
            </p>
          </div>

          <Button color="primary" onPress={handleSave} isLoading={loading}>
            Save Settings
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
