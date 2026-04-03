exports.handler = async (event) => {
  const { code } = event.queryStringParameters || {};

  if (!code) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing code" }) };
  }

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const data = await response.json();

  if (data.error) {
    return { statusCode: 400, body: JSON.stringify(data) };
  }

  return {
    statusCode: 302,
    headers: {
      Location: `/?token=${data.access_token}`,
    },
    body: "",
  };
};
