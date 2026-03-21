export async function onRequestPost(context) {
  const { request, env } = context;

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  try {
    const body = await request.json();
    const {
      event_name = "Lead",
      event_id,
      page_url,
      client_user_agent,
      fbp,
      fbc
    } = body || {};

    if (!event_id) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing event_id" }),
        { status: 400, headers }
      );
    }

    const pixelId = env.META_PIXEL_ID;
    const accessToken = env.META_ACCESS_TOKEN;

    if (!pixelId || !accessToken) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing META_PIXEL_ID or META_ACCESS_TOKEN" }),
        { status: 500, headers }
      );
    }

    const ip =
      request.headers.get("CF-Connecting-IP") ||
      request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
      "";

    const payload = {
      data: [
        {
          event_name,
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          event_source_url: page_url || "",
          event_id,
          user_data: {
            client_ip_address: ip,
            client_user_agent: client_user_agent || request.headers.get("user-agent") || "",
            fbp: fbp || undefined,
            fbc: fbc || undefined
          }
        }
      ]
    };

    const url = `https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${accessToken}`;

    const metaRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const metaJson = await metaRes.json();

    return new Response(
      JSON.stringify({
        ok: metaRes.ok,
        sent: payload,
        meta: metaJson
      }),
      {
        status: metaRes.ok ? 200 : 500,
        headers
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: error.message || "Unknown error"
      }),
      { status: 500, headers }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    }
  });
}
