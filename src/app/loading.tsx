import { LoaderCircle } from "lucide-react";
export default function Loading() {
  return (
    <div className="loading-page" role="status">
      <span>
        <LoaderCircle className="spin" /> Loading your next creative step…
      </span>
    </div>
  );
}
