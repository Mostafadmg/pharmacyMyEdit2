import { Link } from "wouter";
import { PmrShell } from "@/components/pmr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PmrShell className="max-w-lg">
      <Card className="p-10 text-center">
        <h1 className="pmr-page-title">Page not found</h1>
        <p className="pmr-meta mt-2 mb-6">
          That route does not exist in EveryDayMeds PMR.
        </p>
        <Link href="/">
          <Button>Back to dashboard</Button>
        </Link>
      </Card>
    </PmrShell>
  );
}
