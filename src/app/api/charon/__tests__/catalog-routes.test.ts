import { GET as getAvailable } from "../getAvailable/route";
import { GET as getNarrative } from "../getNarrative/route";

describe("Charon catalog routes", () => {
  it("returns an intentionally empty available catalog", async () => {
    const response = getAvailable();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      datasets: [],
      narratives: [],
    });
  });

  it("rejects narratives with a controlled response", async () => {
    const response = getNarrative();
    expect(response.status).toBe(501);
    await expect(response.json()).resolves.toEqual({
      error: "narratives are not supported",
    });
  });
});
