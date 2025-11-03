import { render, screen, act, fireEvent } from "@testing-library/react";
import axios from "axios";
import App from "../App";

// Mock Judge0 network
jest.mock("axios");

jest.mock("../Output", () => (props) => (
  <div data-testid="mock-output">{props.output || props.error}</div>
));

// Mock problem list to force one "medium" difficulty problem
jest.mock("../data/problems.json", () => [
  {
    id: 5,
    title: "Dummy Medium",
    difficulty: "medium",
    templates: { python: "print('ok')" },
    testcases: [
      { id: 1, input: "", expected: "OK" },
      { id: 2, input: "", expected: "OK" },
    ],
  },
]);

test(
  "MEDIUM difficulty unlocks $10 Cashback reward when all tests pass",
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

    // Wait until runtime reward stripe appears
    const unlockedMsg = await screen.findByText(/Unlocked!/i, {}, { timeout: 10000 });
    expect(unlockedMsg).toBeInTheDocument();

    // Confirm reward text in the same container
    const rewardStripe = unlockedMsg.closest("div");
    expect(rewardStripe).toHaveTextContent(/\$10 Cashback/i);

    // Verify the modal opens successfully
    const modalTitle = await screen.findByText(/Submission Successful/i, {}, { timeout: 10000 });
    const couponLine = await screen.findByText(/Coupon Code:/i, {}, { timeout: 10000 });
    expect(modalTitle).toBeInTheDocument();
    expect(couponLine).toBeInTheDocument();

    // Ensure Judge0 called for both testcases
    expect(axios.post).toHaveBeenCalledTimes(2);
  },
  20000
);
