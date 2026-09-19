"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Creator } from "@/lib/types";

export function useDeclaredWinner(id: string | null, known?: Creator | null) {
  const [fetched, setFetched] = useState<Creator | null>(null);
  useEffect(() => {
    if (!id || known?.id === id) return;
    let disposed = false;
    const refresh = async () => {
      const { data, error } = await createClient().from("creators").select("*").eq("id", id).maybeSingle();
      if (!disposed && !error) setFetched(data as Creator | null);
    };
    const retry = () => { void refresh().catch(() => {}); };
    retry();
    const interval = setInterval(retry, 30000);
    return () => { disposed = true; clearInterval(interval); };
  }, [id, known?.id]);
  return known?.id === id ? known : fetched?.id === id ? fetched : null;
}
