"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Switch,
} from "@nextui-org/react";
import { createEvent, type CreateEventInput } from "@/features/events";
import type { AccountWithBalance } from "@/features/accounts";
import { toast } from "react-toastify";

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: AccountWithBalance[];
}

export function EventForm({ isOpen, onClose, onSuccess, accounts }: EventFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    accountId: string;
    description: string;
    amount: string;
    type: "INCOME" | "EXPENSE" | "INVESTMENT";
    costType: "RECURRENT" | "EXCEPTIONAL";
    date: string;
    isRecurring: boolean;
    recurrenceFrequency: string;
  }>({
    accountId: accounts[0]?.id || "",
    description: "",
    amount: "",
    type: "EXPENSE",
    costType: "RECURRENT",
    date: new Date().toISOString().split("T")[0],
    isRecurring: false,
    recurrenceFrequency: "MONTHLY",
  });

  const handleSubmit = async () => {
    if (!formData.accountId || !formData.description || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    const input: CreateEventInput = {
      accountId: formData.accountId,
      description: formData.description,
      amount: parseFloat(formData.amount),
      type: formData.type,
      costType: formData.type === "EXPENSE" ? formData.costType : undefined,
      date: new Date(formData.date),
      isRecurring: formData.isRecurring,
      recurrenceFrequency: formData.isRecurring
        ? (formData.recurrenceFrequency as CreateEventInput["recurrenceFrequency"])
        : undefined,
    };

    const result = await createEvent(input);

    if (result.success) {
      toast.success("Event created successfully");
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        accountId: accounts[0]?.id || "",
        description: "",
        amount: "",
        type: "EXPENSE",
        costType: "RECURRENT",
        date: new Date().toISOString().split("T")[0],
        isRecurring: false,
        recurrenceFrequency: "MONTHLY",
      });
    } else {
      toast.error(result.error);
    }

    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        <ModalHeader>Create New Event</ModalHeader>
        <ModalBody className="gap-4">
          <Select
            label="Account"
            selectedKeys={formData.accountId ? [formData.accountId] : []}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0] as string;
              setFormData({ ...formData, accountId: value });
            }}
            isRequired
          >
            {accounts.map((account) => (
              <SelectItem key={account.id} textValue={account.name}>
                {account.name} ({account.type})
              </SelectItem>
            ))}
          </Select>

          <Input
            label="Description"
            placeholder="e.g., Monthly rent"
            value={formData.description}
            onValueChange={(value) => setFormData({ ...formData, description: value })}
            isRequired
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount"
              type="number"
              placeholder="0.00"
              startContent={<span className="text-gray-500">$</span>}
              value={formData.amount}
              onValueChange={(value) => setFormData({ ...formData, amount: value })}
              isRequired
            />

            <Select
              label="Type"
              selectedKeys={[formData.type]}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as "INCOME" | "EXPENSE" | "INVESTMENT";
                setFormData({ ...formData, type: value });
              }}
              isRequired
            >
              <SelectItem key="INCOME" textValue="Income">Income (+)</SelectItem>
              <SelectItem key="EXPENSE" textValue="Expense">Expense (-)</SelectItem>
              <SelectItem key="INVESTMENT" textValue="Investment">Investment (-)</SelectItem>
            </Select>
          </div>

          {formData.type === "EXPENSE" && (
            <Select
              label="Cost Type"
              selectedKeys={[formData.costType]}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as "RECURRENT" | "EXCEPTIONAL";
                setFormData({ ...formData, costType: value });
              }}
              description="Recurrent costs are used for long-term planning. Exceptional costs are one-time expenses."
            >
              <SelectItem key="RECURRENT" textValue="Recurrent">
                Recurrent (rent, utilities, subscriptions)
              </SelectItem>
              <SelectItem key="EXCEPTIONAL" textValue="Exceptional">
                Exceptional (travel, emergencies)
              </SelectItem>
            </Select>
          )}

          <Input
            label="Date"
            type="date"
            value={formData.date}
            onValueChange={(value) => setFormData({ ...formData, date: value })}
            isRequired
          />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Recurring Event</p>
              <p className="text-sm text-gray-500">
                This event repeats on a schedule
              </p>
            </div>
            <Switch
              isSelected={formData.isRecurring}
              onValueChange={(value) =>
                setFormData({ ...formData, isRecurring: value })
              }
            />
          </div>

          {formData.isRecurring && (
            <Select
              label="Frequency"
              selectedKeys={[formData.recurrenceFrequency]}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;
                setFormData({ ...formData, recurrenceFrequency: value });
              }}
            >
              <SelectItem key="DAILY">Daily</SelectItem>
              <SelectItem key="WEEKLY">Weekly</SelectItem>
              <SelectItem key="BIWEEKLY">Every 2 weeks</SelectItem>
              <SelectItem key="MONTHLY">Monthly</SelectItem>
              <SelectItem key="YEARLY">Yearly</SelectItem>
            </Select>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleSubmit} isLoading={loading}>
            Create Event
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
