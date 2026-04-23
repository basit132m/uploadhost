import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FileManager } from "@/components/files/file-manager";

export default async function FilesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Files</h1>
        <p className="text-muted-foreground">Manage and organize your uploaded files</p>
      </div>
      <FileManager />
    </div>
  );
}
