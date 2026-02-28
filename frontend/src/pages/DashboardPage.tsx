import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import { CircleDot, RefreshCw, AlertCircle, X, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type TreeNode = {
  id: number;
  user_id: number;
  label: string;
  lane: string;
  depth: number;
  is_current_user: boolean;
  created_at?: string;
  invited_by?: string | null;
  invited_by_user_id?: number | null;
  left_count?: number;
  right_count?: number;
};
type TreeEdge = { from: number; to: number };

type UserNodeData = {
  label: string;
  isCurrent: boolean;
  lane: string;
  shortLabel: string;
};

function UserNode({ data }: NodeProps) {
  const d = data as UserNodeData;
  return (
    <div
      className={cn(
        "flex items-center justify-center w-11 h-11 rounded-full border-2 font-semibold text-sm shadow-lg transition-all duration-200",
        "hover:scale-110 hover:shadow-xl cursor-pointer select-none",
        d.isCurrent
          ? "bg-emerald-500 border-emerald-400 text-white dark:bg-emerald-600 dark:border-emerald-500"
          : "bg-amber-500/90 border-amber-400 text-white dark:bg-amber-600 dark:border-amber-500"
      )}
      title={d.label}
    >
      {d.shortLabel}
    </div>
  );
}

const nodeTypes = { userNode: UserNode as React.ComponentType<NodeProps> };

const PAGE_SIZE = 20;

export function DashboardPage() {
  const queryClient = useQueryClient();
  const { data: dashboardData, isError: dashboardError, refetch: refetchDashboard, dataUpdatedAt: dashboardUpdatedAt } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/api/dashboard/");
      return data;
    },
  });

  const { data: treeData, isLoading: treeLoading, isError: treeError, refetch: refetchTree } = useQuery<{ nodes: TreeNode[]; edges: TreeEdge[] }>({
    queryKey: ["tree"],
    queryFn: async () => {
      const { data } = await api.get("/api/dashboard/tree/");
      return data;
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["tree"] });
    queryClient.invalidateQueries({ queryKey: ["bonus-events"] });
  };

  const lastUpdated = dashboardUpdatedAt ? new Date(dashboardUpdatedAt).toLocaleTimeString() : null;

  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const nodeMap = useMemo(() => {
    const m = new Map<number, TreeNode>();
    treeData?.nodes?.forEach((n) => m.set(n.id, n));
    return m;
  }, [treeData?.nodes]);

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
    const shortLabel = (n: TreeNode) => {
      if (n.label.length <= 2) return n.label;
      const parts = n.label.replace(/@.*/, "").trim().split(/\s+/);
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return n.label.slice(0, 2).toUpperCase();
    };
    return treeData.nodes.map((n) => ({
      id: String(n.id),
      type: "userNode",
      position: pos[n.id] ?? { x: 0, y: 0 },
      data: {
        label: n.label,
        isCurrent: n.is_current_user,
        lane: n.lane,
        shortLabel: shortLabel(n),
      } as UserNodeData,
    }));
  }, [treeData]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const id = parseInt(node.id, 10);
      const tn = nodeMap.get(id) ?? null;
      setSelectedNode(tn);
    },
    [nodeMap]
  );

  const initialEdges: Edge[] = useMemo(() => {
    if (!treeData?.edges?.length) return [];
    const nodes = treeData.nodes;
    const laneByNodeId = new Map(nodes.map((n) => [n.id, n.lane]));
    return treeData.edges.map((e) => {
      const lane = laneByNodeId.get(e.to) ?? "L";
      const isLeft = lane === "L";
      return {
        id: `e${e.from}-${e.to}`,
        source: String(e.from),
        target: String(e.to),
        type: "smoothstep",
        style: { stroke: isLeft ? "rgb(245 158 11)" : "rgb(16 185 129)", strokeWidth: 2 },
      };
    });
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">Referral overview</h1>
            <p className="text-sm text-muted-foreground mt-1">L/R pairs drive all bonus releases.</p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">Last updated {lastUpdated}</span>
            )}
            <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-1.5">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {dashboardError && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="flex flex-row items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">Failed to load stats</p>
                <p className="text-xs text-muted-foreground mt-0.5">Check your connection and try again.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchDashboard()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}
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
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="font-heading text-lg">Binary tree</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Drag empty area to pan · scroll to zoom · click a node for details.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CircleDot className="h-4 w-4 text-emerald-500" /> You
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative h-[480px] rounded-b-lg overflow-hidden bg-[#1e1e2e]">
                {treeLoading ? (
                  <div className="h-full flex items-center justify-center text-zinc-400 text-sm">
                    Loading tree…
                  </div>
                ) : treeError ? (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-zinc-400 text-sm p-8">
                    <AlertCircle className="h-10 w-10 text-red-400" />
                    <p>Failed to load tree.</p>
                    <Button variant="outline" size="sm" onClick={() => refetchTree()}>
                      Retry
                    </Button>
                  </div>
                ) : !treeData?.nodes?.length ? (
                  <div className="h-full flex items-center justify-center text-zinc-400 text-sm p-8 text-center">
                    You are not yet in the tree. Tree placement happens when you are referred.
                  </div>
                ) : (
                  <>
                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      onNodeClick={onNodeClick}
                      onPaneClick={() => setSelectedNode(null)}
                      nodeTypes={nodeTypes}
                      fitView
                      fitViewOptions={{ padding: 0.25 }}
                      minZoom={0.15}
                      maxZoom={2.5}
                      panOnDrag={[1, 2]}
                      panOnScroll={false}
                      zoomOnScroll={true}
                      zoomOnPinch={true}
                      nodesDraggable={false}
                      elementsSelectable={true}
                      defaultEdgeOptions={{ type: "smoothstep", animated: false }}
                      proOptions={{ hideAttribution: true }}
                      className="bg-[#1e1e2e]"
                    >
                      <Background
                        variant="dots"
                        gap={20}
                        size={1.2}
                        color="rgba(113, 113, 122, 0.4)"
                        className="bg-[#1e1e2e]"
                      />
                      <Controls
                        className="!bg-zinc-800/90 !border-zinc-600 !rounded-lg [&>button]:!bg-zinc-700 [&>button]:!text-zinc-200 [&>button:hover]:!bg-zinc-600"
                        showInteractive={false}
                      />
                      <Panel position="top-left" className="text-xs text-zinc-500 bg-zinc-800/80 rounded px-2 py-1.5 border border-zinc-600/50">
                        Pan: drag · Zoom: scroll
                      </Panel>
                    </ReactFlow>
                    <AnimatePresence>
                      {selectedNode && (
                        <motion.div
                          initial={{ opacity: 0, x: 24 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 24 }}
                          transition={{ type: "tween", duration: 0.2 }}
                          className="absolute top-3 right-3 w-72 rounded-lg border border-zinc-600/60 bg-zinc-800/95 shadow-xl backdrop-blur-sm z-10 overflow-hidden"
                        >
                          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-600/50 bg-zinc-700/50">
                            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Node</span>
                            <button
                              type="button"
                              onClick={() => setSelectedNode(null)}
                              className="p-1 rounded hover:bg-zinc-600 text-zinc-400 hover:text-zinc-200"
                              aria-label="Close"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="p-4 space-y-3 text-sm">
                            <div>
                              <span className="text-xs text-zinc-500 block mb-0.5">Name</span>
                              <Link
                                to={`/user/${selectedNode.user_id}`}
                                className="font-medium text-emerald-400 hover:text-emerald-300 hover:underline inline-flex items-center gap-1"
                              >
                                <User className="h-3.5 w-3" />
                                {selectedNode.label}
                              </Link>
                              {selectedNode.is_current_user && (
                                <span className="ml-2 text-xs text-emerald-400">(you)</span>
                              )}
                            </div>
                            {selectedNode.invited_by != null && (
                              <div>
                                <span className="text-xs text-zinc-500 block mb-0.5">Invited by</span>
                                <span className="text-zinc-300">
                                  {selectedNode.invited_by_user_id != null ? (
                                    <Link
                                      to={`/user/${selectedNode.invited_by_user_id}`}
                                      className="text-amber-400 hover:text-amber-300 hover:underline"
                                    >
                                      {selectedNode.invited_by}
                                    </Link>
                                  ) : (
                                    selectedNode.invited_by
                                  )}
                                </span>
                              </div>
                            )}
                            {selectedNode.created_at && (
                              <div>
                                <span className="text-xs text-zinc-500 block mb-0.5">Added at</span>
                                <span className="text-zinc-300">
                                  {new Date(selectedNode.created_at).toLocaleString()}
                                </span>
                              </div>
                            )}
                            <div className="flex gap-4 pt-1">
                              <div>
                                <span className="text-xs text-zinc-500 block">Left lane below</span>
                                <span className="text-amber-400 font-semibold">{selectedNode.left_count ?? 0}</span>
                              </div>
                              <div>
                                <span className="text-xs text-zinc-500 block">Right lane below</span>
                                <span className="text-emerald-400 font-semibold">{selectedNode.right_count ?? 0}</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-xs text-zinc-500 block mb-0.5">Lane · Depth</span>
                              <span className="text-zinc-300">
                                {selectedNode.lane} · {selectedNode.depth}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
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

type BonusEventItem = {
  id: number;
  bonus_type: string;
  amount: string;
  status: string;
  order_id: number;
  depth: number | null;
  created_at: string;
};

function BonusEventsList() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["bonus-events"],
    queryFn: async ({ pageParam }) => {
      const { data: res } = await api.get<{ events: BonusEventItem[]; total_count: number; page: number; page_size: number }>(
        "/api/dashboard/bonus-events/",
        { params: { page: pageParam, page_size: PAGE_SIZE } }
      );
      return res;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.events.length < lastPage.page_size) return undefined;
      if (lastPage.page * lastPage.page_size >= lastPage.total_count) return undefined;
      return lastPage.page + 1;
    },
  });
  const events = data?.pages.flatMap((p) => p.events) ?? [];
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (isError)
    return (
      <div className="space-y-2">
        <p className="text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Failed to load bonus events.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  if (!events.length)
    return (
      <p className="text-sm text-muted-foreground">
        No bonus events yet. Bonuses appear when purchase-triggered L/R pairs form.
      </p>
    );
  return (
    <div className="space-y-2">
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
      {hasNextPage && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? "Loading…" : "Load more"}
        </Button>
      )}
    </div>
  );
}
