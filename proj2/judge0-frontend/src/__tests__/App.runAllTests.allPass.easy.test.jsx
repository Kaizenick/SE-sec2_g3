import { render, screen, act, fireEvent } from "@testing-library/react";
import axios from "axios";
import App from "../App";

jest.mock("axios");
jest.mock("../Output", () => (props) => (
  <div data-testid="mock-output">{props.output || props.error}</div>
));

jest.mock("../data/problems.json", () => [
  {
    id: 2,
    title: "Dummy Easy",
    difficulty: "easy",
    templates: { python: "print('ok')" },
    testcases: [{ id: 1, input: "", expected: "OK" }],
  },
]);

test(
  "EASY difficulty unlocks $5 Cashback reward when all tests pass",
  async () => {
    // Make sure Judge0 always returns the expected stdout
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

    const unlockedMsg = await screen.findByText(/Unlocked!/i, {}, { timeout: 10000 });
    expect(unlockedMsg).toBeInTheDocument();

    //  Safely locate the dynamic reward text near that “Unlocked!” element
    const rewardStripe = unlockedMsg.closest("div");
    expect(rewardStripe).toHaveTextContent(/\$5 Cashback/i);

    const modalTitle = await screen.findByText(/Submission Successful/i, {}, { timeout: 10000 });
    const couponText = await screen.findByText(/Coupon Code:/i, {}, { timeout: 10000 });
    expect(modalTitle).toBeInTheDocument();
    expect(couponText).toBeInTheDocument();

    expect(axios.post).toHaveBeenCalledTimes(1);
  },
  20000
);
