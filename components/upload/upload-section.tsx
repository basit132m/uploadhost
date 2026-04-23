"use client";

import { useSession } from "next-auth/react";
import { UploadZone } from "./upload-zone";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface UploadSectionProps {
  maxFileSize?: number;
}

export function UploadSection({ maxFileSize }: UploadSectionProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="border-2 border-dashed rounded-xl p-12 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="border-2 border-dashed rounded-xl p-12 text-center space-y-4">
        <div className="text-5xl">📤</div>
        <p className="text-xl font-semibold">Sign in to upload files</p>
        <p className="text-muted-foreground">
          Create a free account to start uploading and sharing files
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild variant="outline">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get started free</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <UploadZone maxFileSize={maxFileSize} />;
}
