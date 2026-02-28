import React, { useEffect, useMemo, useState, useCallback } from "react";
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
  Handle,
  MarkerType,
  ViewportPortal,
  Position,
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
  /** Which side of the line: "L" = left, "R" = right (matches display). */
  side?: string;
  depth: number;
  is_current_user: boolean;
  created_at?: string;
  invited_by?: string | null;
  invited_by_user_id?: number | null;
  left_count?: number;
  right_count?: number;
  /** Number of users in this node's left branch (L child + descendants). */
  left_users_below?: number;
  /** Number of users in this node's right branch (R child + descendants). */
  right_users_below?: number;
};
type TreeEdge = { from: number; to: number };

type UserNodeData = {
  label: string;
  isCurrent: boolean;
  isRoot: boolean;
  /** True = left subtree (blue), false = right subtree (red). Root is green. */
  isLeftSubtree: boolean;
  lane: string;
  shortLabel: string;
  depth: number;
};

/** Blue (L) and red (R) scales; darker as depth increases (0 = brightest). */
const LANE_COLORS = {
  L: [
    "bg-blue-400 border-blue-300 text-white",
    "bg-blue-500 border-blue-400 text-white",
    "bg-blue-600 border-blue-500 text-white",
    "bg-blue-700 border-blue-600 text-white",
    "bg-blue-800 border-blue-700 text-white",
    "bg-blue-900 border-blue-800 text-white",
  ],
  R: [
    "bg-red-400 border-red-300 text-white",
    "bg-red-500 border-red-400 text-white",
    "bg-red-600 border-red-500 text-white",
    "bg-red-700 border-red-600 text-white",
    "bg-red-800 border-red-700 text-white",
    "bg-red-900 border-red-800 text-white",
  ],
} as const;

function UserNode({ data }: NodeProps) {
  const d = data as UserNodeData;
  const isGreen = d.isRoot || d.isCurrent;
  const lane = d.isLeftSubtree ? "L" : "R";
  const scale = LANE_COLORS[lane];
  const depthIndex = Math.min(d.depth, scale.length - 1);
  const colorClass = isGreen
    ? "bg-emerald-500 border-emerald-400 text-white dark:bg-emerald-600 dark:border-emerald-500"
    : scale[depthIndex];
  return (
    <div
      className={cn(
        "relative flex items-center justify-center w-11 h-11 rounded-full border-2 font-semibold text-sm shadow-lg transition-all duration-200",
        "hover:scale-110 hover:shadow-xl cursor-pointer select-none",
        d.isCurrent ? "ring-2 ring-white ring-offset-2 ring-offset-[#1e1e2e]" : "",
        colorClass
      )}
      title={d.label}
    >
      <Handle type="target" id="top" position={Position.Top} className="!w-2 !h-2 !border-2 !border-white !bg-transparent" />
      <Handle type="source" id="bottom" position={Position.Bottom} className="!w-2 !h-2 !border-2 !border-white !bg-transparent" />
      {d.shortLabel}
    </div>
  );
}

const nodeTypes = {
  userNode: UserNode as React.ComponentType<NodeProps>,
};

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

  const SPACING = useMemo(() => ({ y: 88 }), []);
  const NODE_SIZE = 44;
  const LAYOUT = useMemo(
    () => ({
      nodeWidth: NODE_SIZE,
      nodeHeight: NODE_SIZE,
      centerGap: 100,
      subtreeGap: 48,
    }),
    []
  );

  const initialNodes: Node[] = useMemo(() => {
    if (!treeData?.nodes?.length) return [];
    const rawEdges = treeData.edges as { from: number; to: number }[];
    const rawNodes = treeData.nodes as TreeNode[];
    const edges = rawEdges.map((e) => ({ from: Number(e.from), to: Number(e.to) }));
    const nodes = rawNodes.map((n) => ({ ...n, id: Number(n.id), side: (n as TreeNode).side ?? n.lane }));
    const root = nodes.find((n) => !edges.some((e) => e.to === n.id));
    if (!root) return [];

    const childrenByParent = new Map<number, { L?: TreeNode; R?: TreeNode }>();
    nodes.forEach((n) => {
      if (n.id === root.id) return;
      const parentId = edges.find((e) => e.to === n.id)?.from;
      if (parentId == null) return;
      let entry = childrenByParent.get(parentId);
      if (!entry) {
        entry = {};
        childrenByParent.set(parentId, entry);
      }
      entry[n.lane as "L" | "R"] = n;
    });

    const subtreeWidth = (nodeId: number): number => {
      const entry = childrenByParent.get(nodeId);
      if (!entry || (!entry.L && !entry.R)) return LAYOUT.nodeWidth;
      const wL = entry.L ? subtreeWidth(entry.L.id) : 0;
      const wR = entry.R ? subtreeWidth(entry.R.id) : 0;
      return LAYOUT.subtreeGap + wL + wR;
    };

    const pos: Record<number, { x: number; y: number }> = {};
    const gap = LAYOUT.centerGap / 2;
    const sideOf = (nodeId: number): "L" | "R" | "root" => {
      if (nodeId === root.id) return "root";
      const parentId = edges.find((e) => e.to === nodeId)?.from;
      if (parentId == null) return "L";
      if (parentId === root.id) return (nodes.find((n) => n.id === nodeId)?.lane === "R" ? "R" : "L") as "L" | "R";
      return sideOf(parentId);
    };

    const assignPos = (nodeId: number, x: number, y: number) => {
      pos[nodeId] = { x, y };
      const entry = childrenByParent.get(nodeId);
      if (!entry) return;
      const hasL = !!entry.L;
      const hasR = !!entry.R;
      const wL = hasL ? subtreeWidth(entry.L!.id) : 0;
      const wR = hasR ? subtreeWidth(entry.R!.id) : 0;
      const nextY = y + SPACING.y;
      if (entry.L) {
        const cx = x - gap - wL / 2;
        assignPos(entry.L.id, cx, nextY);
      }
      if (entry.R) {
        const cx = x + gap + wR / 2;
        assignPos(entry.R.id, cx, nextY);
      }
    };

    const rootCenterX = 0;
    const rootCenterY = 0;
    const rootX = rootCenterX - LAYOUT.nodeWidth / 2;
    const rootY = rootCenterY - LAYOUT.nodeHeight / 2;
    assignPos(root.id, rootX, rootY);

    const rightEdgeLeftSubtree = Math.max(
      ...nodes.filter((n) => sideOf(n.id) === "L").map((n) => pos[n.id].x + LAYOUT.nodeWidth),
      -Infinity
    );
    const leftEdgeRightSubtree = Math.min(
      ...nodes.filter((n) => sideOf(n.id) === "R").map((n) => pos[n.id].x),
      Infinity
    );
    if (rightEdgeLeftSubtree > -gap && rightEdgeLeftSubtree !== -Infinity) {
      const shift = rightEdgeLeftSubtree - (-gap);
      nodes.filter((n) => sideOf(n.id) === "L").forEach((n) => { pos[n.id].x -= shift; });
    }
    if (leftEdgeRightSubtree < gap && leftEdgeRightSubtree !== Infinity) {
      const shift = gap - leftEdgeRightSubtree;
      nodes.filter((n) => sideOf(n.id) === "R").forEach((n) => { pos[n.id].x += shift; });
    }

    const shortLabel = (n: TreeNode) => {
      if (n.label.length <= 2) return n.label;
      const parts = n.label.replace(/@.*/, "").trim().split(/\s+/);
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return n.label.slice(0, 2).toUpperCase();
    };

    return nodes.map((n, index) => {
      const p = pos[n.id];
      const side = n.side ?? n.lane;
      const fallbackX = side === "L" ? -gap - 200 - index * 50 : gap + index * 50;
      const fallbackY = n.depth * SPACING.y;
      return {
        id: String(n.id),
        type: "userNode",
        position: p ?? { x: fallbackX, y: fallbackY },
        data: {
          label: n.label,
          isCurrent: n.is_current_user,
          isRoot: n.id === root.id,
          isLeftSubtree: side === "L",
          lane: n.lane,
          shortLabel: shortLabel(n),
          depth: n.depth,
        } as UserNodeData,
        zIndex: 1,
      };
    });
  }, [treeData, SPACING, LAYOUT]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const id = parseInt(node.id, 10);
      const tn = nodeMap.get(id) ?? null;
      setSelectedNode(tn);
    },
    [nodeMap]
  );

  const initialEdges: Edge[] = useMemo(() => {
    if (!treeData?.edges?.length || !treeData?.nodes?.length) return [];
    const rawEdges = treeData.edges as { from: number; to: number }[];
    return rawEdges.map((e) => ({
      id: `e${e.from}-${e.to}`,
      source: String(e.from),
      target: String(e.to),
      sourceHandle: "bottom",
      targetHandle: "top",
      type: "straight",
      markerEnd: { type: MarkerType.ArrowClosed, color: "rgb(255 255 255)" },
      style: {
        stroke: "rgb(255 255 255)",
        strokeWidth: 2.5,
      },
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
                      panOnDrag={true}
                      selectionOnDrag={false}
                      panOnScroll={false}
                      zoomOnScroll={true}
                      zoomOnPinch={true}
                      nodesDraggable={false}
                      elementsSelectable={true}
                      defaultEdgeOptions={{
                        type: "straight",
                        animated: false,
                        markerEnd: { type: MarkerType.ArrowClosed, color: "rgb(255 255 255)" },
                        style: { stroke: "rgb(255 255 255)", strokeWidth: 2.5 },
                      }}
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
                      {/* Vertical L/R split line through root node center (flow x=0) */}
                      {treeData.nodes.length > 0 && (() => {
                        const maxDepth = Math.max(...treeData.nodes.map((n) => n.depth));
                        const lineHeight = maxDepth * SPACING.y + 400;
                        return (
                          <ViewportPortal>
                            <svg
                              className="absolute pointer-events-none"
                              width={20}
                              height={lineHeight}
                              style={{ left: -10, top: -LAYOUT.nodeHeight / 2 }}
                              aria-hidden
                            >
                              <defs>
                                <linearGradient id="lane-divider-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="rgb(59 130 246)" stopOpacity={0.15} />
                                  <stop offset="50%" stopColor="rgb(113 113 122)" stopOpacity={0.5} />
                                  <stop offset="100%" stopColor="rgb(239 68 68)" stopOpacity={0.15} />
                                </linearGradient>
                                <filter id="lane-divider-glow" x="-50%" y="-50%" width="200%" height="200%">
                                  <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                                  <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                  </feMerge>
                                </filter>
                              </defs>
                              <line
                                x1={10}
                                y1={0}
                                x2={10}
                                y2={lineHeight}
                                stroke="url(#lane-divider-gradient)"
                                strokeWidth={3}
                                strokeLinecap="round"
                                filter="url(#lane-divider-glow)"
                              />
                              <line
                                x1={10}
                                y1={0}
                                x2={10}
                                y2={lineHeight}
                                stroke="rgba(113 113 122 / 0.6)"
                                strokeWidth={1}
                                strokeDasharray="8 6"
                                strokeLinecap="round"
                              />
                            </svg>
                          </ViewportPortal>
                        );
                      })()}
                      <Controls
                        className="!bg-zinc-800/90 !border-zinc-600 !rounded-lg [&>button]:!bg-zinc-700 [&>button]:!text-zinc-200 [&>button:hover]:!bg-zinc-600"
                        showInteractive={false}
                      />
                      <Panel position="top-left" className="text-xs text-zinc-500 bg-zinc-800/80 rounded px-2 py-1.5 border border-zinc-600/50">
                        Pan: left drag · Zoom: scroll
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
                              <a
                                href={`/user/${selectedNode.user_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-emerald-400 hover:text-emerald-300 hover:underline inline-flex items-center gap-1"
                              >
                                <User className="h-3.5 w-3" />
                                {selectedNode.label}
                              </a>
                              {selectedNode.is_current_user && (
                                <span className="ml-2 text-xs text-emerald-400">(you)</span>
                              )}
                            </div>
                            {selectedNode.invited_by != null && (
                              <div>
                                <span className="text-xs text-zinc-500 block mb-0.5">Invited by</span>
                                <span className="text-zinc-300">
                                  {selectedNode.invited_by_user_id != null ? (
                                    <a
                                      href={`/user/${selectedNode.invited_by_user_id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-amber-400 hover:text-amber-300 hover:underline"
                                    >
                                      {selectedNode.invited_by}
                                    </a>
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
                                <span className="text-xs text-zinc-500 block">Left users below</span>
                                <span className="text-blue-400 font-semibold">{selectedNode.left_users_below ?? 0}</span>
                              </div>
                              <div>
                                <span className="text-xs text-zinc-500 block">Right users below</span>
                                <span className="text-red-400 font-semibold">{selectedNode.right_users_below ?? 0}</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-xs text-zinc-500 block mb-0.5">Side · Depth</span>
                              <span className="text-zinc-300">
                                {(selectedNode.side ?? selectedNode.lane)} · {selectedNode.depth}
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
