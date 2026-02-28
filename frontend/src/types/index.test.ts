import { describe, it, expect } from "vitest";

describe("types", () => {
  it("TreeNode-like shape has required fields", () => {
    const node = {
      id: 1,
      user_id: 1,
      label: "user@example.com",
      lane: "L",
      depth: 0,
      is_current_user: false,
      side: "L",
      left_users_below: 0,
      right_users_below: 0,
    };
    expect(node.id).toBe(1);
    expect(node.lane).toBe("L");
    expect(node.side).toBe("L");
    expect(node.left_users_below).toBe(0);
    expect(node.right_users_below).toBe(0);
  });

  it("Tree edge shape has from and to", () => {
    const edge = { from: 1, to: 2 };
    expect(edge.from).toBe(1);
    expect(edge.to).toBe(2);
  });
});
