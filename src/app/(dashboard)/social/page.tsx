import { ArrowRight } from "lucide-react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { socialDataSource } from "@/lib/social/data";

export default function SocialPage() {
  return (
    <div>
      <PageHeader
        title="Social"
        description="Reach and engagement on Instagram, Facebook and YouTube."
        dataSource={socialDataSource}
      >
        {/* LinkedIn isn't on this page: it has its own, with ads and Company Page together.
            min-h-11 (44px) keeps the link easy to tap on a phone. */}
        <Link
          href="/linkedin"
          className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          LinkedIn has its own page
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </PageHeader>
    </div>
  );
}
