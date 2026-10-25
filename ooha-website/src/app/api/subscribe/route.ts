import { NextRequest, NextResponse } from "next/server";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim();

  if (!email || !emailPattern.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const apiKey = process.env.MAILCHIMP_API_KEY;
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    console.error("Email subscription is unavailable: Mailchimp environment variables are missing.");
    return NextResponse.json(
      { error: "Email signups are temporarily unavailable. Please try again later." },
      { status: 503 },
    );
  }

  try {
    const server = apiKey.split("-")[1];
    const url = `https://${server}.api.mailchimp.com/3.0/lists/${audienceId}/members`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: email,
        status: "subscribed",
        tags: ["OOHA Prelaunch"],
      }),
    });

    const data = (await response.json().catch(() => ({}))) as { title?: string; detail?: string };

    if (!response.ok) {
      if (response.status === 400 && data.title === "Member Exists") {
        return NextResponse.json({ message: "Email already subscribed." }, { status: 200 });
      }

      return NextResponse.json({ error: data.detail ?? "Failed to subscribe." }, { status: response.status });
    }

    return NextResponse.json({ message: "Thanks! You are on the OOHA prelaunch list." }, { status: 200 });
  } catch (error) {
    console.error("Mailchimp subscription error:", error);
    return NextResponse.json(
      { error: "Unable to submit your email right now. Please try again later." },
      { status: 502 },
    );
  }
}
