export default function Policies() {
  return (
    <div className="container section setup-content">
      <p className="eyebrow">A transparent starting point</p>
      <h1>
        Privacy, data and
        <br />
        <em>clear expectations.</em>
      </h1>
      <h2>Your account and project data</h2>
      <p>
        Authentication is handled by your configured Supabase project. Private
        briefs, campaigns, bookmarks, evaluations and images are stored in
        Supabase with user ownership policies. Passwords are managed by Supabase
        Auth; BriefProof does not store plaintext passwords.
      </p>
      <h2>When AI is used</h2>
      <p>
        AI requests are sent through the server to OpenAI only when you use an
        AI action. Text features send the supplied brief and relevant creator or
        production information. Vision review sends the selected reference and
        campaign frames. The application requests that Responses are not stored,
        but provider retention and security policies still apply. Do not upload
        information you are not authorized to share.
      </p>
      <h2>Sample content</h2>
      <p>
        Creator identities, experience, availability, rates and portfolio work
        are fictional. Portraits and creative studies are AI-generated. No
        client endorsements, real reviews or independent credentials are
        implied.
      </p>
      <h2>Human review is essential</h2>
      <p>
        AI suggestions can be incomplete or inaccurate. Production declarations
        are not independent verification. LicenseGuard provides decision
        support, not legal advice or commercial-use clearance. Final acceptance
        records a brand decision, not a legal guarantee.
      </p>
      <h2>Deletion and retention</h2>
      <p>
        Deleting a campaign removes its brief, milestone records and associated
        evaluation records. Uploaded image objects may remain in your private
        bucket until removed through Supabase storage administration. Account
        deletion and production retention policies must be configured by the
        application operator.
      </p>
      <h2>Before a public launch</h2>
      <p>
        This project is a configurable hackathon application. The operator
        should establish appropriate privacy notices, retention practices,
        support contacts, marketplace terms and operational safeguards before
        accepting real customer work.
      </p>
    </div>
  );
}
