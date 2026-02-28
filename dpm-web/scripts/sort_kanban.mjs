// Moves GitHub Project v2 items to correct status columns based on issue title emoji prefix
// ✅ = Done, 🔵 = In Progress, ⬜ = Todo, no prefix = keep in Backlog

const TOKEN = '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';
const PROJECT_ID = 'PVT_kwHODMGE0c4BPxHx';
const STATUS_FIELD_ID = 'PVTSSF_lAHODMGE0c4BPxHxzg-FQRA';

// Status option IDs from the project
const STATUS = {
  done: '98236657',
  inprogress: '47fc9ee4',
  backlog: 'f75ad846', // Todo stays as Backlog for now
};

async function gql(query, variables = {}) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

async function getProjectItems() {
  const query = `
    query($projectId: ID!, $cursor: String) {
      node(id: $projectId) {
        ... on ProjectV2 {
          items(first: 50, after: $cursor) {
            pageInfo { hasNextPage endCursor }
            nodes {
              id
              content {
                ... on Issue {
                  number
                  title
                }
              }
            }
          }
        }
      }
    }
  `;

  const result = await gql(query, { projectId: PROJECT_ID });
  return result?.data?.node?.items?.nodes || [];
}

async function setStatus(itemId, optionId) {
  const mutation = `
    mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
      updateProjectV2ItemFieldValue(input: {
        projectId: $projectId
        itemId: $itemId
        fieldId: $fieldId
        value: { singleSelectOptionId: $optionId }
      }) {
        projectV2Item { id }
      }
    }
  `;
  return gql(mutation, {
    projectId: PROJECT_ID,
    itemId,
    fieldId: STATUS_FIELD_ID,
    optionId,
  });
}

function getTargetStatus(title) {
  if (title.startsWith('✅')) return STATUS.done;
  if (title.startsWith('🔵')) return STATUS.inprogress;
  return STATUS.backlog; // ⬜ Todo stays as Backlog
}

async function main() {
  console.log('📂 Fetching project items...');
  const items = await getProjectItems();
  console.log(`   Found ${items.length} items\n`);

  for (const item of items) {
    const title = item.content?.title;
    const issueNum = item.content?.number;
    if (!title) { console.log('  ⚠️  Skipping item with no issue content'); continue; }

    const targetStatusId = getTargetStatus(title);
    const statusLabel = targetStatusId === STATUS.done ? '✅ Done'
      : targetStatusId === STATUS.inprogress ? '🔵 In Progress'
        : '⬜ Backlog';

    const result = await setStatus(item.id, targetStatusId);
    if (result?.data?.updateProjectV2ItemFieldValue?.projectV2Item?.id) {
      console.log(`  ✅ #${issueNum}: ${statusLabel} — ${title.substring(0, 60)}`);
    } else {
      console.log(`  ❌ Failed #${issueNum}: ${JSON.stringify(result?.errors?.[0]?.message)}`);
    }

    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\n🎉 Board sorted! View at: https://github.com/users/ZumiCoWorks/projects/3/views/1');
}

main().catch(console.error);
