import { Check, Copy, Eye, Radio, Search, StopCircle, User } from "lucide-react";
import { RefObject, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { StreamObsConfig } from "../types";

type StreamExperienceProps = {
  knownStreamHostId: string | null;
  liveStreamTitle: string | null;
  obsConfig: StreamObsConfig | null;
  obsIngestPreview: string | null;
  obsServerDraft: string;
  obsStreamKeyDraft: string;
  onFindStream: () => void;
  onObsServerDraftChange: (value: string) => void;
  onObsStreamKeyDraftChange: (value: string) => void;
  onStartBroadcast: () => void;
  onStopBroadcast: () => void;
  streamMode: "idle" | "hosting" | "watching";
  streamPlaybackUrl: string | null;
  streamPlaybackVideoRef: RefObject<HTMLVideoElement | null>;
  streamTitleDraft: string;
  streamViewerCount: number;
  onStreamTitleDraftChange: (title: string) => void;
};

export function StreamExperience({
  knownStreamHostId,
  liveStreamTitle,
  obsConfig,
  obsIngestPreview,
  obsServerDraft,
  obsStreamKeyDraft,
  onFindStream,
  onObsServerDraftChange,
  onObsStreamKeyDraftChange,
  onStartBroadcast,
  onStopBroadcast,
  onStreamTitleDraftChange,
  streamMode,
  streamPlaybackUrl,
  streamPlaybackVideoRef,
  streamTitleDraft,
  streamViewerCount,
}: StreamExperienceProps) {
  const isHosting = streamMode === "hosting";
  const hasLiveStream = Boolean(streamPlaybackUrl);
  const [copiedField, setCopiedField] = useState<"server" | "key" | "ingest" | null>(null);

  const serverValue =
    obsServerDraft.trim().length > 0 ? obsServerDraft.trim() : (obsConfig?.server_url ?? "");
  const streamKeyValue =
    obsStreamKeyDraft.trim().length > 0 ? obsStreamKeyDraft.trim() : (obsConfig?.stream_key ?? "");
  const ingestValue = obsIngestPreview ?? "";

  async function handleCopy(value: string, field: "server" | "key" | "ingest"): Promise<void> {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => {
        setCopiedField((current) => (current === field ? null : current));
      }, 1200);
    } catch {
      // Ignore clipboard errors.
    }
  }

  return (
    <Card className="bg-black/20 border-white/5 backdrop-blur-sm overflow-hidden">
      <CardHeader className="flex flex-col gap-3 p-4 pb-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "p-1.5 rounded-lg",
                hasLiveStream ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary",
              )}
            >
              <Radio size={16} className={hasLiveStream ? "animate-pulse" : ""} />
            </div>
            <CardTitle className="text-base font-bold">
              {isHosting ? "Live Broadcast (OBS)" : "Stream Discovery"}
            </CardTitle>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-white/5 text-muted-foreground flex gap-1 items-center border-white/5 h-5 text-[10px]"
            >
              <User size={10} />
              Host: {knownStreamHostId ? knownStreamHostId.slice(0, 8) : "none"}
            </Badge>
            <Badge
              variant="outline"
              className="bg-white/5 text-muted-foreground flex gap-1 items-center border-white/5 h-5 text-[10px]"
            >
              <Eye size={10} />
              {streamViewerCount} viewers
            </Badge>
          </div>
        </div>

        <div className="flex gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
          <Input
            className="flex-1 bg-transparent border-none focus-visible:ring-0 text-xs h-8"
            onChange={(event) => onStreamTitleDraftChange(event.target.value)}
            placeholder="Give your stream a title"
            value={streamTitleDraft}
          />
          <div className="flex gap-1.5">
            {isHosting ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={onStopBroadcast}
                className="gap-1.5 font-bold shadow-lg shadow-red-500/10 h-8 text-[11px]"
              >
                <StopCircle size={14} />
                Stop
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={onStartBroadcast}
                className="gap-1.5 font-bold shadow-lg shadow-primary/10 bg-primary hover:bg-primary/90 h-8 px-3 text-[11px]"
              >
                <Radio size={14} />
                Go Live (OBS)
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onFindStream}
              className="h-8 w-8 p-0 border-white/10"
            >
              <Search size={14} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-3">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 space-y-2">
            <h3 className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground px-1">
              Live Player
            </h3>
            <div className="relative aspect-video bg-black/60 rounded-xl border border-white/5 overflow-hidden shadow-2xl group transition-all hover:border-white/10">
              <video
                autoPlay
                className="w-full h-full object-cover"
                controls
                muted={isHosting}
                playsInline
                ref={streamPlaybackVideoRef}
              />
              {!hasLiveStream && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <p className="text-xs text-muted-foreground">No live stream in this room yet.</p>
                </div>
              )}
              {hasLiveStream && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-600/90 text-white animate-pulse shadow-lg">
                  <Radio size={10} />
                  <span className="text-[9px] font-black uppercase tracking-tighter">Live</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground px-1">
              OBS Setup
            </h3>
            <div className="relative rounded-xl border border-white/5 bg-black/40 p-3 space-y-3 text-[10px]">
              <div>
                <p className="text-muted-foreground mb-1">Title</p>
                <p className="font-semibold">{liveStreamTitle ?? streamTitleDraft}</p>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-muted-foreground">Server</p>
                  <Button
                    className="h-5 px-1.5 text-[9px] border-white/10"
                    disabled={!serverValue}
                    onClick={() => {
                      handleCopy(serverValue, "server").catch(() => {
                        // Ignore copy errors.
                      });
                    }}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {copiedField === "server" ? <Check size={10} /> : <Copy size={10} />}
                    {copiedField === "server" ? "Copied" : "Copy"}
                  </Button>
                </div>
                <Input
                  className="h-7 text-[10px] font-mono"
                  onChange={(event) => onObsServerDraftChange(event.target.value)}
                  placeholder={obsConfig?.server_url ?? "rtmp://localhost:1935/live"}
                  value={obsServerDraft}
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-muted-foreground">Stream key</p>
                  <Button
                    className="h-5 px-1.5 text-[9px] border-white/10"
                    disabled={!streamKeyValue}
                    onClick={() => {
                      handleCopy(streamKeyValue, "key").catch(() => {
                        // Ignore copy errors.
                      });
                    }}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {copiedField === "key" ? <Check size={10} /> : <Copy size={10} />}
                    {copiedField === "key" ? "Copied" : "Copy"}
                  </Button>
                </div>
                <Input
                  className="h-7 text-[10px] font-mono"
                  onChange={(event) => onObsStreamKeyDraftChange(event.target.value)}
                  placeholder={obsConfig?.stream_key ?? "Enter stream key"}
                  value={obsStreamKeyDraft}
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-muted-foreground">Ingest URL</p>
                  <Button
                    className="h-5 px-1.5 text-[9px] border-white/10"
                    disabled={!ingestValue}
                    onClick={() => {
                      handleCopy(ingestValue, "ingest").catch(() => {
                        // Ignore copy errors.
                      });
                    }}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {copiedField === "ingest" ? <Check size={10} /> : <Copy size={10} />}
                    {copiedField === "ingest" ? "Copied" : "Copy"}
                  </Button>
                </div>
                <p className="font-mono break-all">{obsIngestPreview ?? "Provide server + key"}</p>
              </div>
              <p className="text-[9px] text-muted-foreground/70 leading-relaxed">
                In OBS: Settings → Stream, choose Custom, paste Server + Stream Key, then start
                streaming.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
