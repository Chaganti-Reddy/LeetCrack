// netlify/functions/ac-sync.js
//
// Proxies AtCoder submission data from kenkoooo.com/atcoder to avoid CORS.
// kenkoooo's API is public but blocks browser cross-origin requests.
//
// Usage: /.netlify/functions/ac-sync?user=HANDLE
//   → returns JSON array of all user submissions from kenkoooo

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS")
    return { statusCode: 200, headers, body: "" };

  const { user } = event.queryStringParameters || {};
  if (!user) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "user parameter required" }),
    };
  }

  const AC_BASE = "https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions";
  const PAGE_SIZE = 500;

  const fetchHeaders = {
    "User-Agent": "AlgoTrack/1.0 (Netlify proxy)",
    "Accept": "application/json",
  };

  try {
    const allSubmissions = [];
    let fromSecond = 0;

    for (let page = 0; page < 60; page++) {
      const url = `${AC_BASE}?user=${encodeURIComponent(user)}&from_second=${fromSecond}`;
      const res = await fetch(url, { headers: fetchHeaders });

      if (res.status === 404) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "AtCoder user not found" }),
        };
      }
      if (!res.ok) {
        throw new Error(`kenkoooo returned HTTP ${res.status}`);
      }

      const page_data = await res.json();
      if (!Array.isArray(page_data) || page_data.length === 0) break;

      allSubmissions.push(...page_data);

      if (page_data.length < PAGE_SIZE) break;

      const maxEpoch = Math.max(...page_data.map((s) => s.epoch_second));
      fromSecond = maxEpoch + 1;
    }

    console.log(`[ac-sync] user=${user} total=${allSubmissions.length}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(allSubmissions),
    };
  } catch (err) {
    console.error("[ac-sync] error:", err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};