import { serviceQueryKeys } from "@/lib/services/service-query-keys";

describe("serviceQueryKeys", () => {
  it("genomeGroupMembers returns a stable tuple for the same path", () => {
    const key = serviceQueryKeys.genomeGroupMembers("/user/group");
    expect(key).toEqual(["service", "genome-group", "/user/group"]);
    expect(key).toEqual(serviceQueryKeys.genomeGroupMembers("/user/group"));
  });

  it("featureGroupMembers returns a stable tuple for the same path", () => {
    const key = serviceQueryKeys.featureGroupMembers("/user/feat");
    expect(key).toEqual(["service", "feature-group", "/user/feat"]);
    expect(key).toEqual(serviceQueryKeys.featureGroupMembers("/user/feat"));
  });

  it("different paths produce different keys", () => {
    expect(serviceQueryKeys.genomeGroupMembers("/a")).not.toEqual(
      serviceQueryKeys.genomeGroupMembers("/b"),
    );
    expect(serviceQueryKeys.featureGroupMembers("/a")).not.toEqual(
      serviceQueryKeys.featureGroupMembers("/b"),
    );
  });

  it("genome and feature keys do not collide for the same path", () => {
    expect(serviceQueryKeys.genomeGroupMembers("/x")).not.toEqual(
      serviceQueryKeys.featureGroupMembers("/x"),
    );
  });
});
