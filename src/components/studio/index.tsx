import dynamic from 'next/dynamic';

export * from './types';
export * from './archetype-mapper';
export * from './studio-adapter';

export const DynamicStudioViewer = dynamic(
  () => import('./StudioViewer').then((mod) => mod.StudioViewer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[680px] md:h-[760px] bg-[#faf9f6] border border-neutral-300 flex flex-col items-center justify-center font-editorial-mono text-neutral-500">
        <span className="w-2.5 h-2.5 rounded-full bg-neutral-400 animate-ping mb-3" />
        <span className="text-xs uppercase tracking-widest text-neutral-800">
          INITIALIZING 3D STUDIO AVATAR
        </span>
        <span className="text-[10px] text-neutral-400 mt-1">
          Loading procedural materials &amp; viewport
        </span>
      </div>
    ),
  }
);
