import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Spin } from "../components/Spin";
import { DRUM_ROLL_SPINNER, DRUM_ROLL_SPINNER_DARK } from "../assets/drumRollSpinner";
import { HOURGLASS_SPINNER, HOURGLASS_SPINNER_DARK } from "../assets/hourglassSpinner";
import { FLYING_PAPERS_SPINNER, FLYING_PAPERS_SPINNER_DARK } from "../assets/flyingPapersSpinner";

describe("Spin", () => {
  it("renders a status role with a default label when spinning alone", () => {
    render(<Spin />);
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("defaults to the drums variant, with both a light and dark redraw", () => {
    const { container } = render(<Spin />);
    expect(container.querySelector(".rebar-spin-icon-raster-light")).toHaveAttribute(
      "src",
      DRUM_ROLL_SPINNER,
    );
    expect(container.querySelector(".rebar-spin-icon-raster-dark")).toHaveAttribute(
      "src",
      DRUM_ROLL_SPINNER_DARK,
    );
  });

  it("switches both the light and dark icon per the variant prop", () => {
    const { container: hourglass } = render(<Spin variant="hourglass" />);
    expect(hourglass.querySelector(".rebar-spin-icon-raster-light")).toHaveAttribute(
      "src",
      HOURGLASS_SPINNER,
    );
    expect(hourglass.querySelector(".rebar-spin-icon-raster-dark")).toHaveAttribute(
      "src",
      HOURGLASS_SPINNER_DARK,
    );

    const { container: papers } = render(<Spin variant="papers" />);
    expect(papers.querySelector(".rebar-spin-icon-raster-light")).toHaveAttribute(
      "src",
      FLYING_PAPERS_SPINNER,
    );
    expect(papers.querySelector(".rebar-spin-icon-raster-dark")).toHaveAttribute(
      "src",
      FLYING_PAPERS_SPINNER_DARK,
    );
  });

  it("renders only the plain vector spinner for the classic variant, in any theme", () => {
    const { container } = render(<Spin variant="classic" />);
    expect(container.querySelector(".rebar-spin-icon-raster-light")).not.toBeInTheDocument();
    expect(container.querySelector(".rebar-spin-icon-raster-dark")).not.toBeInTheDocument();
    expect(container.querySelector(".rebar-spin-icon-vector")).toBeInTheDocument();
    expect(container.querySelector(".rebar-spin-icon-classic")).toBeInTheDocument();
  });

  it("renders nothing when spinning is false and there are no children", () => {
    const { container } = render(<Spin spinning={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("uses tip text as the accessible label when provided", () => {
    render(<Spin tip="Fetching projects" />);
    expect(screen.getByRole("status", { name: "Fetching projects" })).toBeInTheDocument();
    expect(screen.getByText("Fetching projects")).toBeInTheDocument();
  });

  it("wraps children, marking them busy while spinning", () => {
    render(
      <Spin spinning>
        <p>Project list</p>
      </Spin>,
    );
    expect(screen.getByText("Project list")).toBeInTheDocument();
    expect(screen.getByText("Project list").parentElement).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders children plainly, with no overlay, when not spinning", () => {
    render(
      <Spin spinning={false}>
        <p>Project list</p>
      </Spin>,
    );
    expect(screen.getByText("Project list").parentElement).toHaveAttribute("aria-busy", "false");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  describe("bionic reading on the tip", () => {
    afterEach(() => {
      cleanup();
      document.documentElement.removeAttribute("data-rebar-bionic");
    });

    it("renders the tip plainly by default", () => {
      const { container } = render(<Spin tip="Loading" />);
      expect(container.querySelector(".rebar-bionic-fixation")).not.toBeInTheDocument();
      expect(screen.getByText("Loading")).toBeInTheDocument();
    });

    it("follows the ambient data-rebar-bionic attribute", () => {
      document.documentElement.setAttribute("data-rebar-bionic", "true");
      const { container } = render(<Spin tip="Loading" />);
      expect(container.querySelector(".rebar-bionic-fixation")).toBeInTheDocument();
    });

    it("lets an explicit bionic prop override the ambient setting", () => {
      document.documentElement.setAttribute("data-rebar-bionic", "true");
      const { container } = render(<Spin tip="Loading" bionic={false} />);
      expect(container.querySelector(".rebar-bionic-fixation")).not.toBeInTheDocument();
    });
  });
});
