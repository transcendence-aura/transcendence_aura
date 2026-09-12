'use client';

import { Leaf } from 'lucide-react';

export function AuthSideBanner() {
  return (
    <div className="bg-bg-surface relative flex h-full min-h-[calc(100vh-56px)] flex-col items-center justify-center overflow-hidden p-12">
      <Leaf
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-text-primary/5"
        size={160}
        strokeWidth={1}
      />

      <div className="relative z-10 text-center">
        <p className="font-cormorant mb-3 text-2xl font-light italic leading-relaxed text-text-primary">
          « Your ritual,
          <br />
          beautifully restored. »
        </p>
        <p className="text-[10px] uppercase tracking-widest text-[#4a6a58]">Clean beauty · Aura</p>
      </div>
    </div>
  );
}
