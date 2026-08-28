async function isServerRunning(): Promise<boolean> {
  const serverUrl =
    process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3007";

  try {
    const response = await fetch(`${serverUrl}/status`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return false;
    }

    const data: unknown = await response.json();

    return (
      typeof data === "object" &&
      data !== null &&
      "status" in data &&
      (data as { status: unknown }).status === "ok"
    );
  } catch {
    return false;
  }
}

export default async function Home() {
  const serverRunning = await isServerRunning();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 p-8">
      <p className="text-lg font-medium">App is running</p>
      {serverRunning ? (
        <p className="text-lg font-medium">server is running</p>
      ) : null}
    </main>
  );
}
