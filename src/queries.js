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
  if (!result.data) throw new Error('No data returned from GraphQL query');
  return result.data;
}
