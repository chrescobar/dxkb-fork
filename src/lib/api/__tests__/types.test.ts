import { ApiCallError, statusToErrorCode } from "../types";

describe("ApiCallError", () => {
  it("stores status, code, message, and details", () => {
    const error = new ApiCallError({
      message: "Not authenticated",
      status: 401,
      code: "unauthenticated",
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ApiCallError");
    expect(error.message).toBe("Not authenticated");
    expect(error.status).toBe(401);
    expect(error.code).toBe("unauthenticated");
    expect(error.details).toBeUndefined();
  });

  it("stores optional details", () => {
    const details = { fieldErrors: { email: "required" } };
    const error = new ApiCallError({
      message: "Validation failed",
      status: 400,
      code: "validation",
      details,
    });

    expect(error.details).toEqual(details);
  });

  it("is catchable as an Error", () => {
    const error = new ApiCallError({
      message: "test",
      status: 500,
      code: "unknown",
    });

    expect(() => {
      throw error;
    }).toThrow("test");
  });
});

describe("statusToErrorCode", () => {
  it("maps 401 to unauthenticated", () => {
    expect(statusToErrorCode(401)).toBe("unauthenticated");
  });

  it("maps 403 to forbidden", () => {
    expect(statusToErrorCode(403)).toBe("forbidden");
  });

  it("maps 404 to not_found", () => {
    expect(statusToErrorCode(404)).toBe("not_found");
  });

  it("maps 400 to validation", () => {
    expect(statusToErrorCode(400)).toBe("validation");
  });

  it("maps 422 to validation", () => {
    expect(statusToErrorCode(422)).toBe("validation");
  });

  it("maps 500 to upstream", () => {
    expect(statusToErrorCode(500)).toBe("upstream");
  });

  it("maps 502 to upstream", () => {
    expect(statusToErrorCode(502)).toBe("upstream");
  });
});
