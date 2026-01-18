import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders Job Listings on home page", () => {
  render(<App />);
  const heading = screen.getByRole("heading", { name: /job listings/i });
  expect(heading).toBeInTheDocument();
});
