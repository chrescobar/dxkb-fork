import type { AnyFieldApi } from "@tanstack/react-form";

import { createOutputNameValidator } from "@/lib/forms/output-name-validator";

function makeFieldApi(formValues: Record<string, unknown>): AnyFieldApi {
  return {
    form: {
      state: { values: formValues },
    },
  } as unknown as AnyFieldApi;
}

describe("createOutputNameValidator", () => {
  it("returns undefined for an available name", async () => {
    const checkExists = vi.fn().mockResolvedValue(false);
    const validate = createOutputNameValidator({ checkExists });

    const result = await validate({
      value: "my-output",
      fieldApi: makeFieldApi({ output_path: "/user/home" }),
      signal: new AbortController().signal,
    });

    expect(result).toBeUndefined();
  });

  it("returns the taken-name message for a taken name", async () => {
    const checkExists = vi.fn().mockResolvedValue(true);
    const validate = createOutputNameValidator({ checkExists });

    const result = await validate({
      value: "existing-output",
      fieldApi: makeFieldApi({ output_path: "/user/home" }),
      signal: new AbortController().signal,
    });

    expect(result).toBe(
      "An object with this name already exists in the selected folder.",
    );
  });

  it("returns undefined when output path is empty", async () => {
    const checkExists = vi.fn().mockResolvedValue(true);
    const validate = createOutputNameValidator({ checkExists });

    const result = await validate({
      value: "my-output",
      fieldApi: makeFieldApi({ output_path: "" }),
      signal: new AbortController().signal,
    });

    expect(result).toBeUndefined();
    expect(checkExists).not.toHaveBeenCalled();
  });

  it("returns undefined when output name is empty", async () => {
    const checkExists = vi.fn().mockResolvedValue(true);
    const validate = createOutputNameValidator({ checkExists });

    const result = await validate({
      value: "",
      fieldApi: makeFieldApi({ output_path: "/user/home" }),
      signal: new AbortController().signal,
    });

    expect(result).toBeUndefined();
    expect(checkExists).not.toHaveBeenCalled();
  });

  it("returns undefined when output name is whitespace only", async () => {
    const checkExists = vi.fn().mockResolvedValue(true);
    const validate = createOutputNameValidator({ checkExists });

    const result = await validate({
      value: "   ",
      fieldApi: makeFieldApi({ output_path: "/user/home" }),
      signal: new AbortController().signal,
    });

    expect(result).toBeUndefined();
    expect(checkExists).not.toHaveBeenCalled();
  });

  it("passes the abort signal through to checkExists", async () => {
    const checkExists = vi.fn().mockResolvedValue(false);
    const validate = createOutputNameValidator({ checkExists });
    const controller = new AbortController();

    await validate({
      value: "my-output",
      fieldApi: makeFieldApi({ output_path: "/user/home" }),
      signal: controller.signal,
    });

    expect(checkExists).toHaveBeenCalledWith(
      "/user/home/my-output",
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it("constructs the full path by joining output_path and output name", async () => {
    const checkExists = vi.fn().mockResolvedValue(false);
    const validate = createOutputNameValidator({ checkExists });

    await validate({
      value: "result",
      fieldApi: makeFieldApi({ output_path: "/user/home/folder/" }),
      signal: new AbortController().signal,
    });

    expect(checkExists).toHaveBeenCalledWith(
      "/user/home/folder/result",
      expect.anything(),
    );
  });

  it("respects a custom outputPathFieldName", async () => {
    const checkExists = vi.fn().mockResolvedValue(false);
    const validate = createOutputNameValidator({
      checkExists,
      outputPathFieldName: "custom_path",
    });

    await validate({
      value: "output",
      fieldApi: makeFieldApi({ custom_path: "/custom/dir" }),
      signal: new AbortController().signal,
    });

    expect(checkExists).toHaveBeenCalledWith(
      "/custom/dir/output",
      expect.anything(),
    );
  });

  it("returns undefined when form values are not an object", async () => {
    const checkExists = vi.fn().mockResolvedValue(true);
    const validate = createOutputNameValidator({ checkExists });

    const result = await validate({
      value: "output",
      fieldApi: {
        form: { state: { values: null } },
      } as unknown as AnyFieldApi,
      signal: new AbortController().signal,
    });

    expect(result).toBeUndefined();
    expect(checkExists).not.toHaveBeenCalled();
  });
});
