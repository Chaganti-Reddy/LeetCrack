// netlify/functions/contests-proxy.js

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=300",
  };

  if (event.httpMethod === "OPTIONS")
    return { statusCode: 200, headers, body: "" };

  const { platform, handle } = event.queryStringParameters || {};

  try {
    if (platform === "cf") {
      const res = await fetch("https://codeforces.com/api/contest.list?gym=false", {
        headers: { "User-Agent": "AlgoTrack/1.0" },
      });
      if (!res.ok) throw new Error(`CF API returned ${res.status}`);
      const data = await res.json();
      if (data.status !== "OK") throw new Error(data.comment || "CF API error");
      return { statusCode: 200, headers, body: JSON.stringify(data.result) };
    }

    if (platform === "cf-history" && handle) {
      const res = await fetch(
        `https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`,
        { headers: { "User-Agent": "AlgoTrack/1.0" } }
      );
      if (!res.ok) throw new Error(`CF API returned ${res.status}`);
      const data = await res.json();
      if (data.status !== "OK") throw new Error(data.comment || "CF API error");
      return { statusCode: 200, headers, body: JSON.stringify(data.result) };
    }

    if (platform === "ac") {
      const res = await fetch("https://kenkoooo.com/atcoder/resources/contests.json", {
        headers: { "User-Agent": "AlgoTrack/1.0" },
      });
      if (!res.ok) throw new Error(`kenkoooo returned ${res.status}`);
      const data = await res.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    if (platform === "ac-history" && handle) {
      const urls = [
        `https://kenkoooo.com/atcoder/atcoder-api/v3/user/history?user=${encodeURIComponent(handle)}`,
        `https://atcoder-api.kenkoooo.com/history?user=${encodeURIComponent(handle)}`,
      ];
      for (const url of urls) {
        try {
          const res = await fetch(url, { headers: { "User-Agent": "AlgoTrack/1.0" } });
          if (res.status === 404) return { statusCode: 200, headers, body: JSON.stringify([]) };
          if (!res.ok) continue;
          const data = await res.json();
          return { statusCode: 200, headers, body: JSON.stringify(data) };
        } catch (_) { continue; }
      }
      return { statusCode: 200, headers, body: JSON.stringify([]) };
    }

    if (platform === "ac-user" && handle) {
      try {
        const res = await fetch(
          `https://atcoder.jp/users/${encodeURIComponent(handle)}/history/json`,
          { headers: { "User-Agent": "AlgoTrack/1.0" } }
        );
        if (!res.ok) return { statusCode: 200, headers, body: JSON.stringify({}) };
        const ratingRes = await fetch(
          `https://kenkoooo.com/atcoder/atcoder-api/v3/user/history?user=${encodeURIComponent(handle)}`,
          { headers: { "User-Agent": "AlgoTrack/1.0" } }
        );
        const ratingData = ratingRes.ok ? await ratingRes.json() : [];
        const rated = ratingData.filter((h) => h.IsRated);
        const currentRating = rated.length ? rated[rated.length - 1].NewRating : null;
        const peakRating = rated.length ? Math.max(...rated.map((h) => h.NewRating)) : null;
        return { statusCode: 200, headers, body: JSON.stringify({ currentRating, peakRating, contests: rated.length }) };
      } catch (_) {
        return { statusCode: 200, headers, body: JSON.stringify({}) };
      }
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid platform. Use cf, cf-history, ac, or ac-history." }),
    };
  } catch (err) {
    console.error("[contests-proxy] error:", err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};