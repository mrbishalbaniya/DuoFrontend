export async function register() {
  // Keep Node-only deps (e.g. @sentry/node) out of the Edge middleware bundle.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerNodeInstrumentation } = await import("./instrumentation-node");
    await registerNodeInstrumentation();
  }
}
