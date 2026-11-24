import { useQuery } from "@tanstack/react-query";
import type { Track } from "@/shared/config/app";
import { getDashboard } from "../api";

export const useDashboard = (track: Track) =>
  useQuery({ queryKey: ["dashboard", track], queryFn: () => getDashboard(track) });
