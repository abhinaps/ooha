import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.MAILCHIMP_API_KEY;
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    console.error("Missing Mailchimp environment variables");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  // Extract server from API key (format: key-server)
  const server = apiKey.split("-")[1];
  const url = `https://${server}.api.mailchimp.com/3.0/lists/${audienceId}/members`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: email,
        status: "pending",
        tags: ["OOHA Prelaunch"],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Check if email already exists
      if (response.status === 400 && data.title === "Member Exists") {
        return NextResponse.json(
          { message: "Email already subscribed!" },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { error: data.detail || "Failed to subscribe" },
        { status: response.status }
      );
    }

    return NextResponse.json(
      { message: "Successfully subscribed!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Mailchimp subscription error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
