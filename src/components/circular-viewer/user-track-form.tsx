"use client";

import { CircleHelp, FileUp, Plus } from "lucide-react";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  isUserPlotType,
  keepAccessions,
  maxUserFileBytes,
  parseUserTrack,
  userFileAccept,
  type ParsedUserTrack,
  type UserPlotType,
} from "@/lib/circular-viewer/user-track";
import { formatPrefixedErrorMessage } from "@/lib/utils";

const plotItems: Record<UserPlotType, string> = {
  tiles: "Tiles",
  line: "Line plot",
  histogram: "Histogram",
  heatmap: "Heatmap",
};

/** Legacy `TrackController`'s "Upload your own data" section. */
export function UserTrackForm({
  onAdd,
  genomeAccessions,
}: {
  onAdd: (plot: UserPlotType, parsed: ParsedUserTrack, fileName: string, name: string) => void;
  /** The drawn sequences' (contigs') accessions; undefined until they have loaded. */
  genomeAccessions: ReadonlySet<string> | undefined;
}) {
  const id = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [plot, setPlot] = useState<UserPlotType>("tiles");
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [reading, setReading] = useState(false);

  async function add() {
    if (file === null || genomeAccessions === undefined) return;
    if (file.size > maxUserFileBytes) {
      toast.error("User file format error: the file is larger than 20 MB.");
      return;
    }
    setReading(true);
    try {
      const text = await file.text();
      const read = parseUserTrack(text, plot);
      if (read.items.length === 0) {
        toast.error(
          plot === "tiles"
            ? "User file format error: no line has an accession, start and end separated by tabs."
            : parseUserTrack(text, "tiles").items.length > 0
              ? "User file format error: no line has an accession, start, end and score separated by tabs. A file of three columns can be shown as Tiles."
              : "User file format error: no line has an accession, start, end and score separated by tabs.",
        );
        return;
      }
      const { parsed, dropped } = keepAccessions(read, genomeAccessions);
      if (parsed.items.length === 0) {
        toast.error(`No line of ${file.name} is on a drawn sequence of this genome.`);
        return;
      }
      onAdd(plot, parsed, file.name, name);
      if (parsed.skipped > 0) {
        toast.warning(`Skipped ${String(parsed.skipped)} line(s) of ${file.name} that could not be read.`);
      }
      if (dropped > 0) {
        toast.warning(`Skipped ${String(dropped)} line(s) of ${file.name} that are not on a drawn sequence.`);
      }
      setFile(null);
      setName("");
      if (fileInput.current) fileInput.current.value = "";
    } catch (error) {
      toast.error(formatPrefixedErrorMessage(`Could not read ${file.name}`, error));
    } finally {
      setReading(false);
    }
  }

  return (
    <form
      aria-labelledby={`${id}-title`}
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        void add();
      }}
    >
      {/* A heading or label sits 8px above its control; fields are 12px apart. */}
      <div className="space-y-2">
        <div className="flex h-6 items-center gap-1">
          <h2 id={`${id}-title`} className="text-base font-semibold">Upload your own data</h2>
          <Popover>
            <PopoverTrigger
              render={
                <Button variant="ghost" size="icon-xs" aria-label="About uploaded tracks">
                  <CircleHelp className="size-4" />
                </Button>
              }
            />
            <PopoverContent className="w-80">
              <div className="space-y-2 text-xs">
                <p>
                  To show your data as Tiles, upload a text file with accession, start and end
                  positions separated by tabs, for example <code>NC_000962&#9;34&#9;1524</code>.
                </p>
                <p>
                  For a Line plot, Histogram or Heatmap, add a fourth column with a number, for
                  example <code>NC_000962&#9;3596001&#9;3598000&#9;0.6395</code>.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <Select
          items={plotItems}
          value={plot}
          onValueChange={(value) => {
            if (isUserPlotType(value)) setPlot(value);
          }}
        >
          <SelectTrigger size="sm" aria-label="Plot type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Object.entries(plotItems).map(([value, text]) => (
                <SelectItem key={value} value={value}>{text}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      {/* A button for the browser's file picker: the native control's "Choose
          File" reads as plain text on the card. The input stays in the form,
          hidden, and the button opens it; the name beside it says what is chosen. */}
      <div className="space-y-2">
        <Label id={`${id}-file-label`} htmlFor={`${id}-file-button`}>
          Data file
        </Label>
        <input
          ref={fileInput}
          type="file"
          accept={userFileAccept}
          tabIndex={-1}
          aria-hidden="true"
          className="hidden"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
          }}
        />
        <div className="flex min-w-0 items-center gap-2">
          <Button
            type="button"
            size="sm"
            id={`${id}-file-button`}
            aria-labelledby={`${id}-file-label ${id}-file-action`}
            aria-describedby={`${id}-file-name`}
            className="shrink-0"
            onClick={() => {
              fileInput.current?.click();
            }}
          >
            <FileUp aria-hidden="true" />
            <span id={`${id}-file-action`}>Choose file</span>
          </Button>
          <span
            id={`${id}-file-name`}
            title={file?.name}
            className={file === null ? "min-w-0 truncate text-sm text-muted-foreground" : "min-w-0 truncate text-sm"}
          >
            {file?.name ?? "No file chosen"}
          </span>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-name`}>Track name (optional)</Label>
        {/* The service forms' inline add button (`ServiceAddButton`'s look), but a
            submit: Enter in a field adds the track too. */}
        <div className="flex gap-2">
          <Input
            id={`${id}-name`}
            value={name}
            placeholder="Defaults to User track N"
            onChange={(event) => {
              setName(event.target.value);
            }}
          />
          <Button type="submit" variant="soft" size="icon" aria-label="Add user track" disabled={file === null || genomeAccessions === undefined || reading}>
            {reading ? <Spinner /> : <Plus />}
          </Button>
        </div>
      </div>
    </form>
  );
}
