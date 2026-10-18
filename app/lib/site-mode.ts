// comingSoon is true only for the main deployment. Staging and dev keep the full site.
export function comingSoon() {
  return (
    process.env.VERCEL_GIT_COMMIT_REF === "main" ||
    process.env.RAILWAY_GIT_BRANCH === "main" ||
    process.env.RAILWAY_ENVIRONMENT_NAME === "main"
  );
}
