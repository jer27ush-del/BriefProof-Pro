"use client";
import { Button, Notice } from "@/components/ui";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="container section">
      <h1>Let’s try that again.</h1>
      <Notice error>
        This page could not be loaded. Your saved project data has not been
        deleted.
      </Notice>
      <Button variant="primary" onClick={reset}>
        Reload this view
      </Button>
    </div>
  );
}
