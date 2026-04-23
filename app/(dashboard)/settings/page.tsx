import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true, twoFactorEnabled: true, apiEnabled: true },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences</p>
      </div>

      <div className="grid gap-4">
        {[
          {
            title: "Profile Information",
            desc: "Update your name, bio, and profile picture",
            href: "/profile",
          },
          {
            title: "Security",
            desc: `2FA is ${user?.twoFactorEnabled ? "enabled" : "disabled"} · Change password`,
            href: "/profile",
          },
          {
            title: "API Access",
            desc: user?.apiEnabled ? "API access enabled · View your API key" : "API access disabled · Contact admin to enable",
            href: "/profile",
          },
        ].map((item) => (
          <Link key={item.href + item.title} href={item.href}>
            <Card className="hover:bg-muted/30 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-base">{item.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
