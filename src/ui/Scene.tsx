import React, { useEffect, useRef, useState } from 'react';
import type { Project, Page, Layer } from '../core/project';
import { assetURL } from './api';
export function Scene({
  project,
  page,
  animate = false,
  onSelect,
  selected,
  editing = false,
  onMove,
  missing,
}: {
  project: Project;
  page: Page;
  animate?: boolean;
  onSelect?: (id: string) => void;
  selected?: string;
  editing?: boolean;
  onMove?: (id: string, patch: Partial<Layer>) => void;
  missing?: string[];
}) {
  const container = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [drag, setDrag] = useState<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [failed, setFailed] = useState<string[]>([]);
  const missingIds = new Set([...(missing ?? []), ...failed]);
  const lost = (id?: string) =>
    !id || !project.assets.some((a) => a.id === id) || missingIds.has(id);
  useEffect(() => {
    const el = container.current!;
    const o = new ResizeObserver(() =>
      setScale(Math.min(el.clientWidth / project.width, el.clientHeight / project.height)),
    );
    o.observe(el);
    return () => o.disconnect();
  }, [project.width, project.height]);
  function pointer(e: React.PointerEvent, l: Layer, resize = false) {
    if (!editing) return;
    e.stopPropagation();
    onSelect?.(l.id);
    e.currentTarget.setPointerCapture(e.pointerId);
    const sx = e.clientX,
      sy = e.clientY;
    let patch: Partial<Layer> = {};
    const target = e.currentTarget;
    const move = (event: Event) => {
      const ev = event as PointerEvent;
      const dx = (ev.clientX - sx) / scale,
        dy = (ev.clientY - sy) / scale;
      patch = resize
        ? { width: Math.max(20, l.width + dx), height: Math.max(20, l.height + dy) }
        : { x: l.x + dx, y: l.y + dy };
      setDrag({ ...l, ...patch });
    };
    const finish = () => {
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', finish);
      target.removeEventListener('pointercancel', cancel);
      setDrag(null);
      if (Object.keys(patch).length) onMove?.(l.id, patch);
    };
    const cancel = () => {
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', finish);
      target.removeEventListener('pointercancel', cancel);
      setDrag(null);
    };
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', finish);
    target.addEventListener('pointercancel', cancel);
  }
  return (
    <div className="scene-fit" ref={container}>
      <div
        className="scene-space"
        style={{ width: project.width * scale, height: project.height * scale }}
      >
        <div
          className="scene"
          style={{
            width: project.width,
            height: project.height,
            transform: `scale(${scale})`,
            background: page.background,
          }}
          onPointerDown={() => onSelect?.('')}
        >
          {page.layers
            .filter((l) => l.visible)
            .map((original) => {
              const l = drag?.id === original.id ? { ...original, ...drag } : original;
              return (
                <div
                  key={l.id}
                  data-layer={l.id}
                  className={`layer ${editing ? 'editable' : ''} ${selected === l.id ? 'selected' : ''}`}
                  onPointerDown={(e) => pointer(e, l)}
                  style={{
                    left: l.x,
                    top: l.y,
                    width: l.width,
                    height: l.height,
                    fontSize: l.fontSize,
                    color: l.color,
                    textAlign: l.align,
                    animation:
                      animate && l.effect.type === 'fade'
                        ? `layer-in ${l.effect.duration}s ease both`
                        : undefined,
                  }}
                >
                  {l.type === 'image' ? (
                    lost(l.assetId) ? (
                      <div className="scene-missing" title="图片文件缺失，请在图层列表中选择替换">
                        <span>图片缺失</span>
                        <small>请替换素材</small>
                      </div>
                    ) : (
                      <img
                        src={assetURL(project, l.assetId!)}
                        draggable={false}
                        alt={l.name}
                        onError={() => {
                          const id = l.assetId;
                          if (id) setFailed((f) => (f.includes(id) ? f : [...f, id]));
                        }}
                      />
                    )
                  ) : (
                    <div className="text-content">{l.text}</div>
                  )}
                  {editing && selected === l.id && (
                    <button
                      className="resize-handle"
                      aria-label="调整图层大小"
                      onPointerDown={(e) => pointer(e, l, true)}
                    />
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
export function Player({
  snapshot,
  startId,
  currentRevision,
  onClose,
  missing,
}: {
  snapshot: Project;
  startId: string;
  currentRevision: number;
  onClose: () => void;
  missing?: string[];
}) {
  const [pageId, setPageId] = useState(startId),
    [entry, setEntry] = useState(0),
    [nextId, setNextId] = useState<string | null>(null),
    [error, setError] = useState('');
  const busy = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audio = useRef<HTMLAudioElement[]>([]);
  const page = snapshot.pages.find((p) => p.id === pageId)!;
  function stop() {
    audio.current.forEach((a) => {
      a.pause();
      a.currentTime = 0;
      a.src = '';
    });
    audio.current = [];
  }
  useEffect(() => {
    if (nextId) return;
    let cancelled = false;
    setError('');
    for (const [track, loop] of [
      [page.music, true],
      [page.voice, false],
    ] as const) {
      if (track) {
        const a = new Audio(assetURL(snapshot, track.assetId));
        a.loop = loop;
        a.volume = track.volume;
        audio.current.push(a);
        a.play().catch(() => {
          if (!cancelled) setError('部分音频无法播放，请检查素材。');
        });
      }
    }
    return () => {
      cancelled = true;
      stop();
    };
  }, [pageId, entry, nextId]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      stop();
    },
    [],
  );
  function navigate(id: string) {
    if (busy.current) return;
    const target = snapshot.pages.find((p) => p.id === id);
    if (!target) return;
    busy.current = true;
    stop();
    const finish = () => {
      setPageId(id);
      setEntry((x) => x + 1);
      setNextId(null);
      busy.current = false;
    };
    if (target.transition.type === 'fade') {
      setNextId(id);
      timer.current = setTimeout(finish, target.transition.duration * 1000);
    } else finish();
  }
  const next = snapshot.pages.find((p) => p.id === nextId);
  return (
    <div className="player">
      <header>
        <div>
          <span className="eyebrow">阅读预览</span>
          <strong>{snapshot.name}</strong>
          <span className="muted"> / {page.name}</span>
        </div>
        <button onClick={onClose}>退出预览 Esc</button>
      </header>
      {currentRevision !== snapshot.revision && (
        <div className="notice">工程已更新，重新预览后生效</div>
      )}
      <div className="player-stage">
        <div className="player-scene" key={pageId + ':' + entry}>
          <Scene project={snapshot} page={page} animate={!next} missing={missing} />
        </div>
        {next && (
          <div
            className="player-scene incoming"
            style={{ animationDuration: `${next.transition.duration}s` }}
          >
            <Scene project={snapshot} page={next} missing={missing} />
          </div>
        )}
      </div>
      <footer>
        <span className="muted">{error || '选择一个方向，让故事继续'}</span>
        <div className="choices">
          {page.exits.length ? (
            page.exits.map((e) => (
              <button
                key={e.id}
                disabled={!!nextId || !e.target}
                title={!e.target ? '此出口尚未连接目标页面' : ''}
                onClick={() => e.target && navigate(e.target)}
              >
                {e.label || '继续'}
                {!e.target ? ' · 未连接' : ''}
              </button>
            ))
          ) : (
            <>
              <span>本次阅读结束</span>
              <button
                disabled={!snapshot.startPageId || !!nextId}
                onClick={() => snapshot.startPageId && navigate(snapshot.startPageId)}
              >
                从头开始
              </button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
