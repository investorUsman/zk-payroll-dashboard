import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/components/providers/StellarProvider", () => ({
  EXPECTED_NETWORK: "TESTNET",
  useStellar: () => ({
    publicKey: "GTEST123",
  }),
  useOptionalStellar: () => null,
}));

import { render, screen } from "@testing-library/react";
import PayrollWizard from "@/components/features/payroll/PayrollWizard";
import PayrollRunDetail from "@/components/features/payroll/PayrollRunDetail";
import PayrollComparison from "@/components/features/payroll/PayrollComparison";
import type { PayrollRun } from "@/types/models";

// PayrollRunDetail renders a "cache freshness" indicator seeded from the wall
// clock (new Date()), so the committed snapshots capture the moment they were
// generated. Pin the system time to that instant to keep snapshot rendering
// deterministic — the component itself is intentionally clock-driven. The
// committed values were rendered in UTC (the reference environment), so force
// UTC for this file to keep the formatted timestamp stable across host zones.
process.env.TZ = "UTC";
const SNAPSHOT_TIME = new Date("2026-09-30T09:35:00Z");

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(SNAPSHOT_TIME);
});

afterEach(() => {
  vi.useRealTimers();
});

const mockPayrollRuns: PayrollRun[] = [
  {
    id: "run-1",
    companyId: "company-1",
    timestamp: new Date("2024-01-15").toISOString(),
    createdAt: new Date("2024-01-15").toISOString(),
    totalAmount: 50000,
    employeeCount: 10,
    proof: "proof-hash-1",
    status: "verified",
    employeeIds: ["emp1", "emp2", "emp3"],
    txHash: "tx-hash-1",
  },
  {
    id: "run-2",
    companyId: "company-1",
    timestamp: new Date("2024-01-01").toISOString(),
    createdAt: new Date("2024-01-01").toISOString(),
    totalAmount: 48000,
    employeeCount: 9,
    proof: "proof-hash-2",
    status: "verified",
    employeeIds: ["emp1", "emp2"],
    txHash: "tx-hash-2",
  },
];

describe("Visual Regression - Payroll Flow States", () => {
  describe("Payroll Wizard - Initial State", () => {
    it("renders wizard at employee selection step", () => {
      const { container } = render(<PayrollWizard />);
      expect(container).toMatchSnapshot();
    });
  });

  describe("Payroll Run Detail - Verified State", () => {
    it("renders completed payroll run with verification", () => {
      const { container } = render(
        <PayrollRunDetail run={mockPayrollRuns[0]} />,
      );
      expect(screen.getByText("Verified")).toBeInTheDocument();
      expect(container).toMatchSnapshot();
    });
  });

  describe("Payroll Run Detail - Pending State", () => {
    it("renders pending payroll run", () => {
      const pendingRun = { ...mockPayrollRuns[0], status: "pending" as const };
      const { container } = render(<PayrollRunDetail run={pendingRun} />);
      expect(container).toMatchSnapshot();
    });
  });

  describe("Payroll Run Detail - Failed State", () => {
    it("renders failed payroll run with error state", () => {
      const failedRun = { ...mockPayrollRuns[0], status: "failed" as const };
      const { container } = render(<PayrollRunDetail run={failedRun} />);
      expect(container).toMatchSnapshot();
    });
  });

  describe("Payroll Comparison - Two Runs Selected", () => {
    it("renders comparison view with metrics", () => {
      const { container } = render(
        <PayrollComparison
          runs={mockPayrollRuns}
          selectedRunIds={["run-1", "run-2"]}
        />,
      );
      expect(screen.getByText("Compare Payroll Runs")).toBeInTheDocument();
      expect(container).toMatchSnapshot();
    });
  });

  describe("Payroll Comparison - Empty State", () => {
    it("renders empty comparison state", () => {
      const { container } = render(<PayrollComparison runs={[]} />);
      expect(container).toMatchSnapshot();
    });
  });

  describe("Payroll Comparison - Single Run Selected", () => {
    it("renders partial selection state", () => {
      const { container } = render(
        <PayrollComparison runs={mockPayrollRuns} selectedRunIds={["run-1"]} />,
      );
      expect(container).toMatchSnapshot();
    });
  });
});

describe("Visual Regression - Payroll Exception States", () => {
  it("captures payroll execution screen initial state", () => {
    const { container } = render(<PayrollWizard />);
    expect(container).toMatchSnapshot();
  });
});
