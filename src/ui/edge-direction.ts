import type { Project } from '../core/project';

export type EdgeDirection = 'forward' | 'loop' | 'back';

export const EDGE_DIRECTION_COLORS: Record<EdgeDirection, string> = {
  forward: '#4ec97a',
  loop: '#dfff00',
  back: '#7896ff',
};

/**
 * 连线首先看画布上的左右推进方向：
 * - 指向右侧（含同列）的边是“前进”；
 * - 指向左侧的边若同时闭合了一个有向环，则归为“循环”；
 * - 其余指向左侧的边是“后退”。
 *
 * 这样一条环里的前进段仍保持前进色，只有回连段显示为循环色。
 */
export function classifyEdge(project: Project, sourceId: string, targetId: string): EdgeDirection {
  const source = project.pages.find((page) => page.id === sourceId);
  const target = project.pages.find((page) => page.id === targetId);
  if (!source || !target) return 'forward';
  if (target.position.x >= source.position.x) return 'forward';
  return canReach(project, targetId, sourceId) ? 'loop' : 'back';
}

function canReach(project: Project, startId: string, targetId: string) {
  const pages = new Map(project.pages.map((page) => [page.id, page]));
  const seen = new Set<string>();
  const queue = [startId];
  while (queue.length) {
    const id = queue.shift()!;
    if (id === targetId) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    const page = pages.get(id);
    if (!page) continue;
    for (const exit of page.exits) {
      if (exit.target && !seen.has(exit.target)) queue.push(exit.target);
    }
  }
  return false;
}
