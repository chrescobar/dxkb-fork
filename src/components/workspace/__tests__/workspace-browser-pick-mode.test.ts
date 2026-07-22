import { pickDirectoryMode } from "../workspace-browser";

const base = {
  username: "alice",
  path: "home/folder",
  fullPath: "/alice@bvbrc/home/folder",
  currentUser: "alice@bvbrc",
  isJobResultView: false,
  isAtSharedRoot: false,
  isPublic: false,
  publicLevel: "path" as const,
};

describe("pickDirectoryMode", () => {
  describe("home mode", () => {
    it("returns home kind with username and path", () => {
      expect(pickDirectoryMode({ ...base, mode: "home" })).toEqual({
        kind: "home",
        username: "alice",
        path: "home/folder",
      });
    });

    it("returns null when currentUser is empty", () => {
      expect(
        pickDirectoryMode({ ...base, mode: "home", currentUser: "" }),
      ).toBeNull();
    });
  });

  describe("shared mode", () => {
    it("returns sharedPath kind with fullPath when not at shared root", () => {
      expect(pickDirectoryMode({ ...base, mode: "shared" })).toEqual({
        kind: "sharedPath",
        fullPath: "/alice@bvbrc/home/folder",
      });
    });

    it("returns sharedRoot kind when isAtSharedRoot", () => {
      expect(
        pickDirectoryMode({ ...base, mode: "shared", isAtSharedRoot: true }),
      ).toEqual({
        kind: "sharedRoot",
        currentUser: "alice@bvbrc",
      });
    });

    it("returns null when isAtSharedRoot and currentUser is empty", () => {
      expect(
        pickDirectoryMode({
          ...base,
          mode: "shared",
          isAtSharedRoot: true,
          currentUser: "",
        }),
      ).toBeNull();
    });

    it("returns null when not at shared root and fullPath is empty", () => {
      expect(
        pickDirectoryMode({ ...base, mode: "shared", fullPath: "" }),
      ).toBeNull();
    });
  });

  describe("public mode", () => {
    it("returns publicRoot when publicLevel is root", () => {
      expect(
        pickDirectoryMode({ ...base, mode: "public", isPublic: true, publicLevel: "root" }),
      ).toEqual({ kind: "publicRoot" });
    });

    it("returns publicRoot when username is empty", () => {
      expect(
        pickDirectoryMode({ ...base, mode: "public", isPublic: true, username: "" }),
      ).toEqual({ kind: "publicRoot" });
    });

    it("returns publicUser when publicLevel is user", () => {
      expect(
        pickDirectoryMode({ ...base, mode: "public", isPublic: true, publicLevel: "user" }),
      ).toEqual({ kind: "publicUser", username: "alice" });
    });

    it("returns publicPath when publicLevel is path", () => {
      expect(
        pickDirectoryMode({ ...base, mode: "public", isPublic: true, publicLevel: "path" }),
      ).toEqual({ kind: "publicPath", fullPath: "/alice@bvbrc/home/folder" });
    });
  });

  describe("jobResult mode", () => {
    it("returns jobResult kind using the dot path", () => {
      expect(
        pickDirectoryMode({
          ...base,
          mode: "home",
          isJobResultView: true,
          jobDotPath: "/alice@bvbrc/home/.myjob",
        }),
      ).toEqual({
        kind: "jobResult",
        fullPath: "/alice@bvbrc/home/.myjob",
        visiblePath: "home/folder",
      });
    });

    it("normalizes jobDotPath by prepending slash when missing", () => {
      expect(
        pickDirectoryMode({
          ...base,
          mode: "home",
          isJobResultView: true,
          jobDotPath: "alice@bvbrc/home/.myjob",
        }),
      ).toEqual(
        expect.objectContaining({ kind: "jobResult", fullPath: "/alice@bvbrc/home/.myjob" }),
      );
    });

    it("returns null when isJobResultView but jobDotPath is missing", () => {
      expect(
        pickDirectoryMode({ ...base, mode: "home", isJobResultView: true }),
      ).toBeNull();
    });

    it("jobResult takes precedence over public mode", () => {
      const result = pickDirectoryMode({
        ...base,
        mode: "home",
        isPublic: true,
        isJobResultView: true,
        jobDotPath: "/alice@bvbrc/home/.job",
      });
      expect(result?.kind).toBe("jobResult");
    });
  });
});
