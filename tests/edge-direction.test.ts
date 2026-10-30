import test from 'node:test';
import assert from 'node:assert/strict';
import type { Project } from '../src/core/project.ts';
import { classifyEdge } from '../src/ui/edge-direction.ts';

function project(links: Record<string, string[]>, xs: Record<string, number>): Project {
  return {
    pages: Object.keys(xs).map((id) => ({
      id,
      position: { x: xs[id], y: 0 },
      exits: (links[id] ?? []).map((target, index) => ({
        id: `${id}-${index}`,
        label: '',
        target,
      })),
    })),
  } as unknown as Project;
}

test('rightward connections are forward', () => {
  const p = project({ a: ['b'] }, { a: 0, b: 200 });
  assert.equal(classifyEdge(p, 'a', 'b'), 'forward');
});

test('a leftward connection without a return path is back', () => {
  const p = project({ a: [], b: ['a'] }, { a: 0, b: 200 });
  assert.equal(classifyEdge(p, 'b', 'a'), 'back');
});

test('a leftward connection that closes a directed cycle is a loop', () => {
  const p = project({ a: ['b'], b: ['a'] }, { a: 0, b: 200 });
  assert.equal(classifyEdge(p, 'a', 'b'), 'forward');
  assert.equal(classifyEdge(p, 'b', 'a'), 'loop');
});

test('larger cycles classify only their return edge as a loop', () => {
  const p = project({ a: ['b'], b: ['c'], c: ['a'] }, { a: 0, b: 200, c: 400 });
  assert.equal(classifyEdge(p, 'a', 'b'), 'forward');
  assert.equal(classifyEdge(p, 'b', 'c'), 'forward');
  assert.equal(classifyEdge(p, 'c', 'a'), 'loop');
});

test('same-column connections stay forward and missing pages are safe', () => {
  const p = project({ a: ['b'], b: [] }, { a: 100, b: 100 });
  assert.equal(classifyEdge(p, 'a', 'b'), 'forward');
  assert.equal(classifyEdge(p, 'a', 'missing'), 'forward');
});
