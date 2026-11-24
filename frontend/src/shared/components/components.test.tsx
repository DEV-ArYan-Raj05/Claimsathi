import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import "@/shared/i18n";
import { AlertItem } from "./AlertItem";
import { ScoreRing } from "./ScoreRing";
import { TrackSwitcher } from "./TrackSwitcher";

afterEach(cleanup);

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

describe("ScoreRing", () => {
  it.each([
    [92, "Ready to send"],
    [70, "Fix a few things"],
    [41, "High risk of rejection"],
  ])("score %i shows band %s", (score, label) => {
    render(<ScoreRing score={score} />);
    expect(screen.getByText(label)).toBeTruthy();
  });
});

describe("AlertItem", () => {
  it("shows the problem, the document and the fix", () => {
    render(
      <ul>
        <AlertItem
          severity="critical"
          title="No clinic stamp on this bill"
          fix="Ask the clinic to stamp it"
          documentName="bill.jpg"
          bbox={[0.1, 0.1, 0.2, 0.2]}
        />
      </ul>,
    );
    expect(screen.getByText("Must fix")).toBeTruthy();
    expect(screen.getByText("bill.jpg")).toBeTruthy();
    expect(screen.getByText("Ask the clinic to stamp it")).toBeTruthy();
  });

  it("labels an overridden failure with its reason", () => {
    render(
      <ul>
        <AlertItem severity="critical" title="t" fix="f" overriddenReason="Clinic has closed" />
      </ul>,
    );
    expect(screen.getByText("Sent anyway: Clinic has closed")).toBeTruthy();
  });
});

describe("TrackSwitcher", () => {
  it("switches to the equivalent screen in the other track", () => {
    render(
      <MemoryRouter initialEntries={["/health/policies"]}>
        <Routes>
          <Route
            path="/:track/*"
            element={
              <>
                <TrackSwitcher />
                <Where />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    const crop = screen.getByRole("radio", { name: /Crop/ });
    expect(crop.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(crop);
    expect(screen.getByTestId("where").textContent).toBe("/crop/policies");
    expect(screen.getByRole("radio", { name: /Crop/ }).getAttribute("aria-checked")).toBe("true");
  });
});
