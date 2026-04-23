"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";

interface CountryBlock { countryCode: string; countryName: string }

export function AdminCountryBlocker({ initialBlocks }: { initialBlocks: CountryBlock[] }) {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  async function addBlock() {
    if (!code || !name) return;
    const res = await fetch("/api/admin/country-blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ countryCode: code.toUpperCase(), countryName: name }),
    });
    if (res.ok) {
      setBlocks((prev) => [...prev, { countryCode: code.toUpperCase(), countryName: name }]);
      setCode(""); setName("");
      toast.success("Country blocked");
    }
  }

  async function removeBlock(countryCode: string) {
    const res = await fetch(`/api/admin/country-blocks/${countryCode}`, { method: "DELETE" });
    if (res.ok) {
      setBlocks((prev) => prev.filter((b) => b.countryCode !== countryCode));
      toast.success("Block removed");
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Country Blocking</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {blocks.length === 0 && (
            <p className="text-sm text-muted-foreground">No countries blocked.</p>
          )}
          {blocks.map((block) => (
            <Badge key={block.countryCode} variant="destructive" className="gap-1">
              {block.countryCode} - {block.countryName}
              <button onClick={() => removeBlock(block.countryCode)}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Country Code (ISO 2-letter)</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="US" className="w-20" maxLength={2} />
          </div>
          <div className="space-y-1 flex-1">
            <Label className="text-xs">Country Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="United States" />
          </div>
          <Button onClick={addBlock}>
            <Plus className="w-4 h-4 mr-1" /> Block
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
