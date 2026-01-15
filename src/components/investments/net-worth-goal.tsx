"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Progress,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  useDisclosure,
} from "@nextui-org/react";
import {
  getNetWorthSummary,
  setNetWorthGoal,
  type SetNetWorthGoalInput,
} from "@/features/goals";
import { formatCurrency, type NetWorthSummary } from "@/types/finance";
import { toast } from "react-toastify";

export function NetWorthGoalCard() {
  const [summary, setSummary] = useState<NetWorthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [noGoal, setNoGoal] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    targetAmount: "",
    targetDate: "",
  });

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    setLoading(true);
    setNoGoal(false);

    const result = await getNetWorthSummary();

    if (result.success) {
      setSummary(result.summary);
    } else if (result.error === "No net worth goal set") {
      setNoGoal(true);
    }

    setLoading(false);
  };

  const handleSetGoal = async () => {
    if (!formData.targetAmount || !formData.targetDate) {
      toast.error("Please fill in all fields");
      return;
    }

    setFormLoading(true);

    const input: SetNetWorthGoalInput = {
      targetAmount: parseFloat(formData.targetAmount),
      targetDate: new Date(formData.targetDate),
    };

    const result = await setNetWorthGoal(input);

    if (result.success) {
      toast.success("Goal set successfully");
      loadSummary();
      onClose();
    } else {
      toast.error(result.error);
    }

    setFormLoading(false);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardBody className="text-center py-8">
          <p className="text-gray-500">Loading goal...</p>
        </CardBody>
      </Card>
    );
  }

  if (noGoal) {
    return (
      <>
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Net Worth Goal</h2>
          </CardHeader>
          <CardBody className="text-center py-8">
            <p className="text-gray-500 mb-4">
              Set a net worth target to track your progress.
            </p>
            <Button color="primary" onPress={onOpen}>
              Set Goal
            </Button>
          </CardBody>
        </Card>

        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalContent>
            <ModalHeader>Set Net Worth Goal</ModalHeader>
            <ModalBody className="gap-4">
              <Input
                label="Target Net Worth"
                type="number"
                placeholder="500000"
                startContent={<span className="text-gray-500">$</span>}
                value={formData.targetAmount}
                onValueChange={(value) =>
                  setFormData({ ...formData, targetAmount: value })
                }
                isRequired
              />
              <Input
                label="Target Date"
                type="date"
                value={formData.targetDate}
                onValueChange={(value) =>
                  setFormData({ ...formData, targetDate: value })
                }
                isRequired
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                Cancel
              </Button>
              <Button color="primary" onPress={handleSetGoal} isLoading={formLoading}>
                Set Goal
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    );
  }

  if (!summary) return null;

  const progressPercent = Math.min(
    100,
    (summary.currentNetWorth / summary.targetNetWorth) * 100
  );

  return (
    <>
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Net Worth Goal</h2>
          <div className="flex items-center gap-2">
            <Chip
              color={summary.isOnTrack ? "success" : "warning"}
              variant="flat"
            >
              {summary.isOnTrack ? "On Track" : "Behind Schedule"}
            </Chip>
            <Button size="sm" variant="light" onPress={onOpen}>
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Progress</span>
              <span className="font-medium">{progressPercent.toFixed(1)}%</span>
            </div>
            <Progress
              value={progressPercent}
              color={summary.isOnTrack ? "success" : "warning"}
              className="h-3"
            />
          </div>

          {/* Current vs Target */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Current</p>
              <p className="text-2xl font-bold">
                {formatCurrency(summary.currentNetWorth)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Target</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(summary.targetNetWorth)}
              </p>
              <p className="text-xs text-gray-500">
                by {formatDate(summary.targetDate)}
              </p>
            </div>
          </div>

          {/* Monthly investment comparison */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Current Monthly Investment</span>
              <span className="font-medium">
                {formatCurrency(summary.currentMonthlyInvestment)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Required Monthly Investment</span>
              <span
                className={`font-medium ${
                  summary.currentMonthlyInvestment >= summary.requiredMonthlyInvestment
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {formatCurrency(summary.requiredMonthlyInvestment)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm text-gray-600">Months Remaining</span>
              <span className="font-medium">{summary.monthsRemaining}</span>
            </div>
          </div>

          {/* Projection */}
          <div
            className={`rounded-lg p-4 ${
              summary.isOnTrack
                ? "bg-green-50 border border-green-200"
                : "bg-yellow-50 border border-yellow-200"
            }`}
          >
            <p
              className={`text-sm font-medium ${
                summary.isOnTrack ? "text-green-700" : "text-yellow-700"
              }`}
            >
              Projected at Target Date
            </p>
            <p
              className={`text-xl font-bold ${
                summary.isOnTrack ? "text-green-600" : "text-yellow-600"
              }`}
            >
              {formatCurrency(summary.projectedNetWorth)}
            </p>
            <p
              className={`text-sm ${
                summary.gap >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {summary.gap >= 0 ? "+" : ""}
              {formatCurrency(summary.gap)} vs goal
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Edit modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>Edit Net Worth Goal</ModalHeader>
          <ModalBody className="gap-4">
            <Input
              label="Target Net Worth"
              type="number"
              placeholder="500000"
              startContent={<span className="text-gray-500">$</span>}
              value={formData.targetAmount}
              onValueChange={(value) =>
                setFormData({ ...formData, targetAmount: value })
              }
              isRequired
            />
            <Input
              label="Target Date"
              type="date"
              value={formData.targetDate}
              onValueChange={(value) =>
                setFormData({ ...formData, targetDate: value })
              }
              isRequired
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSetGoal} isLoading={formLoading}>
              Update Goal
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
