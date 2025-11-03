import { render, screen, act, fireEvent } from "@testing-library/react";
import axios from "axios";
import App from "../App";

jest.mock("axios");
jest.mock("../Output", () => (props) => (
  <div data-testid="mock-output">{props.output || props.error}</div>
));

jest.mock("../data/problems.json", () => [
  {
    id: 99,
    title: "Dummy Hard Challenge",
    difficulty: "hard",
    templates: { python: "print('ok')" },
    testcases: [
      { id: 1, input: "", expected: "OK" },
      { id: 2, input: "", expected: "OK" },
    ],
  },
]);

test(
  "runs all tests and unlocks HARD reward modal when all pass",
  async () => {
    axios.post.mockResolvedValue({
      data: {
        stdout: "OK\n",
        stderr: "",
        compile_output: "",
        status: { id: 3, description: "Accepted" },
      },
    });

    render(<App />);

    const runTestsBtn = screen.getByRole("button", { name: /Run Tests/i });
    await act(async () => {
      fireEvent.click(runTestsBtn);
    });

    // Get all "$20 Cashback" texts (static + dynamic)
    const allCashbacks = await screen.findAllByText(/\$20 Cashback/i, {}, { timeout: 10000 });

    // The dynamic one appears inside a div with gradient background (runtime reward)
    const dynamicCashback = allCashbacks.find(
      (el) =>
        el.closest("div")?.style?.background?.includes("linear-gradient") ||
        el.textContent.includes("Unlocked")
    );

    expect(dynamicCashback).toBeDefined();

    // Confirm that the unlocked message also appears
    const unlockedMsg = await screen.findByText(/Unlocked!/i, {}, { timeout: 10000 });
    expect(unlockedMsg).toBeInTheDocument();

    // Check modal title and coupon text
    const modalTitle = await screen.findByText(/Submission Successful/i, {}, { timeout: 10000 });
    const couponLine = await screen.findByText(/Coupon Code:/i, {}, { timeout: 10000 });
    expect(modalTitle).toBeInTheDocument();
    expect(couponLine).toBeInTheDocument();

    // Ensure multiple Judge0 calls (2 testcases)
    expect(axios.post).toHaveBeenCalledTimes(2);
  },
  20000
);
