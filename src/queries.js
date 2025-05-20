// GraphQL Queries
export const GET_USER_INFO = `
{
  user {
    id
    login
    firstName
    lastName
    campus
    auditRatio
    attrs
    xps {
      amount
      path
    }
  }
}
`;

export const GET_XP_TRANSACTIONS = `
query {
  transaction(
    where: {type: {_eq: "xp"}}
    order_by: {createdAt: desc}
    limit: 1000
  ) {
    amount
    createdAt
    path
  }
}
`;

export const GET_SKILLS = `
query {
  user {
    skills: transactions(
      order_by: [{type: desc}, {amount: desc}]
      distinct_on: [type]
      where: {type: {_like: "skill%"}}
    ) {
      type
      amount
      createdAt
    }
  }
}
`;

export async function queryGraphQL(query, jwt) {
  try {
    const response = await fetch('https://01.gritlab.ax/api/graphql-engine/v1/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ query }),
    });
    const result = await response.json();
    console.log('GraphQL response:', { query: query.substring(0, 50) + '...', status: response.status, result });
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }
    return result.data;
  } catch (err) {
    console.error('GraphQL query error:', err.message);
    throw err;
  }
}

export async function signin(username, password) {
  try {
    const authString = btoa(`${username}:${password}`);
    const response = await fetch('https://01.gritlab.ax/api/auth/signin', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
    });
    const responseText = await response.text();
    console.log('Signin response:', {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseText,
    });
    if (!response.ok) {
      throw new Error(`Signin failed: ${response.status} ${responseText || 'Invalid credentials'}`);
    }
    let jwt = responseText.trim().replace(/"/g, '');
    try {
      const parsed = JSON.parse(responseText);
      if (parsed.token) jwt = parsed.token;
    } catch (e) {
      // Not JSON, use cleaned text
    }
    console.log('Cleaned JWT:', jwt);
    if (!jwt.includes('.') || jwt.split('.').length !== 3) {
      throw new Error(`Invalid JWT format: ${jwt}`);
    }
    return jwt;
  } catch (err) {
    console.error('Signin error:', err.message);
    throw err;
  }
}
