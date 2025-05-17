// GraphQL Queries
export const GET_USER_INFO = `
  query {
    user {
      id
      login
      firstName
      lastName
      campus
      auditRatio
    }
  }
`;

export const GET_XP_TRANSACTIONS = `
  query {
    transaction(where: { type: { _eq: "xp" } }) {
      amount
      createdAt
      path
    }
  }
`;

export const GET_PROJECT_RESULTS = `
  query {
    progress {
      grade
      path
      user {
        id
      }
    }
  }
`;

// Utility to send GraphQL queries
export async function queryGraphQL(query) {
  const jwt = localStorage.getItem('jwt');
  if (!jwt) throw new Error('No JWT found');
  const response = await fetch('https://01.gritlab.ax/api/graphql-engine/v1/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ query }),
  });
  const result = await response.json();
  if (result.errors) throw new Error(result.errors[0].message);
  return result.data;
}
