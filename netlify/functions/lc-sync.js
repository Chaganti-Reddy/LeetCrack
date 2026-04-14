exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS")
    return { statusCode: 200, headers, body: "" };

  const { username, session } = event.queryStringParameters || {};
  if (!username)
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "username required" }),
    };

  const lcHeaders = {
    "Content-Type": "application/json",
    Referer: "https://leetcode.com",
    Origin: "https://leetcode.com",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  };

  if (session) {
    const cookieStr = session.includes("LEETCODE_SESSION=")
      ? session
      : `LEETCODE_SESSION=${session}`;
    lcHeaders["Cookie"] = cookieStr;
    const csrfMatch = cookieStr.match(/csrftoken=([^;]+)/);
    if (csrfMatch) lcHeaders["x-csrftoken"] = csrfMatch[1].trim();
  }

  const fetchPage = async (offset) => {
    const query = `query submissions($offset: Int!, $limit: Int!) {
      submissionList(offset: $offset, limit: $limit) {
        hasNext
        submissions { statusDisplay titleSlug timestamp }
      }
    }`;
    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: lcHeaders,
      body: JSON.stringify({ query, variables: { offset, limit: 20 } }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} at offset ${offset}`);
    const data = await res.json();
    if (data.errors)
      throw new Error(data.errors[0]?.message || "GraphQL error");
    return data?.data?.submissionList;
  };

  try {
    if (session) {
      const first = await fetchPage(0);
      if (!first) throw new Error("No data returned from LeetCode");

      const allSubmissions = [...first.submissions];
      let hasMore = first.hasNext;
      let offset = 20;

      while (hasMore) {
        const batchOffsets = [];
        for (let i = 0; i < 5 && hasMore; i++) {
          batchOffsets.push(offset);
          offset += 20;
          hasMore = offset < 2000; 
        }

        const results = await Promise.all(
          batchOffsets.map((o) => fetchPage(o)),
        );

        for (const page of results) {
          if (!page || page.submissions.length === 0) {
            hasMore = false;
            break;
          }
          allSubmissions.push(...page.submissions);
          if (!page.hasNext) {
            hasMore = false;
          }
        }
      }

      const accepted = allSubmissions
        .filter((s) => s.statusDisplay === "Accepted")
        .map((s) => ({ titleSlug: s.titleSlug, timestamp: s.timestamp }));

      console.log(
        `[lc-sync] total: ${allSubmissions.length} submissions, ${accepted.length} accepted`,
      );
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ recentAcSubmissionList: accepted }),
      };
    } else {
      const query = `query acList($username: String!) {
        recentAcSubmissionList(username: $username, limit: 20) {
          titleSlug timestamp
        }
      }`;
      const res = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: lcHeaders,
        body: JSON.stringify({ query, variables: { username } }),
      });
      if (!res.ok)
        return {
          statusCode: res.status,
          headers,
          body: JSON.stringify({ error: `LeetCode returned ${res.status}` }),
        };
      const data = await res.json();
      if (data.errors || !data.data)
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: "User not found or profile is private",
          }),
        };
      const count = data.data?.recentAcSubmissionList?.length ?? 0;
      console.log(`[lc-sync] returned ${count} submissions (no session)`);
      const avatarRes = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: lcHeaders,
        body: JSON.stringify({
          query: `query($username: String!) {
            matchedUser(username: $username) {
              profile { userAvatar ranking }
              submitStatsGlobal {
                acSubmissionNum { difficulty count }
              }
            }
          }`,
          variables: { username },
        }),
      });
      const avatarData = await avatarRes.json();
      const matchedUser = avatarData?.data?.matchedUser;
      const userAvatar = matchedUser?.profile?.userAvatar || null;
      const ranking = matchedUser?.profile?.ranking || null;
      const acNums = matchedUser?.submitStatsGlobal?.acSubmissionNum || [];
      const solvedCount =
        acNums.find((x) => x.difficulty === "All")?.count ?? null;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ...data.data,
          userAvatar,
          ranking,
          solvedCount,
        }),
      };
    }
  } catch (err) {
    console.log("[lc-sync] error:", err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};