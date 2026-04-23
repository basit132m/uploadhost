import Link from "next/link";

interface FooterProps {
  siteName?: string;
  pages?: { slug: string; title: string }[];
}

export function Footer({ siteName = "UploadHost", pages = [] }: FooterProps) {
  return (
    <footer className="border-t bg-background/50 mt-auto">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
          <nav className="flex items-center gap-4 flex-wrap justify-center">
            {pages.map((page) => (
              <Link
                key={page.slug}
                href={`/p/${page.slug}`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {page.title}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
