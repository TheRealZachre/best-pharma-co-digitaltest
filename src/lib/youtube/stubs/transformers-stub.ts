export function pipeline() {
  throw new Error(
    "Local Whisper transcription is not available on Cloudflare Workers. Set TRANSCRIPTION_PROVIDER=openai and configure OPENAI_API_KEY."
  );
}
