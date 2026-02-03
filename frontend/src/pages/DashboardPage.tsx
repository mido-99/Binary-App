import React, { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";

type TreeNode = { id: number; label: string; lane: string; depth: number; is_current_user: boolean };
type TreeEdge = { from: number; to: number };

function UserNode({ data }: NodeProps) {
  const d = data as { label: string; isCurrent?: boolean };
  return (
    <div
      className={cn(
        "px-4 py-2 rounded-lg border-2 min-w-[120px] text-center text-sm font-medium shadow-sm",
        d.isCurrent
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-card-foreground border-border"
      )}
    >
      {d.label}
    </div>
  );
}

const nodeTypes = { userNode: UserNode as React.ComponentType<NodeProps> };

export function DashboardPage() {
  const { data: dashboardData } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/api/dashboard/");
      return data;
    },
  });

  const { data: treeData, isLoading: treeLoading } = useQuery<{ nodes: TreeNode[]; edges: TreeEdge[] }>({
    queryKey: ["tree"],
    queryFn: async () => {
      const { data } = await api.get("/api/dashboard/tree/");
      return data;
    },
  });

  const initialNodes: Node[] = useMemo(() => {
    if (!treeData?.nodes?.length) return [];
    const edges = treeData.edges;
    const nodes = treeData.nodes;
    const root = nodes.find((n) => !edges.some((e) => e.to === n.id));
    const pos: Record<number, { x: number; y: number }> = {};
    if (root) {
      pos[root.id] = { x: 0, y: 0 };
      const queue: { node: TreeNode; x: number; y: number }[] = [{ node: root, x: 0, y: 0 }];
      const spacing = { x: 200, y: 90 };
      while (queue.length) {
        const { node, x, y } = queue.shift()!;
        const childEdges = edges.filter((e) => e.from === node.id);
        childEdges.forEach((e) => {
          const c = nodes.find((n) => n.id === e.to);
          if (!c) return;
          const isLeft = c.lane === "L";
          const cx = x + (isLeft ? -spacing.x : spacing.x);
          const cy = y + spacing.y;
          pos[c.id] = { x: cx, y: cy };
          queue.push({ node: c, x: cx, y: cy });
        });
      }
    }
    return treeData.nodes.map((n) => ({
      id: String(n.id),
      type: "userNode",
      position: pos[n.id] ?? { x: 0, y: 0 },
      data: { label: n.label, isCurrent: n.is_current_user },
    }));
  }, [treeData]);

  const initialEdges: Edge[] = useMemo(() => {
    if (!treeData?.edges?.length) return [];
    return treeData.edges.map((e) => ({
      id: `e${e.from}-${e.to}`,
      source: String(e.from),
      target: String(e.to),
      type: "smoothstep",
    }));
  }, [treeData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const stats = dashboardData?.stats ?? {
    total_referrals: "0",
    left_count: "0",
    right_count: "0",
    direct_bonus: "0.00",
    hierarchy_bonus: "0.00",
    released_bonus: "0.00",
    pending_bonus: "0.00",
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <motion.section
        className="lg:col-span-2 space-y-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">Referral overview</h1>
          <p className="text-sm text-muted-foreground mt-1">L/R pairs drive all bonus releases.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <Card className="overflow-hidden border-t-4 border-t-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Totals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-2xl sm:text-3xl font-heading font-bold">{stats.total_referrals}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Referrals</div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-heading font-bold text-primary">{stats.left_count}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">L count</div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-heading font-bold text-accent">{stats.right_count}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">R count</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <Card className="overflow-hidden border-t-4 border-t-accent">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Bonuses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between items-baseline">
                    <dt className="text-muted-foreground">Direct</dt>
                    <dd className="font-heading font-bold">{stats.direct_bonus}</dd>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <dt className="text-muted-foreground">Hierarchy</dt>
                    <dd className="font-heading font-bold">{stats.hierarchy_bonus}</dd>
                  </div>
                  <div className="flex justify-between items-baseline text-xs pt-2 border-t">
                    <dt className="text-muted-foreground">Released / Pending</dt>
                    <dd className="font-semibold">
                      {stats.released_bonus} / {stats.pending_bonus}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="font-heading text-lg">Binary tree</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Drag to pan · scroll to zoom · your subtree only.</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CircleDot className="h-4 w-4 text-primary" /> You
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[420px] rounded-lg bg-muted/20 border">
                {treeLoading ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Loading tree…
                  </div>
                ) : !treeData?.nodes?.length ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm p-8 text-center">
                    You are not yet in the tree. Tree placement happens when you are referred.
                  </div>
                ) : (
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                    minZoom={0.2}
                    maxZoom={2}
                    defaultEdgeOptions={{ type: "smoothstep", animated: false }}
                    proOptions={{ hideAttribution: true }}
                  >
                    <Background />
                    <Controls />
                    <Panel position="top-left" className="text-xs text-muted-foreground">
                      Drag · Zoom · Pan
                    </Panel>
                  </ReactFlow>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.section>

      <motion.section
        className="space-y-6"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.25, duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Latest bonus events</CardTitle>
          </CardHeader>
          <CardContent>
            <BonusEventsList />
          </CardContent>
        </Card>
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="font-heading text-base">Pairing & bonus rules</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-900 dark:text-amber-200 space-y-1.5">
            <ul className="list-disc list-inside space-y-1">
              <li>Bonuses only come from purchases, never signups.</li>
              <li>Pairs form when min(L, R) increases on an ancestor.</li>
              <li>Hierarchy pool decays with depth and stops at depth 15.</li>
            </ul>
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}

function BonusEventsList() {
  const { data, isLoading } = useQuery<{ events: Array<{ id: number; bonus_type: string; amount: string; status: string; order_id: number; depth: number | null; created_at: string }> }>({
    queryKey: ["bonus-events"],
    queryFn: async () => {
      const { data } = await api.get("/api/dashboard/bonus-events/");
      return data;
    },
  });
  const events = data?.events ?? [];
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!events.length)
    return (
      <p className="text-sm text-muted-foreground">
        No bonus events yet. Bonuses appear when purchase-triggered L/R pairs form.
      </p>
    );
  return (
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {events.map((e) => (
        <div
          key={e.id}
          className="rounded-lg border bg-card/80 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
        >
          <div>
            <span className="font-semibold">{e.bonus_type}</span> · {e.amount}{" "}
            <span className="text-xs uppercase text-muted-foreground">{e.status}</span>
            <div className="text-xs text-muted-foreground mt-0.5">
              Order #{e.order_id} · depth {e.depth ?? "—"}
            </div>
          </div>
          <span className="text-xs text-muted-foreground shrink-0">{new Date(e.created_at).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
