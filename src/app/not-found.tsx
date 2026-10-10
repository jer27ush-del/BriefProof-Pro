import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container section">
      <p className="eyebrow">404 / Not found</p>
      <h1>
        This page has
        <br />a different direction.
      </h1>
      <p>That creator or project could not be found.</p>
      <Link className="button primary" href="/discover">
        Explore creators
      </Link>
    </div>
  );
}
